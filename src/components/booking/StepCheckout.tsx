"use client";

import { useState } from "react";
import { CheckCircle2, TicketPercent } from "lucide-react";
import { formatRupiah, formatTime } from "@/lib/utils";
import { computePrice } from "@/lib/services/pricing";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { ServiceOption, SlotOption, PriceBreakdown } from "./types";

export function StepCheckout({
  service,
  slot,
  creating,
  onConfirm,
}: {
  service: ServiceOption;
  slot: SlotOption;
  creating: boolean;
  onConfirm: (voucherCode: string, notes: string) => Promise<void>;
}) {
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherState, setVoucherState] = useState<
    { valid: true; discountPercent: number; description: string } | { valid: false; reason: string } | null
  >(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [notes, setNotes] = useState("");

  const price: PriceBreakdown = computePrice(
    service.price,
    voucherState?.valid ? voucherState.discountPercent : 0
  );

  const applyVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) return;
    setCheckingVoucher(true);
    setVoucherState(null);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setVoucherState({
          valid: true,
          discountPercent: data.discountPercent,
          description: data.description ?? "",
        });
      } else {
        setVoucherState({ valid: false, reason: voucherReason(data.reason) });
      }
    } catch {
      setVoucherState({ valid: false, reason: "Gagal memvalidasi voucher." });
    } finally {
      setCheckingVoucher(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink-900">Ringkasan & pembayaran</h2>
      <p className="mt-1 text-sm text-ink-600">
        Cek kembali pilihanmu sebelum mengunci slot.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{service.name}</h3>
            <p className="text-sm text-ink-600">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)} ·{" "}
              {slot.date}
            </p>
          </div>
          <span className="font-display text-lg font-bold text-ink-900">
            {formatRupiah(service.price)}
          </span>
        </div>

        {/* Voucher */}
        <div className="mt-5 border-t border-line pt-5">
          <Field label="Kode voucher (opsional)">
            <div className="flex gap-2">
              <Input
                placeholder="cth: CUKURFIRST"
                value={voucherCode}
                onChange={(e) => {
                  setVoucherCode(e.target.value.toUpperCase());
                  setVoucherState(null);
                }}
              />
              <Button
                variant="outline"
                onClick={applyVoucher}
                loading={checkingVoucher}
                disabled={!voucherCode.trim()}
              >
                Pakai
              </Button>
            </div>
          </Field>
          {voucherState?.valid && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ok-800">
              <CheckCircle2 size={15} /> Voucher {voucherCode} — diskon{" "}
              {voucherState.discountPercent}% ({voucherState.description})
            </p>
          )}
          {voucherState && !voucherState.valid && (
            <p className="mt-2 text-sm text-danger-600">{voucherState.reason}</p>
          )}
        </div>

        {/* Rincian harga */}
        <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between text-ink-600">
            <dt>Harga layanan</dt>
            <dd>{formatRupiah(price.subtotal)}</dd>
          </div>
          {price.discountAmount > 0 && (
            <div className="flex justify-between text-ok-800">
              <dt>Diskon voucher</dt>
              <dd>-{formatRupiah(price.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between font-medium text-ink-900">
            <dt>Total</dt>
            <dd>{formatRupiah(price.total)}</dd>
          </div>
          <div className="flex justify-between rounded-xl bg-cream-100 px-3 py-2.5">
            <dt className="font-medium text-ink-700">DP 50% via QRIS (sekarang)</dt>
            <dd className="font-display font-bold text-ink-900">
              {formatRupiah(price.dpAmount)}
            </dd>
          </div>
          <div className="flex justify-between text-ink-600">
            <dt>Sisa (bayar di tempat)</dt>
            <dd>{formatRupiah(price.remainingAmount)}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <Field label="Catatan (opsional)" hint="Misal: minta potongan agak pendek di samping">
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tulis catatan untuk kapster..."
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-bronze-200 bg-bronze-100 px-4 py-3 text-sm text-bronze-700">
          <TicketPercent size={16} className="shrink-0" />
          Slot akan dikunci 15 menit sambil menunggu pembayaran DP.
        </div>

        <Button
          className="mt-5 w-full"
          size="lg"
          loading={creating}
          onClick={() => onConfirm(voucherState?.valid ? voucherCode.trim() : "", notes)}
        >
          Amankan Slot & Bayar DP {formatRupiah(price.dpAmount)}
        </Button>
      </div>
    </div>
  );
}

function voucherReason(reason: string) {
  switch (reason) {
    case "NOT_FOUND":
      return "Kode voucher tidak ditemukan.";
    case "INACTIVE":
      return "Voucher tidak aktif.";
    case "ALREADY_USED":
      return "Voucher ini sudah pernah kamu pakai.";
    default:
      return "Voucher tidak berlaku.";
  }
}
