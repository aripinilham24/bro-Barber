import type { Metadata } from "next";
import { connectDB } from "@/lib/db/connect";
import { SiteContentModel, ServiceModel, ReviewModel } from "@/lib/db/models";
import type { SiteContentShape, ServiceShape, ReviewShape } from "@/lib/types";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { About } from "@/components/landing/About";
import { HoursContact } from "@/components/landing/HoursContact";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Bro Barber — Cukur & Grooming, Booking Online",
  description:
    "Potong rambut tanpa nunggu antri. Booking slot online, DP 50% via QRIS, sisanya bayar setelah selesai.",
};

export const dynamic = "force-dynamic";

async function getLandingData() {
  await connectDB();

  const [content, services, reviews] = await Promise.all([
    SiteContentModel.findOne().lean(),
    ServiceModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ReviewModel.find({ status: "APPROVED" })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate<{ user: { name: string; image?: string | null } }>("user", "name image")
      .lean(),
  ]);

  const contentShape = content as unknown as SiteContentShape & { _id?: unknown };
  const servicesShape: ServiceShape[] = services.map((s) => ({
    id: String(s._id),
    name: s.name,
    description: s.description,
    price: s.price,
    duration: s.duration,
    image: s.image,
  }));

  const reviewsShape: ReviewShape[] = reviews.map((r) => ({
    id: String(r._id),
    rating: r.rating,
    comment: r.comment,
    photoUrl: r.photoUrl,
    createdAt: r.createdAt.toISOString(),
    author: r.user?.name ?? "Pelanggan Bro Barber",
    avatar: r.user?.image ?? null,
  }));

  return {
    content: contentShape as SiteContentShape,
    services: servicesShape,
    reviews: reviewsShape,
  };
}

export default async function LandingPage() {
  const { content, services, reviews } = await getLandingData();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero content={content} />
        <Services services={services} />
        <About content={content} />
        <HoursContact content={content} />
        <Testimonials reviews={reviews} />
      </main>
      <Footer content={content} />
    </div>
  );
}
