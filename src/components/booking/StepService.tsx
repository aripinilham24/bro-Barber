"use client";

import { Clock, Scissors } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { ServiceOption } from "./types";
import { cn } from "@/lib/utils";

export function StepService({
  services,
  selected,
  onSelect,
}: {
  services: ServiceOption[];
  selected: ServiceOption | null;
  onSelect: (s: ServiceOption) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink-900">
        Pilih layanan
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        Semua sudah termasuk cuci rambut & alat steril.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.map((s) => {
          const active = selected?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className={cn(
                "flex flex-col rounded-2xl border p-5 text-left transition-all",
                active
                  ? "border-ink-900 bg-ink-900 text-cream-50 shadow-md"
                  : "border-line bg-white hover:border-ink-400"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    active ? "bg-cream-50/15 text-cream-50" : "bg-cream-100 text-ink-700"
                  )}
                >
                  <Scissors size={18} />
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    active ? "text-cream-50/70" : "text-ink-400"
                  )}
                >
                  <Clock size={12} />
                  {s.duration} menit
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>
              <p
                className={cn(
                  "mt-1 flex-1 text-sm leading-relaxed",
                  active ? "text-cream-50/70" : "text-ink-600"
                )}
              >
                {s.description}
              </p>
              <div
                className={cn(
                  "mt-4 font-display text-xl font-bold",
                  active ? "text-bronze-200" : "text-ink-900"
                )}
              >
                {formatRupiah(s.price)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
