/** Tipe bersama (plain object) untuk komponen UI */

export interface SiteContentShape {
  businessName: string;
  tagline: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaSecondaryText: string;
    image: string;
  };
  about: { title: string; text: string; image: string };
  hours: {
    slotDurationMinutes: number;
    slotGapMinutes: number;
    days: Record<string, { open: string; close: string }>;
  };
  contact: { address: string; phone: string; instagram: string; mapsUrl: string };
  gallery: string[];
  footerText: string;
}

export interface ServiceShape {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image: string;
}

export interface ReviewShape {
  id: string;
  rating: number;
  comment: string;
  photoUrl: string;
  createdAt: string;
  author: string;
  avatar: string | null;
}
