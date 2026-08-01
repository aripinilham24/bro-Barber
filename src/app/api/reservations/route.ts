import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { ServiceModel, ReservationModel, PaymentModel, TimeSlotModel } from "@/lib/db/models";
import { getSession } from "@/lib/session";
import { sweepExpiredSlots, lockSlot, getLockDurationMs } from "@/lib/services/slots";
import { validateVoucherForUser } from "@/lib/services/vouchers";
import { computePrice } from "@/lib/services/pricing";
import { getPaymentProvider } from "@/lib/payment";

/**
 * POST /api/reservations — buat reservasi (wajib login client).
 *
 * Langkah (semua server-side):
 * 1. Sweep slot kedaluwarsa
 * 2. Kunci slot secara ATOMIK (AVAILABLE → BOOKED_PENDING) → anti double-booking
 * 3. Validasi voucher (jika ada)
 * 4. Hitung harga server-side (diskon + DP 50%)
 * 5. Buat Reservation (PENDING_PAYMENT) + Payment DP (PENDING) + QRIS simulasi
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  }
  if (session.role !== "client") {
    return NextResponse.json(
      { error: "Hanya akun pelanggan yang bisa membuat reservasi" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }
  const { serviceId, slotId, voucherCode, notes } = body;
  if (!serviceId || !slotId) {
    return NextResponse.json(
      { error: "serviceId dan slotId wajib diisi" },
      { status: 400 }
    );
  }

  await connectDB();
  await sweepExpiredSlots();

  const service = await ServiceModel.findOne({ _id: serviceId, isActive: true }).lean();
  if (!service) {
    return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
  }

  // 1) Kunci slot atomik — hanya AVAILABLE yang bisa terkunci
  const slot = await lockSlot(slotId);
  if (!slot) {
    return NextResponse.json(
      { error: "Slot sudah terambil orang lain. Silakan pilih slot lain." },
      { status: 409 }
    );
  }

  try {
    // 2) Voucher (opsional)
    let discountPercent = 0;
    if (voucherCode?.trim()) {
      const voucherResult = await validateVoucherForUser(voucherCode, session.user.id);      if (!voucherResult.ok) {
        // kembalikan slot jika voucher tidak valid
        await TimeSlotModel.updateOne(
          { _id: slot._id, status: "BOOKED_PENDING" },
          { $set: { status: "AVAILABLE", lockedUntil: null, reservationId: null } }
        );
        return NextResponse.json(
          { error: voucherMessage(voucherResult.reason) },
          { status: 400 }
        );
      }
      discountPercent = voucherResult.voucher.discountPercent;
    }

    // 3) Hitung harga (server-side, murni dari DB)
    const price = computePrice(service.price, discountPercent);

    // 4) Simpan reservasi
    const reservation = await ReservationModel.create({
      user: new Types.ObjectId(String(session.user.id)),
      service: service._id,
      timeSlot: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      status: "PENDING_PAYMENT",
      notes: notes ?? "",
      subtotal: price.subtotal,
      discountPercent: price.discountPercent,
      discountAmount: price.discountAmount,
      total: price.total,
      dpAmount: price.dpAmount,
      remainingAmount: price.remainingAmount,
      voucherCode: voucherCode?.trim().toUpperCase() ?? null,
    });

    // 5) Ikat slot ke reservasi
    await TimeSlotModel.updateOne(
      { _id: slot._id },
      { $set: { reservationId: reservation._id } }
    );

    // 6) Buat payment DP via provider (simulasi / xendit)
    const provider = getPaymentProvider();
    const externalId = `dp-${reservation._id.toString()}`;
    const expiresAt = new Date(Date.now() + getLockDurationMs());
    const paymentResult = await provider.createPayment({
      externalId,
      amount: price.dpAmount,
      description: `DP ${service.name} — ${slot.date} ${slot.startTime}`,
      expiresAt,
    });

    await PaymentModel.create({
      reservation: reservation._id,
      type: "DP",
      provider: provider.name,
      externalId,
      amount: price.dpAmount,
      status: "PENDING",
      qrString: paymentResult.qrString,
      method: "QRIS",
      paidAt: null,
      raw: { provider: provider.name },
    });

    return NextResponse.json(
      {
        success: true,
        reservation: {
          id: reservation._id,
          status: reservation.status,
          date: reservation.date,
          startTime: reservation.startTime,
          serviceName: service.name,
          price,
          qrString: paymentResult.qrString,
          expiresAt: expiresAt.toISOString(),
          externalId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Gagal di tengah → kembalikan slot agar tidak terkunci selamanya
    await TimeSlotModel.updateOne(
      { _id: slot._id, status: "BOOKED_PENDING" },
      { $set: { status: "AVAILABLE", lockedUntil: null, reservationId: null } }
    );
    console.error("Gagal membuat reservasi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat reservasi" },
      { status: 500 }
    );
  }
}

function voucherMessage(reason: "NOT_FOUND" | "INACTIVE" | "ALREADY_USED") {
  switch (reason) {
    case "NOT_FOUND":
      return "Kode voucher tidak ditemukan.";
    case "INACTIVE":
      return "Voucher tidak aktif.";
    case "ALREADY_USED":
      return "Voucher ini sudah pernah kamu pakai.";
  }
}
