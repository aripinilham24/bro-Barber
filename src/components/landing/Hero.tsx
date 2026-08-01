import Link from "next/link";
import Image from "next/image";
import { Scissors } from "lucide-react";
import type { SiteContentShape } from "@/lib/types";

export function Hero({ content }: { content: SiteContentShape }) {
  const { hero, businessName, tagline } = content;
  const hasImage = Boolean(hero.image);

  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-bronze-200 bg-bronze-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-bronze-700">
            <Scissors size={13} />
            {hero.eyebrow || businessName}
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
            {hero.title || "Datang. Cukur. Pulang Keren."}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/booking"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink-900 px-7 text-base font-medium text-cream-50 transition-colors hover:bg-ink-700"
            >
              {hero.ctaText || "Amankan Slotmu"}
            </Link>
            <a
              href="#layanan"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-dark bg-white px-7 text-base font-medium text-ink-900 transition-colors hover:border-ink-400 hover:bg-cream-100"
            >
              {hero.ctaSecondaryText || "Lihat Layanan"}
            </a>
          </div>
          <p className="mt-6 text-sm italic text-ink-400">— {tagline}</p>
        </div>

        <div className="relative">
          {hasImage ? (
            <div className="overflow-hidden rounded-3xl border border-line shadow-[0_20px_60px_-20px_rgba(23,21,15,0.25)]">
              <Image
                src={hero.image}
                alt="Suasana Bro Barber"
                width={800}
                height={640}
                className="h-[420px] w-full object-cover"
              />
            </div>
          ) : (
            <div className="relative flex h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-line bg-ink-900">
              <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_center,#fff_1.5px,transparent_1.5px)] [background-size:22px_22px]" />
              <div className="relative px-8 text-center">
                <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-bronze-500/20 text-bronze-200">
                  <Scissors size={30} strokeWidth={1.6} />
                </span>
                <p className="font-display text-2xl font-semibold text-cream-50 sm:text-3xl">
                  “Rapi itu bukan kemewahan,
                  <br />
                  tapi kebiasaan.”
                </p>
                <p className="mt-4 text-sm uppercase tracking-[0.2em] text-bronze-200">
                  {businessName}
                </p>
              </div>
              <div className="absolute bottom-6 left-6 rounded-full border border-cream-50/15 px-4 py-1.5 text-xs text-cream-50/70">
                Est. sejak 2019
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
