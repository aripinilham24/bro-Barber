"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { formatDateTime, formatRupiah, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from "@/lib/status";

interface ReservationDetailData {
  reservation: {
    _id: string;
    status: string;
    date: string;
    startTime: string;
    notes?: string;
    subtotal: number;
    discountAmount: number;
    total: number;
    dpAmount: number;
    remainingAmount: number;
    voucherCode?: string | null;
    service?: { name: string; price: number } | null;
    user?: { name: string; email: string; phone?: string } | null;
    timeSlot?: { startTime: string; endTime: string } | null;
  };
  payments: Array<{ _id: string; type: string; amount: number; status: string; method: string; paidAt: string | null }>;
}

export default function ReservasiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ReservationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reservations/${id}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const markComplete = async () => {
    setActionLoading(true);
    setActionMsg("");
    setActionError("");
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    const body = await res.json();
    setActionLoading(false);
    if (res.ok) {
      setActionMsg("Berhasil ditandai lunas. Selamat, reservasi selesai!");
      await load();
    } else {
      setActionError(body.error ?? "Gagal memproses.");
    }
  };

  if (loading) return <PageLoader label="Memuat detail..." />;
  if (!data) return <div>Reservasi tidak ditemukan.</div>;

  const r = data.reservation;
  const canComplete = r.status === "DP_PAID";

  return (
    <div>
      <button
        onClick={() => router.push("/dashboard/reservasi")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Semua Reservasi
      </button>

      <PageHeader
        title={`${r.user?.name ?? "Pelanggan"} — ${r.service?.name ?? "Layanan"}`}
        subtitle={`${r.date} · ${formatTime(r.timeSlot?.startTime ?? r.startTime)}`}
        action={
          <Badge tone={RESERVATION_STATUS_TONE[r.status] ?? "neutral"} dot>
            {RESERVATION_STATUS_LABEL[r.status] ?? r.status}
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Informasi Pelanggan</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Nama</dt>
              <dd className="font-medium text-ink-900">{r.user?.name ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Email</dt>
              <dd className="text-ink-900">{r.user?.email ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">WhatsApp</dt>
              <dd className="text-ink-900">{r.user?.phone || "-"}</dd>
            </div>
            {r.notes && (
              <div className="rounded-xl bg-cream-100 px-3 py-2 text-ink-600">
                <strong className="text-ink-900">Catatan:</strong> {r.notes}
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Rincian Biaya</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-ink-600">
              <dt>Subtotal</dt>
              <dd>{formatRupiah(r.subtotal)}</dd>
            </div>
            {r.discountAmount > 0 && (
              <div className="flex justify-between text-ok-800">
                <dt>Diskon {r.voucherCode}</dt>
                <dd>-{formatRupiah(r.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between font-medium text-ink-900">
              <dt>Total</dt>
              <dd>{formatRupiah(r.total)}</dd>
            </div>
            <div className="flex justify-between text-ok-800">
              <dt>DP dibayar</dt>
              <dd>-{formatRupiah(r.dpAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink-900">
              <dt>Sisa tagihan</dt>
              <dd>{formatRupiah(r.remainingAmount)}</dd>
            </div>
          </dl>

          {canComplete && (
            <div className="mt-6">
              <Button
                variant="secondary"
                className="w-full"
                size="lg"
                loading={actionLoading}
                onClick={markComplete}
              >
                <BadgeCheck size={18} /> Tandai Lunas (Sisa {formatRupiah(r.remainingAmount)})
              </Button>
              {actionMsg && <p className="mt-2 text-sm text-ok-800">{actionMsg}</p>}
              {actionError && <p className="mt-2 text-sm text-danger-600">{actionError}</p>}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-5 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Riwayat Pembayaran</h2>
        {data.payments.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">Belum ada pembayaran tercatat.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {data.payments.map((p) => (
              <li key={p._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-900">
                    {p.type === "DP" ? "DP via QRIS" : p.type === "REMAINING" ? "Pelunasan di tempat" : "Pembayaran"}
                  </p>
                  <p className="text-xs text-ink-400">
                    {p.method} · {p.paidAt ? formatDateTime(p.paidAt) : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink-900">{formatRupiah(p.amount)}</p>
                  <Badge tone={PAYMENT_STATUS_TONE[p.status] ?? "neutral"}>
                    {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
