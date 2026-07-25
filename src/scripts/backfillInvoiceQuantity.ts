/**
 * Run: npx tsx src/scripts/backfillInvoiceQuantity.ts
 * Backfills quantity = 1 for all historical invoice records missing the quantity field.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import mongoose from "mongoose";
import { Invoice } from "../models/Invoice";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-diary";

async function runBackfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Query invoices where quantity does not exist or is null
  const query = {
    $or: [{ quantity: { $exists: false } }, { quantity: null }],
  };

  const pendingCount = await Invoice.countDocuments(query);
  console.log(`Found ${pendingCount} invoice(s) needing quantity backfill.`);

  if (pendingCount > 0) {
    const result = await Invoice.updateMany(query, { $set: { quantity: 1 } });
    console.log(`Successfully backfilled quantity = 1 for ${result.modifiedCount} invoice document(s).`);
  } else {
    console.log("No invoices require backfilling. Database is already up to date.");
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
  process.exit(0);
}

runBackfill().catch((err) => {
  console.error("Backfill script error:", err);
  process.exit(1);
});
