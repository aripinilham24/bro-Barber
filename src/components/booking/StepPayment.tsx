"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { BadgeCheck, Clock, QrCode, RefreshCcw } from "lucide-react";
import { formatRupiah, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { OrderData } from "./types";

export function StepPayment({
  order,
  onPaid,
  onRestart,
}: {
  order: OrderData;
  onPaid: () => void;
  onRestart: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [remaining, setRemaining] = useState<number>(0);
  const [status, setStatus] = useState<"waiting" | "paid" | "expired">("waiting");
  const [simulating, setSimulating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [serverStatus, setServerStatus] = useState(order.status);

  // Render QR
  useEffect(() => {
    if (!order.qrString) return;
    QRCode.toDataURL(order.qrString, {
      width: 280,
      margin: 2,
      color: { dark: "#17150F", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [order.qrString]);

  // Countdown
  useEffect(() => {
    const tick = () => {
      const diff = new Date(order.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setStatus("expired");
        stopPolling();
      } else {
        setRemaining(diff);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order.expiresAt]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${order.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setServerStatus(data.reservation.status);
      if (data.reservation.status === "DP_PAID") {
        setStatus("paid");
        stopPolling();
      } else if (data.reservation.status === "EXPIRED") {
        setStatus("expired");
        stopPolling();
      }
    } catch {
      /* abaikan, akan coba lagi */
    }
  }, [order.id, stopPolling]);

  // Polling status
  useEffect(() => {
    pollRef.current = setInterval(checkStatus, 3000);
    return stopPolling;
  }, [checkStatus, stopPolling]);

  const simulatePayment = async () => {
    setSimulating(true);
    try {
      await fetch("/api/dev/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId: order.externalId, event: "payment.paid" }),
      });
    } catch {
      /* abaikan */
    } finally {
      setSimulating(false);
    }
    await checkStatus();
  };

  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink-900">Bayar DP via QRIS</h2>
      <p className="mt-1 text-sm text-ink-600">
        Scan QR di bawah dengan aplikasi pembayaran kamu (GoPay, OVO, ShopeePay,
        mobile banking, dll).
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
        {/* QR */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QRIS simulasi pembayaran DP"
                width={280}
                height={280}
                className="h-[240px] w-[240px]"
              />
            ) : (
              <div className="flex h-[240px] w-[240px] items-center justify-center text-ink-400">
                <QrCode size={48} />
              </div>
            )}
          </div>
          <p className="text-xs text-ink-400">
            Merchant: <strong className="text-ink-700">Bro Barber</strong>
          </p>
        </div>

        {/* Rincian & status */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600">Nominal DP</span>
              <span className="font-display text-2xl font-bold text-ink-900">
                {formatRupiah(order.price.dpAmount)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-ink-600">{order.serviceName}</span>
              <span className="text-ink-700">
                {order.date} · {formatTime(order.startTime)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5">
            <Clock size={20} className="shrink-0 text-bronze-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">Batas pembayaran</p>
              <p className="text-xs text-ink-600">
                Slot dikunci selama 15 menit. Setelah lewat, slot kembali kosong.
              </p>
            </div>
            <span
              className={`font-display text-2xl font-bold tabular-nums ${
                remaining < 60000 ? "text-danger-600" : "text-ink-900"
              }`}
            >
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </span>
          </div>

          {status === "paid" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-ok-100 bg-ok-100 p-5">
              <BadgeCheck size={22} className="shrink-0 text-ok-800" />
              <div>
                <p className="font-medium text-ok-800">Pembayaran diterima!</p>
                <p className="text-sm text-ok-800/80">
                  Slotmu sudah terkunci. Menyiapkan konfirmasi...
                </p>
              </div>
            </div>
          ) : status === "expired" ? (
            <div className="rounded-2xl border border-danger-100 bg-danger-100 p-5">
              <p className="font-medium text-danger-800">Pembayaran kedaluwarsa</p>
              <p className="mt-1 text-sm text-danger-800/80">
                Slot dikembalikan ke waktu kosong. Kamu bisa booking ulang.
              </p>
              <Button className="mt-4" variant="danger" onClick={onRestart}>
                <RefreshCcw size={16} /> Booking Ulang
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-bronze-200 bg-bronze-100 p-5">
              <p className="text-sm font-medium text-bronze-700">
                Mode simulasi (development)
              </p>
              <p className="mt-1 text-sm text-bronze-700/80">
                Belum terhubung ke Xendit asli. Tekan tombol di bawah untuk
                mensimulasikan pembayaran berhasil.
              </p>
              <Button
                className="mt-4 w-full"
                variant="secondary"
                loading={simulating}
                onClick={simulatePayment}
              >
                <BadgeCheck size={16} /> Simulasikan Pembayaran Berhasil
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
