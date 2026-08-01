"use client";

import Link from "next/link";
import { CalendarCheck, MapPin } from "lucide-react";
import { formatDate, formatRupiah, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { OrderData } from "./types";

export function StepSuccess({ order }: { order: OrderData }) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok-100 text-ok-800">
        <CalendarCheck size={30} />
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold text-ink-900">
        Slotmu aman, Bro!
      </h2>
      <p className="mt-2 text-sm text-ink-600">
        Datang 10 menit sebelum jam booking. Sisanya{" "}
        <strong>{formatRupiah(order.price.remainingAmount)}</strong> dibayar
        setelah selesai di tempat.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-left">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <p className="font-display text-lg font-semibold text-ink-900">
              {order.serviceName}
            </p>
            <p className="text-sm text-ink-600">
              {formatDate(order.date)} · {formatTime(order.startTime)}
            </p>
          </div>
          <span className="text-sm text-ink-400">#{order.id.slice(-6).toUpperCase()}</span>
        </div>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-600">
            <dt>Total</dt>
            <dd>{formatRupiah(order.price.total)}</dd>
          </div>
          <div className="flex justify-between text-ok-800">
            <dt>DP dibayar</dt>
            <dd>-{formatRupiah(order.price.dpAmount)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-medium text-ink-900">
            <dt>Sisa tagihan</dt>
            <dd>{formatRupiah(order.price.remainingAmount)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-600">
        <MapPin size={15} className="text-bronze-600" />
        Alamat akan dikirim detailnya di dashboard.
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/riwayat">
          <Button variant="outline" className="w-full sm:w-auto">
            Lihat Riwayat
          </Button>
        </Link>
        <Link href="/">
          <Button className="w-full sm:w-auto">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  );
}
