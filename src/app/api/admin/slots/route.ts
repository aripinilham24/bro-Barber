import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { TimeSlotModel } from "@/lib/db/models";
import { requireRoles, STAFF_ROLES } from "@/lib/api-helpers";
import { ensureSlotsForDate } from "@/lib/services/slots";

/**
 * GET /api/admin/slots?date=YYYY-MM-DD → semua slot (semua status) untuk kelola
 * PATCH /api/admin/slots → tutup/buka slot manual
 *   Body: { slotId, action: "close" | "open" }
 */
export async function GET(request: NextRequest) {
  const auth = await requireRoles(STAFF_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await connectDB();
  const date = new URL(request.url).searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Parameter date wajib diisi" }, { status: 400 });
  }

  await ensureSlotsForDate(date);
  const slots = await TimeSlotModel.find({ date })
    .sort({ startTime: 1 })
    .populate("reservationId", "user status startTime")
    .lean();

  return NextResponse.json(slots);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRoles(STAFF_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const { slotId, action } = body ?? {};
  if (!slotId || !["close", "open"].includes(action)) {
    return NextResponse.json(
      { error: "slotId dan action (close/open) wajib diisi" },
      { status: 400 }
    );
  }

  await connectDB();
  const slot = await TimeSlotModel.findById(slotId);
  if (!slot) {
    return NextResponse.json({ error: "Slot tidak ditemukan" }, { status: 404 });
  }
  if (slot.status === "BOOKED" || slot.status === "BOOKED_PENDING") {
    return NextResponse.json(
      { error: "Slot yang sudah dibooking tidak bisa diubah" },
      { status: 400 }
    );
  }

  slot.status = action === "close" ? "CLOSED" : "AVAILABLE";
  await slot.save();

  return NextResponse.json({ success: true, status: slot.status });
}
