import { Quote } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import type { ReviewShape } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { EmptyState } from "@/components/ui/EmptyState";

export function Testimonials({ reviews }: { reviews: ReviewShape[] }) {
  return (
    <section id="testimoni" className="scroll-mt-20 border-t border-line bg-cream-100/60 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze-600">
            Testimoni
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Kata mereka yang sudah datang.
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Belum ada ulasan"
              description="Jadilah yang pertama berbagi pengalaman setelah dicukur di Bro Barber."
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <Card key={r.id} className="flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <StarRating rating={r.rating} />
                  <Quote size={20} className="text-bronze-200" />
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-700">
                  “{r.comment}”
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold uppercase text-cream-50">
                    {(r.author || "B").slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{r.author}</p>
                    <p className="text-xs text-ink-400">
                      {r.createdAt ? formatDateShort(r.createdAt.slice(0, 10)) : "Pelanggan setia"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
