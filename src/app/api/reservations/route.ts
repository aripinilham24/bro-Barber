import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { TimeSlotModel, ReservationModel, PaymentModel, ServiceModel } from "@/lib/db/models";
import { sweepExpiredSlots } from "@/lib/services/slots";
import { addDays } from "@/lib/utils";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  // Jalankan sweep slot sebelum menghitung ketersediaan
  await sweepExpiredSlots();

  if (date) {
    const slots = await TimeSlotModel.find({ date, status: "AVAILABLE" }).select(
      "startTime endTime status"
    );
    return NextResponse.json(slots);
  } else {
    // Ringkasan kalender: semua slot yang AVAILABLE untuk rentang tanggal
    const today = new Date();
    const days = 30;
    const slotsByDate: Record<string, string[]> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const daySlots = await TimeSlotModel.find({
        date: dateStr,
        status: "AVAILABLE",
      }).select("startTime");
      slotsByDate[dateStr] = daySlots.map((s) => s.startTime);
    }
    return NextResponse.json(slotsByDate);
  }
}

export async function POST(request: NextRequest) {
  await connectDB();

  // Pastikan slot untuk hari ini
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  await TimeSlotModel.ensureSlotsForDate(todayStr);

  const body = await request.json().catch(() => null);
  if (!body || !body.slotId) {
    return NextResponse.json(
      { error: "slotId diperlukan" },
      { status: 400 }
    );
  }

  const { slotId, userId } = body;

  // Jalankan sweepExpiredSlots sebelum lock
  await sweepExpiredSlots();

  // Lock slot secara atomic
  const lockedSlot = await TimeSlotModel.findOneAndUpdate(
    { _id: slotId, status: "AVAILABLE" },
    {
      $set: {
        status: "BOOKED_PENDING",
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 menit
        reservationId: new mongoose.Types.ObjectId(),
      },
    },
    { new: true }
  );

  if (!lockedSlot) {
    return NextResponse.json(
      { error: "Slot tidak tersedia atau sudah dikunci" },
      { status: 409 }
    );
  }

  // Buat reservasi
  const service = await ServiceModel.findById(body.serviceId);
  if (!service || !service.isActive) {
    return NextResponse.json(
      { error: "Layanan tidak valid" },
      { status: 400 }
    );
  }

  const reservation = await ReservationModel.create({
    user: userId,
    service: body.serviceId,
    timeSlot: lockedSlot._id,
    date: lockedSlot.date,
    startTime: lockedSlot.startTime,
    status: "PENDING_PAYMENT",
    subtotal: service.price,
    discountPercent: body.discountPercent || 0,
    discountAmount: body.discountPercent
      ? Math.round(service.price * (body.discountPercent / 100))
      : 0,
    total: service.price - (body.discountPercent ? Math.round(service.price * (body.discountPercent / 100)) : 0),
    dpAmount: Math.ceil((service.price - (body.discountPercent ? Math.round(service.price * (body.discountPercent / 100)) : 0)) / 2),
    remainingAmount: Math.floor((service.price - (body.discountPercent ? Math.round(service.price * (body.discountPercent / 100)) : 0)) / 2),
    voucherCode: body.voucherCode || null,
    notes: body.notes || "",
  });

  // Buat Payment
  const payment = await PaymentModel.create({
    reservation: reservation._id,
    type: "DP",
    provider: "simulation",
    externalId: `dp-${reservation._id.toString()}`,
    amount: reservation.dpAmount,
    status: "PENDING",
    qrString: `QRIS-${reservation._id.toString()}|
 ${reservation.dpAmount}|BROBARBER`,
    method: "QRIS",
    paidAt: null,
    raw: null,
  });

  return NextResponse.json({
    success: true,
    reservationId: reservation._id,
    slot: lockedSlot,
    payment,
  });
}
