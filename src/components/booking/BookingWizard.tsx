"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { StepService } from "./StepService";
import { StepSlot } from "./StepSlot";
import { StepCheckout } from "./StepCheckout";
import { StepPayment } from "./StepPayment";
import { StepSuccess } from "./StepSuccess";
import type {
  AvailabilityDay,
  OrderData,
  ServiceOption,
  SlotOption,
} from "./types";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Layanan", "Tanggal & Jam", "Ringkasan", "Bayar DP", "Selesai"];

export function BookingWizard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slotsForDate, setSlotsForDate] = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);

  // Wajib login
  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login?callback=/booking");
    }
  }, [isPending, session, router]);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isClient = role !== "admin" && role !== "kasir";

  // Ambil layanan + ketersediaan
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [svcRes, availRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/slots"),
        ]);
        const svc = await svcRes.json();
        const avail = await availRes.json();
        if (!alive) return;
        // Normalisasi _id → id (API mengembalikan dokumen Mongoose mentah)
        setServices(
          (Array.isArray(svc) ? svc : []).map(
            (s: {
              _id: string;
              name: string;
              description: string;
              price: number;
              duration: number;
            }) => ({
              id: String(s._id),
              name: s.name,
              description: s.description,
              price: s.price,
              duration: s.duration,
            })
          )
        );
        setAvailability(Array.isArray(avail) ? avail : []);
      } catch {
        if (alive) setError("Gagal memuat data. Coba muat ulang halaman.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Ambil slot per tanggal
  const pickDate = useCallback(async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      const data = await res.json();
      setSlotsForDate(
        (Array.isArray(data) ? data : []).map((s: { _id: string; date: string; startTime: string; endTime: string }) => ({
          id: String(s._id),
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      );
    } catch {
      setSlotsForDate([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const confirmBooking = useCallback(
    async (voucherCode: string, notes: string) => {
      if (!selectedService || !selectedSlot) return;
      setCreating(true);
      setError("");
      try {
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: selectedService.id,
            slotId: selectedSlot.id,
            voucherCode: voucherCode || undefined,
            notes,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Gagal membuat reservasi.");
          // slot konflik → muat ulang ketersediaan
          if (res.status === 409) {
            const availRes = await fetch("/api/slots");
            setAvailability(await availRes.json());
          }
          return;
        }
        setOrder(data.reservation);
        setStep(4);
      } catch {
        setError("Terjadi kesalahan. Coba lagi.");
      } finally {
        setCreating(false);
      }
    },
    [selectedService, selectedSlot]
  );

  const restart = useCallback(() => {
    setStep(1);
    setOrder(null);
    setSelectedSlot(null);
    setSelectedDate(null);
    setSelectedService(null);
  }, []);

  const steps = useMemo(() => [1, 2, 3, 4, 5], []);

  if (isPending) return <PageLoader label="Memeriksa sesi..." />;
  if (!session) return null;
  if (!isClient) {
    router.replace("/dashboard");
    return null;
  }

  if (loading) return <PageLoader label="Menyiapkan layanan..." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-1.5 sm:gap-2" aria-label="Langkah booking">
        {steps.map((s) => (
          <li key={s} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                s < step
                  ? "bg-ink-900 text-cream-50"
                  : s === step
                    ? "bg-bronze-500 text-white"
                    : "bg-cream-200 text-ink-400"
              )}
            >
              {s < step ? "✓" : s}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                s === step ? "text-ink-900" : "text-ink-400"
              )}
            >
              {STEP_LABELS[s - 1]}
            </span>
            {s < 5 && (
              <span
                className={cn(
                  "h-px flex-1",
                  s < step ? "bg-ink-900" : "bg-cream-200"
                )}
              />
            )}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-6 rounded-xl border border-danger-100 bg-danger-100 px-4 py-3 text-sm text-danger-800">
          {error}
        </div>
      )}

      {step === 1 && (
        <>
          <StepService
            services={services}
            selected={selectedService}
            onSelect={(s) => {
              setSelectedService(s);
              setStep(2);
            }}
          />
        </>
      )}

      {step === 2 && (
        <>
          <StepSlot
            availability={availability}
            loading={false}
            selectedDate={selectedDate}
            slotsForDate={slotsForDate}
            slotsLoading={slotsLoading}
            selectedSlot={selectedSlot}
            onPickDate={pickDate}
            onPickSlot={(s) => {
              setSelectedSlot(s);
              setStep(3);
            }}
          />
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Kembali
            </Button>
            <Button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Lanjut <ArrowRight size={16} />
            </Button>
          </div>
        </>
      )}

      {step === 3 && selectedService && selectedSlot && (
        <>
          <StepCheckout
            service={selectedService}
            slot={selectedSlot}
            creating={creating}
            onConfirm={confirmBooking}
          />
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Ubah Jadwal
            </Button>
            <Button variant="ghost" onClick={() => setStep(1)}>
              Ubah Layanan
            </Button>
          </div>
        </>
      )}

      {step === 4 && order && (
        <StepPayment
          order={order}
          onPaid={() => setStep(5)}
          onRestart={restart}
        />
      )}

      {step === 5 && order && <StepSuccess order={order} />}
    </div>
  );
}
