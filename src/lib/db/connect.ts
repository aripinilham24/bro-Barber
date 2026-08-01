import mongoose from "mongoose";

/**
 * Koneksi Mongoose singleton.
 * Dikunci ke globalThis agar tidak membuat koneksi ganda saat hot-reload (dev).
 */
const globalForMongoose = globalThis as unknown as {
  mongooseConn?: typeof mongoose;
};

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/bro-barber";

export async function connectDB() {
  if (globalForMongoose.mongooseConn?.connection.readyState === 1) {
    return globalForMongoose.mongooseConn;
  }
  const conn = await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
  });
  globalForMongoose.mongooseConn = conn;
  return conn;
}

/** True jika sudah terhubung (tanpa menginisialisasi koneksi baru) */
export function isConnected() {
  return mongoose.connection.readyState === 1;
}
