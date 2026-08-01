import { connectDB } from "@/lib/db/connect";
import { PaymentModel, ReservationModel, TimeSlotModel } from "@/lib/db/models";
import type { WebhookEvent } from "./types";

export interface ProcessResult {
  ok: boolean;
  duplicate?: boolean;
  ignored?: boolean;
  reason?: string;
}

/**
 * Proses event pembayaran (dipakai oleh route webhook & simulasi dev).
 * Idempotent: webhook duplikat tidak memproses ulang.
 */
export async function processPaymentEvent(event: WebhookEvent): Promise<ProcessResult> {
  await connectDB();

  const payment = await PaymentModel.findOne({ externalId: event.externalId });
  if (!payment) {
    return { ok: true, ignored: true, reason: "payment_not_found" };
  }

  if (event.event === "payment.paid") {
    if (payment.status === "PAID") return { ok: true, duplicate: true };

    payment.status = "PAID";
    payment.paidAt = event.paidAt ?? new Date();
    payment.raw = event.raw;
    await payment.save();

    const reservation = await ReservationModel.findById(payment.reservation);
    if (reservation) {
      if (reservation.status === "PENDING_PAYMENT") {
        reservation.status = "DP_PAID";
        await reservation.save();
      }
      if (reservation.timeSlot) {
        await TimeSlotModel.updateOne(
          { _id: reservation.timeSlot, status: "BOOKED_PENDING" },
          { $set: { status: "BOOKED", lockedUntil: null } }
        );
      }
    }
    return { ok: true };
  }

  if (event.event === "payment.expired") {
    if (payment.status === "EXPIRED") return { ok: true, duplicate: true };

    payment.status = "EXPIRED";
    await payment.save();

    const reservation = await ReservationModel.findById(payment.reservation);
    if (reservation) {
      if (reservation.status === "PENDING_PAYMENT") {
        reservation.status = "EXPIRED";
        await reservation.save();
      }
      if (reservation.timeSlot) {
        await TimeSlotModel.updateOne(
          { _id: reservation.timeSlot, status: "BOOKED_PENDING" },
          { $set: { status: "AVAILABLE", lockedUntil: null, reservationId: null } }
        );
      }
    }
    return { ok: true };
  }

  return { ok: false, reason: "unknown_event" };
}
