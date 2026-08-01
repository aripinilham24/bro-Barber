/**
 * Kalkulasi harga reservasi — SELALU dijalankan di server.
 * Client tidak pernah mengirim angka harga.
 */
export interface PriceBreakdown {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  dpAmount: number;
  remainingAmount: number;
}

/**
 * Hitung diskon (persen), total, lalu DP 50% (dibulatkan ke atas) dan sisa.
 * @param subtotal harga layanan (dari DB, bukan dari client)
 * @param discountPercent persen diskon (0 bila tanpa voucher)
 */
export function computePrice(
  subtotal: number,
  discountPercent = 0
): PriceBreakdown {
  const safeSubtotal = Math.max(0, Math.round(subtotal));
  const safePercent = Math.min(100, Math.max(0, Math.round(discountPercent)));

  const discountAmount = Math.round(safeSubtotal * (safePercent / 100));
  const total = safeSubtotal - discountAmount;
  // DP dibulatkan ke atas agar penjumlahan DP + sisa = total
  const dpAmount = Math.ceil(total / 2);
  const remainingAmount = total - dpAmount;

  return {
    subtotal: safeSubtotal,
    discountPercent: safePercent,
    discountAmount,
    total,
    dpAmount,
    remainingAmount,
  };
}
