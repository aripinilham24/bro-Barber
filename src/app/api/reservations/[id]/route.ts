import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ReservationModel, PaymentModel } from "@/lib/db/models";
import { getSession } from "@/lib/session";

/** GET /api/reservations/[id] — detail reservasi (pemilik / admin / kasir) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  }
  const { id } = await params;

  await connectDB();
  const reservation = await ReservationModel.findById(id)
    .populate("service", "name price duration")
    .populate("timeSlot", "startTime endTime status")
    .populate("user", "name email phone")
    .lean();

  if (!reservation) {
    return NextResponse.json({ error: "Reservasi tidak ditemukan" }, { status: 404 });
  }

  const isOwner = String((reservation.user as unknown as { _id?: unknown })._id ?? reservation.user) === String(session.user.id);
  const isStaff = session.role === "admin" || session.role === "kasir";
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Tidak berhak mengakses" }, { status: 403 });
  }

  const payments = await PaymentModel.find({ reservation: id })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({ reservation, payments });
}
