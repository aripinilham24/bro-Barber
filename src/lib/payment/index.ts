import { simulationProvider } from "./simulation";
import type { PaymentProvider } from "./types";

export type {
  PaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  WebhookEvent,
} from "./types";

/**
 * Mode pembayaran aplikasi.
 *
 * Bro Barber dikunci ke SIMULASI agar alur demo tidak pernah membuat
 * tagihan sungguhan. Integrasi Xendit tetap tersimpan di `./xendit.ts`
 * bila nanti ingin diaktifkan kembali (kembalikan `xenditProvider` di sini).
 */
export function getPaymentProvider(): PaymentProvider {
  return simulationProvider;
}

/** Selalu true selama aplikasi memakai simulasi. */
export function isSimulationMode(): boolean {
  return true;
}
