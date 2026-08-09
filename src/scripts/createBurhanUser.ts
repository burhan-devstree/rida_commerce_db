import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/User";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-diary";
const TARGET_EMAIL = "burhan@gmail.com";
const TARGET_PASSWORD = "12345678";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully.");

  let user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.log(`User ${TARGET_EMAIL} does not exist. Creating now...`);
    const passwordHash = await bcrypt.hash(TARGET_PASSWORD, 10);
    user = await User.create({
      email: TARGET_EMAIL,
      passwordHash,
      role: "admin",
    });
    console.log(`User created with ID: ${user._id}`);
  } else {
    console.log(`User ${TARGET_EMAIL} already exists with ID: ${user._id}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create user:", err);
  process.exit(1);
});
