import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { Rida } from "../models/Rida";
import { Expense } from "../models/Expense";
import { Invoice } from "../models/Invoice";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-diary";
const TARGET_EMAIL = "rukaiya.fashions@gmail.com";
const TARGET_PASSWORD = "12345678";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully.");

  let user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.log(`User ${TARGET_EMAIL} does not exist. Creating now...`);
    const passwordHash = await bcrypt.hash(TARGET_PASSWORD, 10);
    user = await User.create({
      email: TARGET_EMAIL,
      passwordHash,
      role: "admin",
    });
    console.log(`User created with ID: ${user._id}`);
  } else {
    console.log(`User ${TARGET_EMAIL} found with ID: ${user._id}`);
  }

  const userId = user._id;
  const unassignedFilter = {
    $or: [{ userId: { $exists: false } }, { userId: null }],
  };

  // 1. Ridas
  const ridasBefore = await Rida.countDocuments(unassignedFilter);
  const ridasResult = await Rida.updateMany(unassignedFilter, { $set: { userId } });
  const totalRidas = await Rida.countDocuments({ userId });
  console.log(`[Ridas] Updated ${ridasResult.modifiedCount} / ${ridasBefore} unassigned documents. Total bound: ${totalRidas}`);

  // 2. Expenses
  const expensesBefore = await Expense.countDocuments(unassignedFilter);
  const expensesResult = await Expense.updateMany(unassignedFilter, { $set: { userId } });
  const totalExpenses = await Expense.countDocuments({ userId });
  console.log(`[Expenses] Updated ${expensesResult.modifiedCount} / ${expensesBefore} unassigned documents. Total bound: ${totalExpenses}`);

  // 3. Invoices
  const invoicesBefore = await Invoice.countDocuments(unassignedFilter);
  const invoicesResult = await Invoice.updateMany(unassignedFilter, { $set: { userId } });
  const totalInvoices = await Invoice.countDocuments({ userId });
  console.log(`[Invoices] Updated ${invoicesResult.modifiedCount} / ${invoicesBefore} unassigned documents. Total bound: ${totalInvoices}`);

  console.log("Migration complete. All production data is bound to user ID:", userId.toString());
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
