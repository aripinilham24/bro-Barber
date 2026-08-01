import type { PaymentProvider, CreatePaymentResult, CreatePaymentParams, WebhookEvent } from "./types";

/**
 * Provider SIMULASI untuk development/demo.
 * Tidak terhubung ke jaringan pembayaran: cukup render QR dari string,
 * lalu tekan "Simulasikan Pembayaran" yang mengirim webhook lokal.
 * Struktur mengikuti kontrak PaymentProvider sehingga mudah diganti Xendit.
 */

const getToken = () =>
  process.env.PAYMENT_WEBHOOK_TOKEN ?? "brobarber-sim-webhook-token";

export const simulationProvider: PaymentProvider = {
  name: "simulation",

  async createPayment({
    externalId,
    amount,
    expiresAt,
    description: _description,
  }: CreatePaymentParams): Promise<CreatePaymentResult> {
    // String QRIS palsu (bukan QRIS asli). Ditampilkan sebagai QR + kode manual.
    const qrString = `SIMQRIS|${externalId}|${amount}|BROBARBER`;
    return { externalId, qrString, expiresAt };
  },

  async parseWebhook(request: Request): Promise<WebhookEvent | null> {
    const token =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      request.headers.get("x-callback-token");

    if (!token || token !== getToken()) return null;

    let body: {
      externalId?: unknown;
      event?: unknown;
      paidAt?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return null;
    }

    if (!body.externalId) return null;

    const event =
      body.event === "payment.expired" ? "payment.expired" : "payment.paid";

    return {
      provider: "simulation",
      event,
      externalId: String(body.externalId),
      paidAt: body.paidAt ? new Date(String(body.paidAt)) : new Date(),
      raw: body,
    };
  },
};
