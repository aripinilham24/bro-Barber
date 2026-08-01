"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatRupiah, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_TONE } from "@/lib/status";

interface Row {
  _id: string;
  status: string;
  date: string;
  startTime: string;
  total: number;
  remainingAmount: number;
  user?: { name: string; phone?: string } | null;
  service?: { name: string } | null;
}

const STATUS_OPTIONS = [
  ["ALL", "Semua Status"],
  ["PENDING_PAYMENT", "Menunggu DP"],
  ["DP_PAID", "DP Lunas"],
  ["COMPLETED", "Selesai"],
  ["EXPIRED", "Kedaluwarsa"],
];

export default function ReservasiListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status !== "ALL") params.set("status", status);
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const res = await fetch(`/api/admin/reservations?${params.toString()}`);
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [date, status, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Semua Reservasi" subtitle="Cari pelanggan, lihat status, dan kelola pembayaran." />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Cari nama / no. HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-44" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <PageLoader label="Memuat reservasi..." />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Tidak ada reservasi"
          description="Coba ubah filter atau cari nama lain."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Link key={r._id} href={`/dashboard/reservasi/${r._id}`} className="block">
              <Card className="flex items-center justify-between gap-4 p-5 transition-all hover:border-ink-400 hover:shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">
                    {r.user?.name ?? "Pelanggan"} — {r.service?.name ?? "Layanan"}
                  </p>
                  <p className="text-sm text-ink-600">
                    {r.date} · {formatTime(r.startTime)} ·{" "}
                    {r.user?.phone ? `WhatsApp ${r.user.phone}` : "tanpa kontak"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink-900">
                    Sisa {formatRupiah(r.remainingAmount)}
                  </p>
                  <Badge tone={RESERVATION_STATUS_TONE[r.status] ?? "neutral"} dot className="mt-1">
                    {RESERVATION_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
