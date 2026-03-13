import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAuth } from "@/middleware/auth";

type MarkPrintedBody = {
  invoiceIds?: string[];
};

async function postHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  _payload: { userId: string; email: string },
) {
  try {
    let body: MarkPrintedBody;
    try {
      body = (await req.json()) as MarkPrintedBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body.invoiceIds || !Array.isArray(body.invoiceIds) || body.invoiceIds.length === 0) {
      return NextResponse.json(
        { error: "invoiceIds must be a non-empty array of strings." },
        { status: 400 },
      );
    }

    const validIds = body.invoiceIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "No valid invoice IDs provided." },
        { status: 400 },
      );
    }

    await connectDB();
    const now = new Date();
    const result = await Invoice.updateMany(
      { _id: { $in: validIds } },
      { $set: { isAddressPrinted: true, addressPrintedAt: now } },
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount ?? 0,
      printedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("POST /api/invoices/addresses/mark-printed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = requireAuth(postHandler);

