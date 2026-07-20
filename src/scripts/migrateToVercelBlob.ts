/**
 * Run: npx tsx src/scripts/migrateToVercelBlob.ts
 * Downloads legacy ImgBB images and uploads them to Vercel Blob, updating MongoDB.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import mongoose from "mongoose";
import { Rida } from "../models/Rida";
import { put } from "@vercel/blob";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-diary";
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

async function runMigration() {
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error("ERROR: BLOB_READ_WRITE_TOKEN is not set in environment variables.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Find all Ridas with legacy ImgBB images (contains 'i.ibb.co')
  const legacyRidas = await Rida.find({
    ridaImage: { $regex: /i\.ibb\.co/i }
  });

  console.log(`Found ${legacyRidas.length} legacy Rida image(s) to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (const rida of legacyRidas) {
    const originalUrl = rida.ridaImage!;
    console.log(`\nMigrating Rida "${rida.ridaName}" (ID: ${rida._id})...`);
    console.log(`Original URL: ${originalUrl}`);

    try {
      // 1. Download image
      const res = await fetch(originalUrl);
      if (!res.ok) {
        throw new Error(`Failed to download image from ImgBB (Status: ${res.status})`);
      }
      
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract filename from URL or use a default one
      const urlParts = originalUrl.split("/");
      let originalFilename = urlParts[urlParts.length - 1] || "rida.jpg";
      // Remove query parameters if any
      originalFilename = originalFilename.split("?")[0];

      // 2. Upload to Vercel Blob
      const blobFilename = `rida/${rida._id}_${originalFilename}`;
      console.log(`Uploading to Vercel Blob as: ${blobFilename}...`);
      
      const blob = await put(blobFilename, buffer, {
        access: "public",
        token: BLOB_READ_WRITE_TOKEN,
      });

      console.log(`Uploaded! New Vercel Blob URL: ${blob.url}`);

      // 3. Update database
      rida.ridaImage = blob.url;
      await rida.save();
      console.log(`Database record updated successfully.`);
      successCount++;
    } catch (err) {
      console.error(`ERROR migrating Rida "${rida.ridaName}":`, err);
      failCount++;
    }
  }

  console.log(`\nMigration completed.`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration script crashed:", err);
  process.exit(1);
});
