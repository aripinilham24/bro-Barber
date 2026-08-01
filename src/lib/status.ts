import type { BadgeProps } from "@/components/ui/Badge";

/** Label bahasa Indonesia untuk status reservasi */
export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu DP",
  DP_PAID: "DP Lunas",
  COMPLETED: "Selesai",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

/** Tone Badge untuk status reservasi */
export const RESERVATION_STATUS_TONE: Record<
  string,
  NonNullable<BadgeProps["tone"]>
> = {
  PENDING_PAYMENT: "warn",
  DP_PAID: "info",
  COMPLETED: "ok",
  EXPIRED: "danger",
  CANCELLED: "neutral",
};

/** Label & tone status pembayaran */
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  PAID: "Lunas",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
};

export const PAYMENT_STATUS_TONE: Record<
  string,
  NonNullable<BadgeProps["tone"]>
> = {
  PENDING: "warn",
  PAID: "ok",
  EXPIRED: "danger",
  FAILED: "danger",
};
