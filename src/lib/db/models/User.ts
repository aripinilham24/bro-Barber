import { Schema, model, models } from "mongoose";

/**
 * Model User — mengacu ke koleksi `user` milik Better Auth.
 * Hanya untuk keperluan referensi/populate (tidak dipakai untuk menulis user baru).
 */
export interface UserDoc {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: "client" | "kasir" | "admin";
  phone?: string;
  banned: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String, default: null },
    role: { type: String, enum: ["client", "kasir", "admin"], default: "client" },
    phone: { type: String, default: "" },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    banExpires: { type: Date, default: null },
  },
  {
    collection: "user",
    timestamps: true,
    strict: false, // field lain milik Better Auth tetap tersimpan
  }
);

export const UserModel =
  (models.User as ReturnType<typeof model>) ??
  model<UserDoc>("User", userSchema);
