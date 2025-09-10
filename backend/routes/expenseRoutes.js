import express from "express";
import Expense from "../models/Expenses.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Add Expense
router.post("/", verifyToken, async (req, res) => {
  try {
    const { amount, category, description, paidBy, splitAmong, splitType, splitDetails } = req.body;
    
    // Validation
    if (!amount || !category || !description || !paidBy || !splitAmong?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Calculate split details based on type
    let finalSplitDetails = [];
    
    if (splitType === 'equal' || !splitType) {
      const sharePerPerson = amount / splitAmong.length;
      finalSplitDetails = splitAmong.map(userId => ({
        user: userId,
        amount: sharePerPerson
      }));
    } else if (splitType === 'exact') {
      finalSplitDetails = splitDetails;
      // Validate that total equals expense amount
      const total = splitDetails.reduce((sum, detail) => sum + detail.amount, 0);
      if (Math.abs(total - amount) > 0.01) {
        return res.status(400).json({ message: "Split amounts don't match total expense" });
      }
    }

    const expense = new Expense({
      amount,
      category,
      description,
      paidBy,
      splitAmong,
      splitType: splitType || 'equal',
      splitDetails: finalSplitDetails,
      createdBy: req.user.id
    });

    await expense.save();
    
    res.status(201).json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get All Expenses for User
router.get("/", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { splitAmong: req.user.id },
        { splitAmong: 'current_user' },
        { paidBy: req.user.id },
        { paidBy: 'current_user' },
        { createdBy: req.user.id }
      ]
    }).sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Expense
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { amount, category, description, paidBy, splitAmong, splitType, splitDetails } = req.body;
    
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if user has permission to edit
    if (expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this expense" });
    }

    // Calculate new split details
    let finalSplitDetails = [];
    if (splitType === 'equal' || !splitType) {
      const sharePerPerson = amount / splitAmong.length;
      finalSplitDetails = splitAmong.map(userId => ({
        user: userId,
        amount: sharePerPerson
      }));
    } else if (splitType === 'exact') {
      finalSplitDetails = splitDetails;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        amount,
        category,
        description,
        paidBy,
        splitAmong,
        splitType: splitType || 'equal',
        splitDetails: finalSplitDetails
      },
      { new: true }
    ).select('-password');

    res.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Expense
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if user has permission to delete
    if (expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this expense" });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get User Balance Breakdown (Splitwise-style)
router.get("/balances", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all expenses involving the user
    const expenses = await Expense.find({
      $or: [
        { splitAmong: userId },
        { splitAmong: 'current_user' },
        { paidBy: userId },
        { paidBy: 'current_user' }
      ]
    });

    // Calculate balances with other users
    const balances = {};

    expenses.forEach(expense => {
      const paidBy = expense.paidBy === 'current_user' ? userId : expense.paidBy;
      
      expense.splitDetails.forEach(split => {
        const splitUser = split.user === 'current_user' ? userId : split.user;
        const shareAmount = split.amount;

        // Skip if it's the same user
        if (paidBy === splitUser) return;

        // Initialize balance objects
        if (paidBy === userId) {
          // Current user paid, others owe them
          expense.splitAmong.forEach(user => {
            const otherUserId = user === 'current_user' ? userId : user;
            if (otherUserId !== userId) {
              if (!balances[otherUserId]) {
                balances[otherUserId] = {
                  userId: otherUserId,
                  balance: 0 // Positive means they owe you, negative means you owe them
                };
              }
              const userShare = expense.splitDetails.find(s => 
                (s.user === 'current_user' ? userId : s.user) === otherUserId
              )?.amount || 0;
              balances[otherUserId].balance += userShare;
            }
          });
        } else if (splitUser === userId) {
          // Current user owes money to the payer
          if (!balances[paidBy]) {
            balances[paidBy] = {
              userId: paidBy,
              balance: 0
            };
          }
          balances[paidBy].balance -= shareAmount;
        }
      });
    });

    // Convert to array and filter out zero balances
    const balanceArray = Object.values(balances)
      .filter(b => Math.abs(b.balance) > 0.01)
      .map(b => ({
        userId: b.userId,
        balance: Math.round(b.balance * 100) / 100,
        status: b.balance > 0 ? 'owes_you' : 'you_owe'
      }));

    res.json(balanceArray);
  } catch (error) {
    console.error("Error calculating balances:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Category-wise Breakdown
router.get("/breakdown", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const expenses = await Expense.find({
      $or: [
        { splitAmong: userId },
        { splitAmong: 'current_user' },
        { paidBy: userId },
        { paidBy: 'current_user' }
      ]
    });

    const breakdown = {};
    let totalSpent = 0;
    let yourShare = 0;

    expenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = {
          totalAmount: 0,
          yourShare: 0,
          count: 0
        };
      }

      breakdown[expense.category].totalAmount += expense.amount;
      breakdown[expense.category].count += 1;
      totalSpent += expense.amount;

      // Calculate user's share in this expense
      const userSplit = expense.splitDetails.find(split => 
        split.user === userId || split.user === 'current_user'
      );
      if (userSplit) {
        breakdown[expense.category].yourShare += userSplit.amount;
        yourShare += userSplit.amount;
      }
    });

    res.json({
      categoryBreakdown: breakdown,
      totalSpent: Math.round(totalSpent * 100) / 100,
      yourTotalShare: Math.round(yourShare * 100) / 100
    });
  } catch (error) {
    console.error("Error fetching breakdown:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Settle up between users
router.post("/settle", verifyToken, async (req, res) => {
  try {
    const { otherUserId, amount } = req.body;
    
    // Create a settlement expense
    const settlement = new Expense({
      amount,
      category: 'Settlement',
      description: `Settlement between users`,
      paidBy: req.user.id,
      splitAmong: [otherUserId],
      splitType: 'equal',
      splitDetails: [{
        user: otherUserId,
        amount: amount
      }],
      createdBy: req.user.id
    });

    await settlement.save();

    res.json({ message: "Settlement recorded successfully", settlement });
  } catch (error) {
    console.error("Error recording settlement:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;