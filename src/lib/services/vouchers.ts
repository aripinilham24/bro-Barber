import type { Types } from "mongoose";
import { VoucherModel, ReservationModel } from "@/lib/db/models";
import type { VoucherDoc } from "@/lib/db/models";

export type VoucherValidationResult =
  | { ok: true; voucher: VoucherDoc }
  | { ok: false; reason: "NOT_FOUND" | "INACTIVE" | "ALREADY_USED" };

/**
 * Validasi voucher: kode aktif & belum pernah dipakai user pada reservasi
 * yang sudah terbayar (DP_PAID / COMPLETED) — "pelanggan baru" = sekali pakai.
 */
export async function validateVoucherForUser(
  rawCode: string,
  userId: string | Types.ObjectId
): Promise<VoucherValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: "NOT_FOUND" };

  const voucher = await VoucherModel.findOne({ code }).lean();
  if (!voucher) return { ok: false, reason: "NOT_FOUND" };
  if (!voucher.isActive) return { ok: false, reason: "INACTIVE" };

  const alreadyUsed = await ReservationModel.exists({
    user: userId,
    voucherCode: code,
    status: { $in: ["DP_PAID", "COMPLETED"] },
  });
  if (alreadyUsed) return { ok: false, reason: "ALREADY_USED" };

  return { ok: true, voucher };
}
