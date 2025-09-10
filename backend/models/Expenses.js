import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  paidBy: { type: String, required: true }, // Can be 'current_user' or user ID
  splitAmong: [{ type: String, required: true }], // Array of User IDs or 'current_user'
  splitType: { 
    type: String, 
    enum: ['equal', 'exact', 'percentage'], 
    default: 'equal' 
  },
  splitDetails: [{
    user: { type: String }, // User ID or 'current_user'
    amount: { type: Number, required: true }
  }], // For exact amounts or percentages
  date: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }, // User ID who created the expense
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // Optional group reference
}, {
  timestamps: true
});

// Calculate individual shares before saving
ExpenseSchema.pre('save', function(next) {
  if (this.splitType === 'equal') {
    const sharePerPerson = this.amount / this.splitAmong.length;
    this.splitDetails = this.splitAmong.map(userId => ({
      user: userId,
      amount: sharePerPerson
    }));
  }
  next();
});

export default mongoose.model("Expense", ExpenseSchema);