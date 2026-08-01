"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Clock3, PartyPopper } from "lucide-react";
import { formatDate, formatRupiah, formatTime, todayISO } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_TONE } from "@/lib/status";

interface ScheduleReservation {
  _id: string;
  status: string;
  startTime: string;
  notes?: string;
  total: number;
  dpAmount: number;
  remainingAmount: number;
  user?: { name: string; phone?: string } | null;
  service?: { name: string } | null;
  timeSlot?: { startTime: string; endTime: string } | null;
}

export default function DashboardHome() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<{
    date: string;
    stats: { total: number; pending: number; dpPaid: number; completed: number };
    reservations: ScheduleReservation[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/schedule?date=${d}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const stats = data?.stats;

  return (
    <div>
      <PageHeader
        title="Jadwal Hari Ini"
        subtitle={data ? formatDate(data.date) : "Memuat jadwal..."}
        action={
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total Reservasi" value={stats?.total ?? 0} />
        <StatCard icon={Clock3} label="Menunggu DP" value={stats?.pending ?? 0} tone="warn" />
        <StatCard icon={ClipboardList} label="DP Lunas" value={stats?.dpPaid ?? 0} tone="info" />
        <StatCard icon={PartyPopper} label="Selesai" value={stats?.completed ?? 0} tone="ok" />
      </div>

      {loading ? (
        <PageLoader label="Memuat jadwal..." />
      ) : data && data.reservations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDays}
            title="Belum ada reservasi"
            description="Tidak ada jadwal untuk tanggal ini. Coba tanggal lain."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {data?.reservations.map((r) => (
            <Link key={r._id} href={`/dashboard/reservasi/${r._id}`} className="block">
              <Card className="flex flex-wrap items-center gap-4 p-5 transition-all hover:border-ink-400 hover:shadow-sm">
                <span className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-ink-900 text-cream-50">
                  <span className="font-display text-lg font-bold leading-none">
                    {formatTime(r.timeSlot?.startTime ?? r.startTime).replace(".", "")}
                  </span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">
                    WIB
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">
                    {r.user?.name ?? "Pelanggan"} — {r.service?.name ?? "Layanan"}
                  </p>
                  <p className="text-sm text-ink-600">
                    {r.user?.phone ? `WhatsApp ${r.user.phone}` : "Tanpa nomor kontak"}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink-900">
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  tone?: "ok" | "warn" | "info" | "neutral";
}) {
  const tones: Record<string, string> = {
    ok: "bg-ok-100 text-ok-800",
    warn: "bg-warn-100 text-warn-800",
    info: "bg-info-100 text-info-800",
    neutral: "bg-cream-100 text-ink-700",
  };
  return (
    <Card className="p-4">
      <span className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={17} />
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-600">{label}</p>
    </Card>
  );
}
