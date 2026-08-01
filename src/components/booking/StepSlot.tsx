"use client";

import { formatDate, formatTime, todayISO } from "@/lib/utils";
import type { AvailabilityDay, SlotOption } from "./types";
import { cn } from "@/lib/utils";

export function StepSlot({
  availability,
  loading,
  selectedDate,
  slotsForDate,
  slotsLoading,
  selectedSlot,
  onPickDate,
  onPickSlot,
}: {
  availability: AvailabilityDay[];
  loading: boolean;
  selectedDate: string | null;
  slotsForDate: SlotOption[];
  slotsLoading: boolean;
  selectedSlot: SlotOption | null;
  onPickDate: (d: string) => void;
  onPickSlot: (s: SlotOption) => void;
}) {
  const today = todayISO();

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink-900">Pilih tanggal & jam</h2>
      <p className="mt-1 text-sm text-ink-600">
        Slot hijau masih kosong — segera amankan sebelum diambil orang lain.
      </p>

      {/* Pilih tanggal */}
      <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-cream-200" />
            ))
          : availability.map((day) => {
              const active = selectedDate === day.date;
              const dateObj = new Date(`${day.date}T00:00:00`);
              const isToday = day.date === today;
              const disabled = day.available === 0;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPickDate(day.date)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border py-2.5 transition-all",
                    active
                      ? "border-ink-900 bg-ink-900 text-cream-50"
                      : disabled
                        ? "cursor-not-allowed border-line bg-cream-100 text-ink-400 opacity-60"
                        : "border-line bg-white hover:border-ink-400"
                  )}
                >
                  <span className="text-[11px] uppercase tracking-wide opacity-70">
                    {isToday
                      ? "Hari ini"
                      : new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(dateObj)}
                  </span>
                  <span className="text-lg font-bold leading-tight">
                    {dateObj.getDate()}
                  </span>
                  <span className="text-[11px] opacity-70">
                    {day.available} slot
                  </span>
                </button>
              );
            })}
      </div>

      {/* Pilih jam */}
      {selectedDate && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ink-700">
            {formatDate(selectedDate)}
          </h3>
          {slotsLoading ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-cream-200" />
              ))}
            </div>
          ) : slotsForDate.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line-dark px-4 py-5 text-sm text-ink-600">
              Slot hari ini sudah penuh — coba tanggal lain, masih banyak yang kosong.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {slotsForDate.map((slot) => {
                const active = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onPickSlot(slot)}
                    className={cn(
                      "rounded-lg border py-2.5 text-sm font-medium transition-all",
                      active
                        ? "border-ink-900 bg-ink-900 text-cream-50"
                        : "border-line bg-white hover:border-ink-400"
                    )}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
