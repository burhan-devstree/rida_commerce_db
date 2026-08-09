import mongoose, { Schema, Model } from "mongoose";

export interface IExpense {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  expenseName: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expenseName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, expenseName: 1 });
ExpenseSchema.index({ userId: 1, createdAt: -1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense ?? mongoose.model<IExpense>("Expense", ExpenseSchema);

