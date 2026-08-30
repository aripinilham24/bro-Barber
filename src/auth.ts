import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";

/**
 * Instans Better Auth untuk "Bro Barber".
 *
 * - Adapter MongoDB (transaksi aktif karena `client` diberikan)
 * - Email/password (registrasi client)
 * - Admin plugin → field `role` pada user (client | kasir | admin)
 * - Sesi JWT disimpan pada cookie HttpOnly (default Better Auth)
 * - `baseURL.allowedHosts` untuk proteksi host-header di produksi
 *
 * Catatan: modul ini hanya boleh diimpor dari server (tidak pernah dari
 * komponen klien — untuk klien gunakan `@/lib/auth-client`).
 */
const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/bro-barber";

// `db()` tidak memerlukan koneksi aktif; koneksi dibuat saat pertama dipakai.
const client = new MongoClient(MONGODB_URI);
const db = client.db();

/** Daftar host yang diizinkan sebagai origin (kompatibel Vercel preview/prod). */
function getAllowedHosts(): string[] {
  const fromEnv = process.env.BETTER_AUTH_ALLOWED_HOSTS;
  const hosts = fromEnv
    ? fromEnv.split(",").map((h) => h.trim()).filter(Boolean)
    : [];
  const urlHost = process.env.BETTER_AUTH_URL
    ? new URL(process.env.BETTER_AUTH_URL).host
    : null;
  if (urlHost && !hosts.includes(urlHost)) hosts.push(urlHost);
  hosts.push("localhost");
  return hosts;
}

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true, // ikut dikirim dari form registrasi
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "client",
      adminRoles: ["admin"],
    }),
  ],

  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  baseURL: {
    allowedHosts: getAllowedHosts(),
  },
});

export type { Session, User } from "better-auth";
