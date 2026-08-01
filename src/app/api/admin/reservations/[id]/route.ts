import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ReservationModel, PaymentModel } from "@/lib/db/models";
import { requireRoles, STAFF_ROLES } from "@/lib/api-helpers";

/**
 * PATCH /api/admin/reservations/[id]
 * Body: { action: "complete" } → tandai lunas (DP_PAID → COMPLETED),
 * mencatat log pembayaran sisa (tunai) di lokasi.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(STAFF_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);

  await connectDB();

  const reservation = await ReservationModel.findById(id);
  if (!reservation) {
    return NextResponse.json({ error: "Reservasi tidak ditemukan" }, { status: 404 });
  }

  if (body?.action === "complete") {
    if (reservation.status !== "DP_PAID") {
      return NextResponse.json(
        { error: "Reservasi harus berstatus DP Lunas sebelum ditandai lunas" },
        { status: 400 }
      );
    }

    reservation.status = "COMPLETED";
    await reservation.save();

    // Catat pelunasan (tunai / QRIS offline di kasir)
    await PaymentModel.create({
      reservation: reservation._id,
      type: "REMAINING",
      provider: "cash",
      externalId: `cash-${reservation._id.toString()}`,
      amount: reservation.remainingAmount,
      status: "PAID",
      method: "CASH",
      paidAt: new Date(),
      raw: { handledBy: auth.session.user.id },
    });

    return NextResponse.json({
      success: true,
      status: reservation.status,
    });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
}
