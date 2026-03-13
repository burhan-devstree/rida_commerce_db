import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Rida } from "@/models/Rida";
import { requireAuth } from "@/middleware/auth";
import { uploadToImgBB } from "@/lib/imgbb";

async function getHandler(
  _req: NextRequest,
  context: { params?: Promise<Record<string, string>> },
  _payload: { userId: string; email: string }
) {
  try {
    const params = await context.params!;
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Rida ID" }, { status: 400 });
    }
    await connectDB();
    const rida = await Rida.findById(id).lean();
    if (!rida) {
      return NextResponse.json({ error: "Rida not found" }, { status: 404 });
    }
    return NextResponse.json(rida);
  } catch (err) {
    console.error("GET /api/ridas/:id:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function putHandler(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> },
  _payload: { userId: string; email: string }
) {
  try {
    const params = await context.params!;
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Rida ID" }, { status: 400 });
    }

    // Accept multipart/form-data to support image upload
    const formData = await req.formData();

    const ridaNameRaw = formData.get("ridaName") as string | null;
    const priceRaw = formData.get("price") as string | null;
    const profitRaw = formData.get("profit") as string | null;
    const imageFile = formData.get("image") as File | null;
    // ridaImage: "" means remove, existing URL means keep, absent means no change
    const ridaImageField = formData.get("ridaImage") as string | null;

    await connectDB();
    const rida = await Rida.findById(id);
    if (!rida) {
      return NextResponse.json({ error: "Rida not found" }, { status: 404 });
    }

    // Apply text field updates
    if (ridaNameRaw != null && ridaNameRaw.trim() !== "") {
      rida.ridaName = ridaNameRaw.trim();
    }
    if (priceRaw != null) {
      const p = parseFloat(priceRaw);
      if (!isNaN(p)) rida.price = p;
    }
    if (profitRaw != null) {
      const p = parseFloat(profitRaw);
      if (!isNaN(p)) rida.profit = p;
    }

    // Image update logic:
    // 1. New file provided → upload to ImgBB → save new URL
    // 2. No file + ridaImage = "" → clear the image (user removed it)
    // 3. No file + ridaImage = existing URL → keep unchanged (no-op)
    // 4. No file + ridaImage not sent → leave current value unchanged
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      rida.ridaImage = await uploadToImgBB(buffer, imageFile.name);
    } else if (ridaImageField !== null) {
      // ridaImageField was explicitly sent
      if (ridaImageField === "") {
        // User clicked "Remove image"
        rida.ridaImage = undefined;
      }
      // else: non-empty string (existing URL) — keep unchanged, nothing to do
    }

    await rida.save();
    return NextResponse.json(rida.toObject());
  } catch (err) {
    console.error("PUT /api/ridas/:id:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  _req: NextRequest,
  context: { params?: Promise<Record<string, string>> },
  _payload: { userId: string; email: string }
) {
  try {
    const params = await context.params!;
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Rida ID" }, { status: 400 });
    }
    await connectDB();
    const deleted = await Rida.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Rida not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/ridas/:id:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const PUT = requireAuth(putHandler);
export const DELETE = requireAuth(deleteHandler);
