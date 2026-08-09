import { Invoice } from "@/models/Invoice";
import mongoose from "mongoose";

const PREFIX_LEN = 9; // YYYYMMDD = 8, dash = 1

/**
 * Format: YYYYMMDD-XX (e.g. 20260319-01).
 * Counter resets each day. Uniqueness ensured by querying today's count per user.
 */
export async function generateInvoiceNumber(userId?: string | mongoose.Types.ObjectId): Promise<string> {
  const today = new Date();
  const prefix = formatDatePrefix(today);

  const query: Record<string, unknown> = {
    invoiceNumber: new RegExp(`^${prefix}-\\d+$`),
  };
  if (userId) {
    query.userId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  }

  const lastToday = await Invoice.findOne(
    query,
    { invoiceNumber: 1 },
    { sort: { invoiceNumber: -1 } }
  ).lean();

  let nextNum = 1;
  if (lastToday) {
    const suffix = lastToday.invoiceNumber.slice(PREFIX_LEN);
    nextNum = parseInt(suffix, 10) + 1;
  }

  const numStr = nextNum.toString().padStart(2, "0");
  return `${prefix}-${numStr}`;
}

function formatDatePrefix(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}${m}${day}`;
}

