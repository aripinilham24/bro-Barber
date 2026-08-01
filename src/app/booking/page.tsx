import { BookingWizard } from "@/components/booking/BookingWizard";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { connectDB } from "@/lib/db/connect";
import { SiteContentModel } from "@/lib/db/models";
import type { SiteContentShape } from "@/lib/types";

export const metadata = { title: "Booking" };

export default async function BookingPage() {
  await connectDB();
  const content = (await SiteContentModel.findOne().lean()) as unknown as
    | (SiteContentShape & { _id?: unknown })
    | null;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-line bg-cream-100/60">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze-600">
              Booking Online
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Amankan slotmu dalam 2 menit.
            </h1>
            <p className="mt-3 text-ink-600">
              Cukup DP 50% via QRIS, sisanya bayar saat selesai di tempat.
            </p>
          </div>
        </div>
        <BookingWizard />
      </main>
      <Footer content={content ?? defaultContent()} />
    </div>
  );
}

function defaultContent(): SiteContentShape {
  return {
    businessName: "Bro Barber",
    tagline: "Datang rapi, pulang lebih pede.",
    hero: { eyebrow: "", title: "", subtitle: "", ctaText: "", ctaSecondaryText: "", image: "" },
    about: { title: "", text: "", image: "" },
    hours: { slotDurationMinutes: 45, slotGapMinutes: 0, days: {} },
    contact: { address: "", phone: "", instagram: "", mapsUrl: "" },
    gallery: [],
    footerText: "Datang rapi, pulang lebih pede.",
  };
}
