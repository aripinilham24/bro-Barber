import Image from "next/image";
import { Check } from "lucide-react";
import type { SiteContentShape } from "@/lib/types";

const PROMISES = [
  "Tepat waktu — slotmu pasti dihormati",
  "Alat steril & area bersih",
  "Harga transparan, tanpa biaya tersembunyi",
  "Kapster berpengalaman & ramah",
];

export function About({ content }: { content: SiteContentShape }) {
  const { about, businessName } = content;
  const hasImage = Boolean(about.image);

  return (
    <section id="tentang" className="scroll-mt-20 border-y border-line bg-cream-100/60 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2">
        <div className="order-2 md:order-1">
          {hasImage ? (
            <div className="overflow-hidden rounded-3xl border border-line">
              <Image
                src={about.image}
                alt="Interior Bro Barber"
                width={800}
                height={600}
                className="h-[380px] w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-[380px] items-center justify-center rounded-3xl border border-line bg-ink-900">
              <p className="px-10 text-center font-display text-2xl font-semibold text-cream-50">
                Satu kursi.
                <br />
                Ribuan cerita rambut.
              </p>
            </div>
          )}
        </div>
        <div className="order-1 md:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze-600">
            Tentang Kami
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            {about.title}
          </h2>
          <p className="mt-5 leading-relaxed text-ink-600">{about.text}</p>
          <ul className="mt-7 space-y-3">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-bronze-100 text-bronze-600">
                  <Check size={12} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-7 font-display text-lg italic text-bronze-700">
            — {businessName}
          </p>
        </div>
      </div>
    </section>
  );
}
