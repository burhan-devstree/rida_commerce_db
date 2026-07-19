import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/invoice-diary";

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  global.mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log("=> MONGODB CACHE HIT: Using existing connection");
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to avoid slow DNS lookup timeouts for IPv6 on Atlas hosts
    };
    console.log("=> MONGODB CACHE MISS: Creating new connection promise");
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  } else {
    console.log("=> MONGODB CACHE HIT: Reusing connection promise");
  }
  try {
    cached.conn = await cached.promise;
    console.log("=> MONGODB: Connection active");
  } catch (e) {
    cached.promise = null;
    console.error("=> MONGODB: Connection failed", e);
    throw e;
  }
  return cached.conn;
}
