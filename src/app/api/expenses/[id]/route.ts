import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { requireAuth } from "@/middleware/auth";
import { updateExpenseSchema } from "@/lib/validators";

async function getHandler(
  _req: NextRequest,
  context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string }
) {
  try {
    const params = await context.params!;
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Expense ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Expense.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(payload.userId),
    }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (err) {
    console.error("GET /api/expenses/:id:", err);
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
      return NextResponse.json({ error: "Invalid Expense ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();
    const expense = await Expense.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(payload.userId),
    });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (parsed.data.expenseName !== undefined) {
      expense.expenseName = parsed.data.expenseName.trim();
    }
    if (parsed.data.amount !== undefined) {
      expense.amount = parsed.data.amount;
    }

    await expense.save();
    return NextResponse.json(expense.toObject());
  } catch (err) {
    console.error("PUT /api/expenses/:id:", err);
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
      return NextResponse.json({ error: "Invalid Expense ID" }, { status: 400 });
    }
    await connectDB();
    const deleted = await Expense.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(payload.userId),
    });
    if (!deleted) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/expenses/:id:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const PUT = requireAuth(putHandler);
export const DELETE = requireAuth(deleteHandler);

