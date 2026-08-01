import { describe, expect, it } from "vitest";
import { computePrice } from "@/lib/services/pricing";

describe("computePrice", () => {
  it("tanpa diskon: DP = 50% total", () => {
    const p = computePrice(50000, 0);
    expect(p).toEqual({
      subtotal: 50000,
      discountPercent: 0,
      discountAmount: 0,
      total: 50000,
      dpAmount: 25000,
      remainingAmount: 25000,
    });
  });

  it("dengan diskon 10%: total berkurang 10%, DP = 50% dari total", () => {
    const p = computePrice(50000, 10);
    expect(p.discountAmount).toBe(5000);
    expect(p.total).toBe(45000);
    expect(p.dpAmount + p.remainingAmount).toBe(45000);
    expect(p.dpAmount).toBe(22500);
  });

  it("DP dibulatkan ke atas (ceil) agar DP + sisa = total", () => {
    // total 45.001 → ceil(22500.5) = 22501, sisa 22500
    const p = computePrice(45001, 0);
    expect(p.dpAmount).toBe(22501);
    expect(p.remainingAmount).toBe(22500);
    expect(p.dpAmount + p.remainingAmount).toBe(45001);
  });

  it("diskon dibatasi maksimal 100% dan harga tidak negatif", () => {
    const p = computePrice(10000, 150);
    expect(p.discountPercent).toBe(100);
    expect(p.total).toBe(0);
    expect(p.dpAmount).toBe(0);
    expect(p.remainingAmount).toBe(0);
  });

  it("subtotal negatif dibulatkan ke 0", () => {
    const p = computePrice(-5000, 0);
    expect(p.subtotal).toBe(0);
    expect(p.total).toBe(0);
  });

  it("harga pecahan dibulatkan ke rupiah utuh", () => {
    const p = computePrice(10000.5, 0);
    expect(p.subtotal).toBe(10001);
  });
});
