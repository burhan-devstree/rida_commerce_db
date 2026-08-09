import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAuth } from "@/middleware/auth";
import { updateInvoiceSchema } from "@/lib/validators";

async function getHandler(
  _req: NextRequest,
  context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string }
) {
  try {
    const params = await context.params!;
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Invoice.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(payload.userId),
    })
      .populate("ridaId", "ridaName price profit")
      .lean();
    if (!doc) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const row = doc as { profit?: number; quantity?: number };
    const invoice = {
      ...doc,
      profit: row.profit ?? 0,
      quantity: row.quantity ?? 1,
    };
    return NextResponse.json(invoice);
  } catch (err) {
    console.error("GET /api/invoices/:id:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function putHandler(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string }
) {
  try {
    const params = await context.params!;
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();
    const invoice = await Invoice.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(payload.userId),
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updates = parsed.data;
    if (updates.ridaId !== undefined) {
      if (updates.ridaId && mongoose.Types.ObjectId.isValid(updates.ridaId)) {
        invoice.ridaId = new mongoose.Types.ObjectId(updates.ridaId);
      }
    }
    if (updates.quantity != null) invoice.quantity = updates.quantity;
    if (updates.customer != null) invoice.customer = updates.customer;
    if (updates.reseller != null) invoice.reseller = updates.reseller;
    if (updates.amount != null) invoice.amount = updates.amount;
    if (updates.profit != null) invoice.profit = updates.profit;
    if (updates.address !== undefined) invoice.address = updates.address;

    await invoice.save();
    const populated = await Invoice.findById(invoice._id)
      .populate("ridaId", "ridaName price profit")
      .lean();
    return NextResponse.json(populated ?? invoice.toObject());
  } catch (err) {
    console.error("PUT /api/invoices/:id:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  _req: NextRequest,
  context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string }
) {
  try {
    const params = await context.params!;
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    await connectDB();
    const deleted = await Invoice.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(payload.userId),
    });
    if (!deleted) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/invoices/:id:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const PUT = requireAuth(putHandler);
export const DELETE = requireAuth(deleteHandler);

