import express from "express";
import Expense from "../models/Expenses.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Add Expense
router.post("/", verifyToken, async (req, res) => {
  try {
    const expense = new Expense({ ...req.body, user: req.user.id });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Update Expenses
router.put("/:id", async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Delete Expenses
router.delete("/:id", async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: GET /api/expenses/breakdown
// router.get("/breakdown", verifyToken, async (req, res) => {
//   console.log("🟡 Request received for /api/expenses/breakdown");
//   try {
   
//     const expenses = await Expense.find({});
//     let balances = {};

//     expenses.forEach((expense) => {
//       const splitAmong = expense.splitAmong;
//       const perPersonShare = expense.amount / splitAmong.length;

//       splitAmong.forEach((userId) => {
//         if (userId !== expense.paidBy) {
//           if (!balances[userId]) balances[userId] = 0;
//           balances[userId] -= perPersonShare; // This user owes money
//         }
//       });

//       if (!balances[expense.paidBy]) balances[expense.paidBy] = 0;
//       balances[expense.paidBy] += expense.amount - perPersonShare; // The payer gets reimbursed
//     });

//     res.json(balances);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

router.get('/breakdown', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🟡 Fetching expense breakdown for user: ${userId}`);

    // Fetch expenses from the database
    const expenses = await Expense.find({
      $or: [{ splitAmong: req.user.id }, { paidBy: req.user.id }],
    });
    console.log(`✅ Found ${expenses.length} expenses`);

    if (!expenses.length) {
      console.warn("⚠️ No expenses found for breakdown.");
      return res.status(404).json({ message: "No expenses found for breakdown" });
    }

    let breakdown = {};
    expenses.forEach(expense => {
      console.log(`🔹 Processing expense: ${expense._id}, Category: ${expense.category}, Amount: ${expense.amount}`);
      
      if (!expense.category) {
        console.warn(`⚠️ Expense with missing category: ${expense._id}`);
        return;
      }

      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += expense.amount;
    });

    console.log(`✅ Breakdown Data Ready:`, breakdown);
    res.json(breakdown);

  } catch (error) {
    console.error("❌ Error in /breakdown API:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});




export default router;
