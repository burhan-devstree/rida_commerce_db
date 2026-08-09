import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Rida } from "@/models/Rida";
import { requireAuth } from "@/middleware/auth";
import { createRidaSchema } from "@/lib/validators";
import { put } from "@vercel/blob";

async function getHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> },
  payload: { userId: string; email: string }
) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const pageParam = searchParams.get("page");

    await connectDB();

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(payload.userId),
    };
    if (search) {
      filter.ridaName = new RegExp(search, "i");
    }

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1);
      const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
      const skip = (page - 1) * limit;

      const [ridas, total] = await Promise.all([
        Rida.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Rida.countDocuments(filter),
      ]);

      return NextResponse.json({
        ridas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const list = await Rida.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/ridas:", err);
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
    // Accept multipart/form-data to support image upload
    const formData = await req.formData();

    const ridaName = (formData.get("ridaName") as string | null)?.trim() ?? "";
    const price = parseFloat((formData.get("price") as string) ?? "NaN");
    const profit = parseFloat((formData.get("profit") as string) ?? "NaN");
    const imageFile = formData.get("image") as File | null;

    // Validate text fields via Zod
    const parsed = createRidaSchema.omit({ ridaImage: true }).safeParse({
      ridaName,
      price: isNaN(price) ? undefined : price,
      profit: isNaN(profit) ? undefined : profit,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Duplicate name check scoped to current user
    const existing = await Rida.findOne({
      userId: new mongoose.Types.ObjectId(payload.userId),
      ridaName: {
        $regex: new RegExp(
          `^${ridaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Rida with this name already exists" },
        { status: 409 }
      );
    }

    // Upload image to Vercel Blob if provided
    let ridaImage: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const blobFilename = `rida/${Date.now()}_${imageFile.name}`;
      const blob = await put(blobFilename, buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      ridaImage = blob.url;
    }

    const doc = await Rida.create({
      userId: new mongoose.Types.ObjectId(payload.userId),
      ridaName: parsed.data.ridaName,
      price: parsed.data.price,
      profit: parsed.data.profit,
      ...(ridaImage && { ridaImage }),
    });

    return NextResponse.json(doc.toObject(), { status: 201 });
  } catch (err) {
    console.error("POST /api/ridas:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);

