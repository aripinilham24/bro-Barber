import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ReservationModel } from "@/lib/db/models";
import { sweepExpiredSlots } from "@/lib/services/slots";
import { requireRoles, STAFF_ROLES } from "@/lib/api-helpers";

/**
 * GET /api/admin/schedule?date=YYYY-MM-DD
 * Jadwal reservasi per tanggal (default: hari ini). Hanya admin/kasir.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRoles(STAFF_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await connectDB();
  await sweepExpiredSlots();

  const date =
    new URL(request.url).searchParams.get("date") ??
    new Date().toISOString().slice(0, 10);

  const reservations = await ReservationModel.find({ date })
    .sort({ startTime: 1 })
    .populate("user", "name email phone")
    .populate("service", "name price duration")
    .populate("timeSlot", "startTime endTime")
    .lean();

  // Ringkasan per hari (untuk statistik)
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "PENDING_PAYMENT").length,
    dpPaid: reservations.filter((r) => r.status === "DP_PAID").length,
    completed: reservations.filter((r) => r.status === "COMPLETED").length,
  };

  return NextResponse.json({ date, stats, reservations });
}
