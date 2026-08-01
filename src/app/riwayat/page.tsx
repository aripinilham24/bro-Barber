import { ReservationHistory } from "@/components/reservation/ReservationHistory";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { connectDB } from "@/lib/db/connect";
import { SiteContentModel } from "@/lib/db/models";
import type { SiteContentShape } from "@/lib/types";

export const metadata = { title: "Riwayat Reservasi" };

export default async function RiwayatPage() {
  await connectDB();
  const content = (await SiteContentModel.findOne().lean()) as unknown as
    | (SiteContentShape & { _id?: unknown })
    | null;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <ReservationHistory />
      </main>
      <Footer content={content ?? fallbackContent()} />
    </div>
  );
}

function fallbackContent(): SiteContentShape {
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
