"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";

interface ReviewRow {
  _id: string;
  rating: number;
  comment: string;
  photoUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user?: { name: string } | null;
  reservation?: { date: string; startTime: string } | null;
}

export default function UlasanPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  if (loading) return <PageLoader label="Memuat ulasan..." />;

  return (
    <div>
      <PageHeader title="Moderasi Ulasan" subtitle="Setujui ulasan agar tampil di landing page." />

      {rows.length === 0 ? (
        <EmptyState title="Belum ada ulasan" description="Ulasan dari pelanggan akan muncul di sini." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r._id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StarRating rating={r.rating} />
                  <span className="text-sm font-medium text-ink-900">{r.user?.name ?? "Pelanggan"}</span>
                </div>
                <Badge tone={r.status === "APPROVED" ? "ok" : r.status === "REJECTED" ? "danger" : "warn"}>
                  {r.status === "APPROVED" ? "Disetujui" : r.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">“{r.comment}”</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-ink-400">
                  {r.reservation ? `${r.reservation.date} · ${r.reservation.startTime}` : "Ulasan demo"}
                </p>
                {r.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setStatus(r._id, "APPROVED")}>
                      <Check size={15} /> Setujui
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(r._id, "REJECTED")}>
                      <X size={15} /> Tolak
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
