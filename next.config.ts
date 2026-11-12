import type { NextConfig } from "next";

/**
 * Host object storage yang boleh dipakai <Image src="https://...">.
 * Tanpa ini next/image menolak host tak dikenal ("Invalid src prop").
 * RustFS/MinIO lokal berjalan di http://localhost:9000.
 */
const storageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "res.cloudinary.com",
    pathname: "/**",
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "9000",
    pathname: "/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    port: "9000",
    pathname: "/**",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: storageRemotePatterns,

    // Next.js 16 memblokir optimasi gambar dari IP privat (proteksi SSRF),
    // sehingga optimizer menolak http://localhost:9000 → HTTP 400
    // "url parameter is not allowed". Object storage lokal hanya ada di
    // development, jadi ini sengaja hanya diaktifkan saat NODE_ENV=development.
    // Produksi tetap memakai proteksi SSRF (nilai default false).
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;