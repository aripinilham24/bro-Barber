import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payment";
import { processPaymentEvent } from "@/lib/payment/process";

/**
 * POST /api/webhooks/payment — dipanggil penyedia pembayaran (simulasi / Xendit).
 * Verifikasi token dilakukan oleh provider.parseWebhook; respons 2xx cepat
 * karena Xendit akan melakukan retry bila bukan 2xx.
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
