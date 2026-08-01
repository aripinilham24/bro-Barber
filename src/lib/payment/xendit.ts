import type { PaymentProvider, WebhookEvent, CreatePaymentParams } from "./types";

/**
 * Provider XENDIT (belum aktif — stub siap pakai).
 *
 * Untuk mengaktifkan:
 * 1. Isi env: PAYMENT_PROVIDER=xendit, XENDIT_SECRET_KEY, XENDIT_WEBHOOK_TOKEN.
 * 2. Terapkan createPayment() → Xendit Payment Request v3:
 *    POST https://api.xendit.co/v2/payment_requests
 *    header: Authorization: Basic <base64(secretKey:)>
 *    body: { reference_id, amount, currency: "IDR",
 *            payment_method: { type: "QR_CODE", reusability: "ONE_TIME_USE", qr_code: { channel_code: "QRIS" } },
 *            metadata: { externalId }, expires_at }
 * 3. Terapkan parseWebhook() → verifikasi header `x-callback-token`
 *    (bandingkan dengan XENDIT_WEBHOOK_TOKEN), lalu petakan:
 *    - payment_request.paid (atau payment.capture) → event "payment.paid"
 *    - payment_request.expiry → event "payment.expired"
 *    Gunakan payment_request.reference_id / metadata.externalId sebagai externalId.
 */

export const xenditProvider: PaymentProvider = {
  name: "xendit",

  async createPayment(_params: CreatePaymentParams) {
    throw new Error(
      "Xendit belum dikonfigurasi. Set PAYMENT_PROVIDER=simulation atau lengkapi XENDIT_SECRET_KEY."
    );
  },

  async parseWebhook(_request: Request): Promise<WebhookEvent | null> {
    throw new Error(
      "Xendit belum dikonfigurasi. Webhook diterima tetapi provider belum diimplementasikan."
    );
  },
};
