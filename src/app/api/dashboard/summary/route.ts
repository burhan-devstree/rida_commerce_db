import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { requireAuth } from "@/middleware/auth";
import { sumNumbers } from "@/utils/calc";
import { dashboardSummaryQuerySchema } from "@/lib/validators";

async function getHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  _payload: { userId: string; email: string }
) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = dashboardSummaryQuerySchema.safeParse(Object.fromEntries(searchParams));
    const startDate = parsed.success ? parsed.data.startDate : undefined;
    const endDate = parsed.success ? parsed.data.endDate : undefined;

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(startDate + "T00:00:00.000Z");
      }
      if (endDate) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const docs = await Invoice.find(filter).lean();
    const totalInvoices = docs.length;
    const totalRevenue = sumNumbers(docs.map((d) => d.amount));
    const totalProfit = sumNumbers(docs.map((d) => (d as { profit?: number }).profit ?? 0));

    return NextResponse.json({
      totalInvoices,
      totalRevenue,
      totalProfit,
    });
  } catch (err) {
    console.error("GET /api/dashboard/summary:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
