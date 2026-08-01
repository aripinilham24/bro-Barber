import { NextRequest, NextResponse } from "next/server";
import { processPaymentEvent } from "@/lib/payment/process";
import type { WebhookEvent } from "@/lib/payment";

/**
 * POST /api/dev/simulate-payment — HANYA untuk mode simulasi (development).
 * Mensimulasikan webhook pembayaran tanpa memaparkan token ke klien.
 * Body: { externalId, event?: "payment.paid" | "payment.expired" }
 * Endpoint ini non-aktif (404) bila PAYMENT_PROVIDER bukan "simulation".
 */
export async function POST(request: NextRequest) {
  if ((process.env.PAYMENT_PROVIDER ?? "simulation") !== "simulation") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
