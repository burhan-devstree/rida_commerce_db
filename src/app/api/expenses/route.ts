import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { requireAuth } from "@/middleware/auth";
import { createExpenseSchema, queryExpensesSchema } from "@/lib/validators";

async function getHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string }
) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const parsed = queryExpensesSchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { page, limit, search } = parsed.data;

    await connectDB();

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(payload.userId),
    };
    if (search?.trim()) {
      filter.expenseName = new RegExp(search.trim(), "i");
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/expenses:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function postHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string }
) {
  try {
    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();
    const doc = await Expense.create({
      userId: new mongoose.Types.ObjectId(payload.userId),
      expenseName: parsed.data.expenseName.trim(),
      amount: parsed.data.amount,
    });

    return NextResponse.json(doc.toObject(), { status: 201 });
  } catch (err) {
    console.error("POST /api/expenses:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);

