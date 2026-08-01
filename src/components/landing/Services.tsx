import Link from "next/link";
import { Clock, Scissors } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { ServiceShape } from "@/lib/types";
import { Card } from "@/components/ui/Card";

export function Services({ services }: { services: ServiceShape[] }) {
  return (
    <section id="layanan" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze-600">
            Layanan
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Pilih ritualmu.
          </h2>
          <p className="mt-4 text-ink-600">
            Semua dikerjakan kapster berpengalaman, alat steril, dan harga yang
            jelas dari awal.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="group p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-ink-900 text-cream-50">
                  <Scissors size={19} />
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                  <Clock size={13} />
                  {s.duration} menit
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-ink-900">
                {s.name}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">
                {s.description}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="font-display text-xl font-bold text-ink-900">
                  {formatRupiah(s.price)}
                </span>
                <Link
                  href="/booking"
                  className="text-sm font-medium text-bronze-600 transition-colors hover:text-bronze-700"
                >
                  Booking →
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-sm text-ink-400">
          DP 50% saat booking, sisanya dibayar setelah selesai di tempat.{" "}
          <Link href="/booking" className="font-medium text-bronze-600 hover:underline">
            Amankan slotmu sekarang →
          </Link>
        </p>
      </div>
    </section>
  );
}
