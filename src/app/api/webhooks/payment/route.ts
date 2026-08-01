import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { PaymentModel, ReservationModel, TimeSlotModel } from "@/lib/db/models";
import { getPaymentProvider } from "@/lib/payment";

/**
 * POST /api/webhooks/payment — dipanggil penyedia pembayaran (simulasi / Xendit).
 *  - Verifikasi token/signature oleh provider (parseWebhook)
 *  - Idempotent: webhook duplikat tidak memproses ulang
 *  - Respons 2xx cepat (Xendit akan retry bila bukan 2xx)
 */
export async function POST(request: NextRequest) {
  const provider = getPaymentProvider();
  const parsed = await provider.parseWebhook(request);

  if (!parsed) {
    return NextResponse.json({ error: "Webhook tidak valid" }, { status: 400 });
  }

  await connectDB();

  const payment = await PaymentModel.findOne({ externalId: parsed.externalId });
  if (!payment) {
    // Jangan 4xx agar provider tidak retry tanpa henti; catat saja.
    console.warn(`Webhook: payment ${parsed.externalId} tidak ditemukan`);
    return NextResponse.json({ ok: true });
  }

  if (parsed.event === "payment.paid") {
    if (payment.status === "PAID") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    payment.status = "PAID";
    payment.paidAt = parsed.paidAt ?? new Date();
    payment.raw = parsed.raw;
    await payment.save();

    const reservation = await ReservationModel.findById(payment.reservation);
    if (reservation) {
      if (reservation.status === "PENDING_PAYMENT") {
        reservation.status = "DP_PAID";
        await reservation.save();
      }
      // Kunci slot final: BOOKED_PENDING → BOOKED
      if (reservation.timeSlot) {
        await TimeSlotModel.updateOne(
          { _id: reservation.timeSlot, status: "BOOKED_PENDING" },
          { $set: { status: "BOOKED", lockedUntil: null } }
        );
      }
    }

    return NextResponse.json({ ok: true });
  }

  if (parsed.event === "payment.expired") {
    if (payment.status === "EXPIRED") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    payment.status = "EXPIRED";
    await payment.save();

    const reservation = await ReservationModel.findById(payment.reservation);
    if (reservation) {
      if (reservation.status === "PENDING_PAYMENT") {
        reservation.status = "EXPIRED";
        await reservation.save();
      }
      // Kembalikan slot
      if (reservation.timeSlot) {
        await TimeSlotModel.updateOne(
          { _id: reservation.timeSlot, status: "BOOKED_PENDING" },
          { $set: { status: "AVAILABLE", lockedUntil: null, reservationId: null } }
        );
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Event tidak dikenali" }, { status: 400 });
}
