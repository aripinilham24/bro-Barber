import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import mongoose from "mongoose";
import { admin } from "better-auth/plugins";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bro-barber";

// Koneksi MongoDB untuk Better Auth
const client = new mongoose.MongoClient(MONGODB_URI);
await client.connect();
const db = client.db("bro-barber");

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),

  // Better Auth v1 dengan email/password & adapter MongoDB
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },

  session: {
    modelName: "sessions",
    expiresIn: 7 * 24 * 60 * 60, // 7 hari
    updateAge: 24 * 60 * 60, // 24 jam
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 menit
    },
  },

  // Plugin admin untuk role-based access control
  plugins: [
    admin({
      defaultRole: "client",
      adminRoles: ["admin"],
      banUser: true,
      bannedUserMessage: "Anda telah diblokir. Hubungi admin.",
      getUserRole: async (user) => user.role,
      setRole: true,
    }),
  ],

  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
});
