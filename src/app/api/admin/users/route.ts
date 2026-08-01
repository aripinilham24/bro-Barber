import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

const ROLES = ["client", "kasir", "admin"];

/** GET: daftar pengguna (admin) */
export async function GET() {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  await connectDB();
  const users = await UserModel.find()
    .select("name email role phone createdAt banned")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(users);
}

/** PATCH: ubah role pengguna. Body: { userId, role } */
export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = await request.json().catch(() => null);
  const { userId, role } = body ?? {};
  if (!userId || !ROLES.includes(role)) {
    return NextResponse.json(
      { error: "userId dan role (client/kasir/admin) wajib valid" },
      { status: 400 }
    );
  }

  await connectDB();
  // Jangan biarkan admin terakhir kehilangan role admin
  if (role !== "admin") {
    const target = await UserModel.findById(userId);
    if (target?.role === "admin") {
      const admins = await UserModel.countDocuments({ role: "admin" });
      if (admins <= 1) {
        return NextResponse.json(
          { error: "Tidak bisa mengubah role admin terakhir" },
          { status: 400 }
        );
      }
    }
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { role } },
    { new: true }
  ).select("name email role phone createdAt banned");
  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(user);
}
