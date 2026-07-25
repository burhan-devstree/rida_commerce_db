import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAuth } from "@/middleware/auth";
import { createInvoiceSchema, queryInvoicesSchema } from "@/lib/validators";
import { generateInvoiceNumber } from "@/lib/invoiceNumber";

async function getHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  _payload: { userId: string; email: string }
) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const parsed = queryInvoicesSchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { page, limit, search, searchField, dateFrom, dateTo, ridaId } = parsed.data;


    const filter: Record<string, unknown> = {};
    if (ridaId && mongoose.Types.ObjectId.isValid(ridaId)) {
      filter.ridaId = new mongoose.Types.ObjectId(ridaId);
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(dateFrom + "T00:00:00.000Z");
      }
      if (dateTo) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }
    if (search?.trim()) {
      const term = search.trim();
      if (searchField) {
        filter[searchField] = new RegExp(term, "i");
      } else {
        filter.$or = [
          { invoiceNumber: new RegExp(term, "i") },
          { customer: new RegExp(term, "i") },
          { reseller: new RegExp(term, "i") },
        ];
      }
    }
    const skip = (page - 1) * limit;
    const [rawInvoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate("ridaId", "ridaName price profit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);
    const invoices = rawInvoices.map((d) => {
      const row = d as { profit?: number; quantity?: number; ridaId?: unknown };
      return {
        ...d,
        profit: row.profit ?? 0,
        quantity: row.quantity ?? 1,
      };
    });

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/invoices:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function postHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  _payload: { userId: string; email: string }
) {
  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { ridaId, quantity, customer, reseller, amount, profit, address } = parsed.data;

    await connectDB();

    const invoiceNumber = await generateInvoiceNumber();

    const createPayload = {
      invoiceNumber,
      ridaId: new mongoose.Types.ObjectId(ridaId),
      quantity: quantity ?? 1,
      customer,
      reseller,
      amount,
      profit,
      address,
    };

    const doc = await Invoice.create(createPayload);
    const populated = await Invoice.findById(doc._id)
      .populate("ridaId", "ridaName price profit")
      .lean();
    return NextResponse.json(populated ?? doc.toObject(), { status: 201 });
  } catch (err) {
    console.error("POST /api/invoices:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
