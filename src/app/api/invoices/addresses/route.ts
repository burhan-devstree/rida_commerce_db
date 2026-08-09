import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAuth } from "@/middleware/auth";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(value + "T00:00:00.000Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string },
) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateRaw = searchParams.get("startDate");
    const endDateRaw = searchParams.get("endDate");

    const startDate = parseDate(startDateRaw);
    const endDate = parseDate(endDateRaw);

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json(
        { error: "Invalid range. endDate cannot be before startDate." },
        { status: 400 },
      );
    }

    await connectDB();

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(payload.userId),
      address: { $exists: true, $ne: "" },
    };

    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.$gte = startDate;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        createdAt.$lte = endOfDay;
      }
      filter.createdAt = createdAt;
    }

    const docs = await Invoice.find(filter)
      .sort({ createdAt: 1 })
      .select("address isAddressPrinted addressPrintedAt createdAt")
      .lean();

    const addresses = docs.map((doc) => ({
      id: String(doc._id),
      address: (doc.address as string).trim(),
      isAddressPrinted: !!doc.isAddressPrinted,
      addressPrintedAt: doc.addressPrintedAt ?? null,
    }));

    return NextResponse.json({ addresses });
  } catch (err) {
    console.error("GET /api/invoices/addresses:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = requireAuth(getHandler);

