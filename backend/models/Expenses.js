import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  paidBy: { type: String, required: true }, // User who paid
  split: { type: String, default: "Don't split" }, // Optional split
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Expense", ExpenseSchema);
