import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ReservationModel, ServiceModel, TimeSlotModel, PaymentModel } from "@/lib/db/models";
import { getSession } from "@/lib/session";
import type { ReservationDoc } from "@/lib/db/models";

type PopulatedReservation = ReservationDoc & {
  service?: { name: string; price: number; duration: number };
  timeSlot?: { startTime: string; endTime: string };
  payments?: Array<{ type: string; amount: number; status: string; method: string }>;
};

/** GET /api/reservations/mine — riwayat reservasi milik user yang login */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  }

  await connectDB();
  const reservations = await ReservationModel.find({ user: session.user.id })
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
