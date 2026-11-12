/**
 * Abstraksi penyedia pembayaran.
 * Aplikasi demo ini selalu memakai provider simulasi.
 * Integrasi Xendit tetap tersedia di `xendit.ts` untuk pengembangan lanjutan.
 */

export interface CreatePaymentParams {
  /** ID unik kita untuk melacak pembayaran (idempotency key) */
  externalId: string;
  amount: number;
  description: string;
  expiresAt: Date;
}

export interface CreatePaymentResult {
  externalId: string;
  /** String yang dirender menjadi QRIS */
  qrString: string;
  expiresAt: Date;
}

export interface WebhookEvent {
  provider: "simulation" | "xendit";
  event: "payment.paid" | "payment.expired";
  externalId: string;
  paidAt?: Date;
  raw: unknown;
}

export interface PaymentProvider {
  name: "simulation" | "xendit";
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  /**
   * Validasi & parse webhook. Kembalikan null bila signature/token tidak valid
   * atau payload tidak dikenali.
   */
  parseWebhook(request: Request): Promise<WebhookEvent | null>;
}
