import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payment";
import { processPaymentEvent } from "@/lib/payment/process";

/**
 * POST /api/webhooks/payment — dipanggil penyedia pembayaran simulasi.
 * Verifikasi token dilakukan oleh provider.parseWebhook.
 */
export async function POST(request: NextRequest) {
  const provider = getPaymentProvider();
  const parsed = await provider.parseWebhook(request);

  if (!parsed) {
    return NextResponse.json({ error: "Webhook tidak valid" }, { status: 400 });
  }

  const result = await processPaymentEvent(parsed);
  return NextResponse.json(result);
}
