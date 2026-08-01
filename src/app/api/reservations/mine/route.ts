import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { ReservationModel } from "@/lib/db/models";
import { getSession } from "@/lib/session";

/** GET /api/reservations/mine — riwayat reservasi milik user yang login */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  }

  await connectDB();
  const reservations = await ReservationModel.find({
    user: new Types.ObjectId(String(session.user.id)),
  })
    .sort({ createdAt: -1 })
    .populate<{ service?: { name: string; price: number; duration: number } }>(
      "service",
      "name price duration"
    )
    .populate<{ timeSlot?: { startTime: string; endTime: string } }>(
      "timeSlot",
      "startTime endTime"
    )
    .lean();

  return NextResponse.json(reservations);
}
