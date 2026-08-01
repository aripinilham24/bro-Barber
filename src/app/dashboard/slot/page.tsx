"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTime, todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";

interface SlotRow {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED_PENDING" | "BOOKED" | "CLOSED";
  reservationId?: { _id: string; status: string; user?: { name: string } | null } | null;
}

const STATUS_STYLE: Record<SlotRow["status"], string> = {
  AVAILABLE: "border-line bg-white text-ink-900",
  BOOKED_PENDING: "border-warn-100 bg-warn-100 text-warn-800",
  BOOKED: "border-ok-100 bg-ok-100 text-ok-800",
  CLOSED: "border-line bg-cream-100 text-ink-400 line-through",
};

export default function KelolaSlotPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/slots?date=${d}`);
      if (res.ok) setSlots(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const toggle = async (slot: SlotRow) => {
    const action = slot.status === "CLOSED" ? "open" : "close";
    setBusy(slot._id);
    const res = await fetch("/api/admin/slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: slot._id, action }),
    });
    setBusy(null);
    if (res.ok) await load(date);
  };

  return (
    <div>
      <PageHeader
        title="Kelola Slot"
        subtitle="Tutup slot manual untuk kasus khusus (kapster sakit/istirahat)."
        action={
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        }
      />

      {loading ? (
        <PageLoader label="Memuat slot..." />
      ) : slots.length === 0 ? (
        <EmptyState
          title="Tidak ada slot"
          description="Tanggal ini tutup atau belum punya slot."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((slot) => {
            const clickable = slot.status === "AVAILABLE" || slot.status === "CLOSED";
            return (
              <div
                key={slot._id}
                className={cn(
                  "rounded-2xl border p-4 text-center",
                  STATUS_STYLE[slot.status]
                )}
              >
                <p className="font-display text-lg font-bold">{formatTime(slot.startTime)}</p>
                <p className="text-xs opacity-70">
                  {slot.status === "AVAILABLE"
                    ? "Kosong"
                    : slot.status === "BOOKED_PENDING"
                      ? "Menunggu DP"
                      : slot.status === "BOOKED"
                        ? `Terbooking · ${slot.reservationId?.user?.name ?? "pelanggan"}`
                        : "Ditutup"}
                </p>
                {clickable && (
                  <Button
                    size="sm"
                    variant={slot.status === "CLOSED" ? "secondary" : "outline"}
                    className="mt-3 w-full"
                    loading={busy === slot._id}
                    onClick={() => toggle(slot)}
                  >
                    {slot.status === "CLOSED" ? "Buka Slot" : "Tutup Slot"}
                  </Button>
                )}
                {slot.status === "BOOKED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3 w-full"
                    onClick={() => router.push(`/dashboard/reservasi/${slot.reservationId?._id}`)}
                  >
                    Lihat Detail
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
