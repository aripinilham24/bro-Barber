import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bro Barber — Cukur & Grooming, Booking Online",
    template: "%s · Bro Barber",
  },
  description:
    "Potong rambut tanpa nunggu antri. Booking slot online, DP 50% via QRIS, sisanya bayar setelah selesai.",
  keywords: ["barbershop", "cukur rambut", "booking", "Bro Barber", "grooming"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
