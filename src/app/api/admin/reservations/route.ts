import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ReservationModel, UserModel } from "@/lib/db/models";
import { requireRoles, STAFF_ROLES } from "@/lib/api-helpers";

/**
 * GET /api/admin/reservations?date=YYYY-MM-DD&status=DP_PAID&search=nama
 * Daftar semua reservasi (admin/kasir), mendukung filter tanggal, status, dan pencarian.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRoles(STAFF_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await connectDB();
  const sp = new URL(request.url).searchParams;
  const date = sp.get("date");
  const status = sp.get("status");
  const search = sp.get("search")?.trim();

  const filter: Record<string, unknown> = {};
  if (date) filter.date = date;
  if (status && status !== "ALL") filter.status = status;

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await UserModel.find({
      $or: [{ name: regex }, { phone: regex }, { email: regex }],
    })
      .select("_id")
      .lean();
    const userIds = users.map((u) => u._id);
    if (userIds.length === 0) return NextResponse.json([]);
    filter.user = { $in: userIds };
  }

  const reservations = await ReservationModel.find(filter)
    .sort({ date: -1, startTime: 1, createdAt: -1 })
    .populate("user", "name email phone")
    .populate("service", "name price duration")
    .populate("timeSlot", "startTime endTime")
    .lean();

  return NextResponse.json(reservations);
}
