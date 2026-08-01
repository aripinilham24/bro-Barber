import { simulationProvider } from "./simulation";
import { xenditProvider } from "./xendit";
import type { PaymentProvider } from "./types";

export type {
  PaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  WebhookEvent,
} from "./types";

/** Pilih provider berdasarkan env PAYMENT_PROVIDER ("simulation" | "xendit") */
export function getPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_PROVIDER ?? "simulation";
  return mode === "xendit" ? xenditProvider : simulationProvider;
}
