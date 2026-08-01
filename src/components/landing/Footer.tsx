import Link from "next/link";
import { MapPin, Phone, Instagram } from "lucide-react";
import type { SiteContentShape } from "@/lib/types";
import { Logo } from "@/components/ui/Logo";

export function Footer({ content }: { content: SiteContentShape }) {
  const { contact, footerText } = content;
  return (
    <footer className="border-t border-line bg-ink-900 text-cream-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-50/70">
              {footerText}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-bronze-200">
              Navigasi
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cream-50/70">
              <li><a href="#layanan" className="hover:text-cream-50">Layanan</a></li>
              <li><a href="#tentang" className="hover:text-cream-50">Tentang</a></li>
              <li><a href="#jam-buka" className="hover:text-cream-50">Jam Buka</a></li>
              <li><a href="#testimoni" className="hover:text-cream-50">Testimoni</a></li>
              <li>
                <Link href="/booking" className="font-medium text-bronze-200 hover:text-bronze-100">
                  Booking Sekarang
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-bronze-200">
              Kontak
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cream-50/70">
              <li className="flex items-center gap-2">
                <MapPin size={15} className="shrink-0 text-bronze-200" />
                {contact.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-bronze-200" />
                {contact.phone}
              </li>
              <li className="flex items-center gap-2">
                <Instagram size={15} className="shrink-0 text-bronze-200" />
                {contact.instagram}
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-cream-50/10 pt-6 text-xs text-cream-50/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {content.businessName}. Semua hak dilindungi.</p>
          <p>Dibuat dengan ✂️ dan secangkir kopi.</p>
        </div>
      </div>
    </footer>
  );
}
