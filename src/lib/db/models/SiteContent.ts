import { Schema, model, models } from "mongoose";

export interface DayHours {
  open: string; // "HH:mm" atau "" bila tutup
  close: string;
}

export interface SiteContentDoc {
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
    days: Record<string, DayHours>; // "1".."7", 1 = Senin
  };
  contact: { address: string; phone: string; instagram: string; mapsUrl: string };
  gallery: string[];
  footerText: string;
  createdAt: Date;
  updatedAt: Date;
}

const dayHoursSchema = new Schema<DayHours>(
  {
    open: { type: String, default: "" },
    close: { type: String, default: "" },
  },
  { _id: false }
);

const daysSchema = new Schema(
  {
    1: { type: dayHoursSchema, default: () => ({ open: "", close: "" }) },
    2: { type: dayHoursSchema, default: () => ({ open: "", close: "" }) },
    3: { type: dayHoursSchema, default: () => ({ open: "", close: "" }) },
    4: { type: dayHoursSchema, default: () => ({ open: "", close: "" }) },
    5: { type: dayHoursSchema, default: () => ({ open: "", close: "" }) },
    6: { type: dayHoursSchema, default: () => ({ open: "", close: "" }) },
    7: { type: dayHoursSchema, default: () => ({ open: "", close: "" }) },
  },
  { _id: false }
);

const siteContentSchema = new Schema<SiteContentDoc>(
  {
    businessName: { type: String, default: "Bro Barber" },
    tagline: { type: String, default: "Datang rapi, pulang lebih pede." },
    hero: {
      eyebrow: { type: String, default: "Bro Barber — Cukur & Grooming" },
      title: { type: String, default: "Datang. Cukur. Pulang Keren." },
      subtitle: {
        type: String,
        default:
          "Pilih jamnya, kami siapkan kursinya. Tanpa nunggu antri, tanpa tebak-tebakan.",
      },
      ctaText: { type: String, default: "Amankan Slotmu" },
      ctaSecondaryText: { type: String, default: "Lihat Layanan" },
      image: { type: String, default: "" },
    },
    about: {
      title: { type: String, default: "Dari satu kursi, untuk setiap potongan" },
      text: {
        type: String,
        default:
          "Bro Barber dimulai dari satu kursi dan satu keyakinan: setiap orang pantas tampil rapi tanpa drama. Tepat waktu, alat steril, harga transparan — itu janji kami di setiap potongan.",
      },
      image: { type: String, default: "" },
    },
    hours: {
      slotDurationMinutes: { type: Number, default: 45 },
      slotGapMinutes: { type: Number, default: 0 },
      days: { type: daysSchema, default: () => ({}) },
    },
    contact: {
      address: { type: String, default: "Jl. Merdeka No. 12, Jakarta" },
      phone: { type: String, default: "0812-3456-7890" },
      instagram: { type: String, default: "@brobarber.id" },
      mapsUrl: { type: String, default: "" },
    },
    gallery: { type: [String], default: [] },
    footerText: {
      type: String,
      default: "Datang rapi, pulang lebih pede.",
    },
  },
  { timestamps: true }
);

export const SiteContentModel =
  (models.SiteContent as ReturnType<typeof model>) ??
  model<SiteContentDoc>("SiteContent", siteContentSchema);

/** Jam buka default: Selasa–Minggu 10.00–21.00, Senin tutup */
export const DEFAULT_BUSINESS_DAYS: Record<string, DayHours> = {
  "1": { open: "", close: "" },
  "2": { open: "10:00", close: "21:00" },
  "3": { open: "10:00", close: "21:00" },
  "4": { open: "10:00", close: "21:00" },
  "5": { open: "10:00", close: "21:00" },
  "6": { open: "09:00", close: "22:00" },
  "7": { open: "09:00", close: "22:00" },
};
