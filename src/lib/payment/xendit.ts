import crypto from "crypto";
import { Xendit } from "xendit-node";
import type { PaymentRequest as PaymentRequestApi } from "xendit-node/payment_request";
import type {
  PaymentRequest,
  PaymentRequestParameters,
} from "xendit-node/payment_request/models";
import type {
  PaymentProvider,
  CreatePaymentResult,
  CreatePaymentParams,
  WebhookEvent,
} from "./types";

/**
 * Provider XENDIT — Payment Request v3 (QRIS).
 *
 * Membuat Payment Request QRIS sekali-pakai dan memvalidasi webhook secara
 * aman (verifikasi x-callback-token + refetch ke Xendit untuk memastikan
 * status & jumlah pembayaran yang sebenarnya, bukan hanya mempercayai body).
 *
 * Env yang dibutuhkan:
 *   PAYMENT_PROVIDER=xendit
 *   XENDIT_SECRET_KEY      (test key di sandbox berasal dari test dashboard)
 *   XENDIT_WEBHOOK_TOKEN   (token yang sama dengan "Webhook verification
 *                           token" di dashboard Xendit → header x-callback-token)
 *   XENDIT_URL             (opsional; default https://api.xendit.co)
 */

const DEFAULT_URL = "https://api.xendit.co";

let _paymentRequestApi: PaymentRequestApi | null = null;

function api(): PaymentRequestApi {
  if (!_paymentRequestApi) {
    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey) {
      throw new Error("XENDIT_SECRET_KEY belum diset.");
    }
    const client = new Xendit({
      secretKey,
      xenditURL: process.env.XENDIT_URL || DEFAULT_URL,
    });
    _paymentRequestApi = client.PaymentRequest;
  }
  return _paymentRequestApi;
}

function getWebhookToken(): string {
  return process.env.XENDIT_WEBHOOK_TOKEN ?? "";
}

/** Perbandingan token webhook secara constant-time. */
function tokenMatches(incoming: string): boolean {
  const expected = getWebhookToken();
  if (!expected || !incoming) return false;
  if (incoming.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(incoming, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

/** Ambil QRIS string dari respons Payment Request (XRIS/actions). */
function extractQrString(pr: PaymentRequest): string {
  const qrString = pr.paymentMethod?.qrCode?.channelProperties?.qrString;
  if (qrString) return qrString;
  const action = (pr.actions ?? []).find(
    (a) => a.action === "PRESENT_TO_CUSTOMER"
  );
  if (action?.qrCode) return action.qrCode;
  throw new Error("Respons Xendit tidak berisi QRIS string.");
}

/** Peta status Payment Request Xendit → event aplikasi. */
function mapStatus(status: string | undefined): "paid" | "expired" | null {
  switch (status) {
    case "SUCCEEDED":
      return "paid";
    case "EXPIRED":
      return "expired";
    default:
      return null;
  }
}

export const xenditProvider: PaymentProvider = {
  name: "xendit",

  async createPayment({
    externalId,
    amount,
    description,
    expiresAt,
  }: CreatePaymentParams): Promise<CreatePaymentResult> {
    const data: PaymentRequestParameters = {
      referenceId: externalId,
      amount,
      currency: "IDR",
      paymentMethod: {
        type: "QR_CODE",
        reusability: "ONE_TIME_USE",
        qrCode: {
          channelCode: "QRIS",
          channelProperties: { expiresAt },
        },
      },
      captureMethod: "AUTOMATIC",
      initiator: "CUSTOMER",
      description,
      metadata: { externalId },
    };

    const pr = await api().createPaymentRequest({ data });

    return {
      externalId: pr.referenceId || externalId,
      qrString: extractQrString(pr),
      expiresAt: pr.paymentMethod?.qrCode?.channelProperties?.expiresAt ?? expiresAt,
    };
  },

  async parseWebhook(request: Request): Promise<WebhookEvent | null> {
    const cbToken = request.headers.get("x-callback-token") ?? "";
    if (!tokenMatches(cbToken)) return null;

    let body: {
      event?: unknown;
      data?: Record<string, unknown>;
      id?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return null;
    }

    // paymentRequestId bisa dari body.data.id (PaymentRequestCallback)
    // atau top-level body.id (raw PaymentRequest untuk event payment).
    const data = body.data ?? {};
    const paymentRequestId =
      (data as { id?: string }).id ?? (body.id as string | undefined);
    if (!paymentRequestId) return null;

    let pr: PaymentRequest;
    try {
      pr = await api().getPaymentRequestByID({
        paymentRequestId,
      });
    } catch {
      return null;
    }

    const event = mapStatus(pr.status);
    if (!event) return null;

    const externalId =
      pr.referenceId ??
      ((pr.metadata as { externalId?: string } | null)?.externalId ?? "");
    if (!externalId) return null;

    return {
      provider: "xendit",
      event: event === "paid" ? "payment.paid" : "payment.expired",
      externalId,
      paidAt: event === "paid" ? new Date(pr.updated) : undefined,
      raw: pr,
    };
  },
};
