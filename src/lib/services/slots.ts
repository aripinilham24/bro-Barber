import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import {
  TimeSlotModel,
  SiteContentModel,
  ReservationModel,
  PaymentModel,
  DEFAULT_BUSINESS_DAYS,
} from "@/lib/db/models";
import { addDays } from "@/lib/utils";

/** Lama slot dikunci sementara menunggu DP (menit) */
export const SLOT_LOCK_MINUTES = 15;

export function getLockDurationMs() {
  return SLOT_LOCK_MINUTES * 60 * 1000;
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlotTimes(
  open: string,
  close: string,
  duration: number,
  gap: number
) {
  const start = toMinutes(open);
  const end = toMinutes(close);
  const step = Math.max(5, duration + gap);
  const slots: Array<{ start: string; end: string }> = [];
  for (let t = start; t + duration <= end; t += step) {
    slots.push({ start: toHHMM(t), end: toHHMM(t + duration) });
  }
  return slots;
}

/** Ambil jam buka + durasi slot untuk sebuah tanggal (dari SiteContent CMS) */
async function getBusinessDay(date: string) {
  const content = await SiteContentModel.findOne().lean();
  // getDay(): Minggu=0 ... Sabtu=6 → ubah jadi Senin=1 .. Minggu=7
  const dow = ((new Date(`${date}T00:00:00`).getDay() + 6) % 7) + 1;
  const days =
    (content?.hours?.days as Record<string, { open: string; close: string }> | undefined) ??
    DEFAULT_BUSINESS_DAYS;
  const day = days[String(dow)] ?? { open: "", close: "" };
  return {
    open: day.open ?? "",
    close: day.close ?? "",
    duration: content?.hours?.slotDurationMinutes ?? 45,
    gap: content?.hours?.slotGapMinutes ?? 0,
  };
}

/** Pastikan semua slot untuk satu tanggal tersedia (idempotent, upsert) */
export async function ensureSlotsForDate(date: string) {
  const { open, close, duration, gap } = await getBusinessDay(date);
  if (!open || !close) return 0;

  const times = generateSlotTimes(open, close, duration, gap);
  if (times.length === 0) return 0;

  await TimeSlotModel.bulkWrite(
    times.map(({ start, end }) => ({
      updateOne: {
        filter: { date, startTime: start },
        update: {
          $setOnInsert: { date, startTime: start, endTime: end, status: "AVAILABLE" },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );
  return times.length;
}

/** Pastikan slot tersedia untuk rentang tanggal (hari ini + N hari) */
export async function ensureSlotsForRange(fromDate: string, days: number) {
  let created = 0;
  for (let i = 0; i < days; i++) {
    created += await ensureSlotsForDate(addDays(fromDate, i));
  }
  return created;
}

/**
 * Sweep: kembalikan slot yang terkunci (BOOKED_PENDING) tapi sudah lewat
 * batas waktu pembayaran ke AVAILABLE, dan tandai reservasi terkait EXPIRED.
 * Dipanggil sebelum membaca slot & sebelum checkout.
 */
export async function sweepExpiredSlots() {
  const now = new Date();
  const expired = await TimeSlotModel.find({
    status: "BOOKED_PENDING",
    lockedUntil: { $lte: now },
  }).select("_id reservationId");

  if (expired.length === 0) return 0;

  const slotIds = expired.map((s) => s._id);
  const reservationIds = expired
    .filter((s) => s.reservationId)
    .map((s) => s.reservationId as Types.ObjectId);

  const upd = await TimeSlotModel.updateMany(
    { _id: { $in: slotIds }, status: "BOOKED_PENDING" },
    { $set: { status: "AVAILABLE", lockedUntil: null, reservationId: null } }
  );

  if (reservationIds.length > 0) {
    await ReservationModel.updateMany(
      { _id: { $in: reservationIds }, status: "PENDING_PAYMENT" },
      { $set: { status: "EXPIRED" } }
    );
    await PaymentModel.updateMany(
      { reservation: { $in: reservationIds }, status: "PENDING" },
      { $set: { status: "EXPIRED" } }
    );
  }
  return upd.modifiedCount;
}

/**
 * Kunci slot secara ATOMIK: hanya sukses jika slot masih AVAILABLE.
 * Mencegah double-booking pada level database (bukan sekadar UI).
 * @returns slot baru, atau null bila slot sudah terambil/ditutup
 */
export async function lockSlot(
  slotId: string | Types.ObjectId,
  reservationId?: Types.ObjectId
) {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + getLockDurationMs());
  const slot = await TimeSlotModel.findOneAndUpdate(
    { _id: slotId, status: "AVAILABLE" },
    {
      $set: {
        status: "BOOKED_PENDING",
        lockedUntil,
        ...(reservationId ? { reservationId } : {}),
      },
    },
    { new: true }
  );
  return slot;
}
