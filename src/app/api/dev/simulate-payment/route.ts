import { NextRequest, NextResponse } from "next/server";
import { processPaymentEvent } from "@/lib/payment/process";
import type { WebhookEvent } from "@/lib/payment";

/**
 * POST /api/dev/simulate-payment — dipakai oleh tombol demo pembayaran.
 * Mensimulasikan webhook pembayaran tanpa memaparkan token ke klien.
 * Body: { externalId, event?: "payment.paid" | "payment.expired" }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const externalId = body?.externalId;
  if (!externalId) {
    return NextResponse.json({ error: "externalId wajib diisi" }, { status: 400 });
  }

  const event: WebhookEvent = {
    provider: "simulation",
    event: body?.event === "payment.expired" ? "payment.expired" : "payment.paid",
    externalId: String(externalId),
    paidAt: new Date(),
    raw: { simulation: true, at: new Date().toISOString() },
  };

  const result = await processPaymentEvent(event);
  return NextResponse.json(result);
}
