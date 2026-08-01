"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { formatRupiah, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_TONE } from "@/lib/status";

interface MyReservation {
  _id: string;
  status: string;
  date: string;
  startTime: string;
  total: number;
  dpAmount: number;
  service?: { name: string } | null;
}

export function ReservationHistory() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login?callback=/riwayat");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/reservations/mine");
        if (res.ok) {
          const data = await res.json();
          setReservations(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isPending, session, router]);

  if (isPending) return <PageLoader label="Memeriksa sesi..." />;
  if (!session) return null;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900">Riwayat Reservasi</h1>
      <p className="mt-1 text-sm text-ink-600">Pantau jadwal cukurmu di sini.</p>

      {loading ? (
        <PageLoader label="Memuat riwayat..." />
      ) : reservations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarX2}
            title="Belum ada reservasi"
            description="Yuk amankan slot pertamamu sebelum penuh."
            action={
              <Link href="/booking">
                <Button variant="secondary">Booking Sekarang</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reservations.map((r) => (
            <Link key={r._id} href={`/reservasi/${r._id}`} className="block">
              <Card className="flex items-center justify-between gap-4 p-5 transition-all hover:border-ink-400 hover:shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">
                    {r.service?.name ?? "Layanan"}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-600">
                    {r.date} · {formatTime(r.startTime)}
                  </p>
                  <p className="mt-1 text-sm text-ink-600">
                    Total <strong className="text-ink-900">{formatRupiah(r.total)}</strong>{" "}
                    · DP {formatRupiah(r.dpAmount)}
                  </p>
                </div>
                <Badge tone={RESERVATION_STATUS_TONE[r.status] ?? "neutral"} dot>
                  {RESERVATION_STATUS_LABEL[r.status] ?? r.status}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
