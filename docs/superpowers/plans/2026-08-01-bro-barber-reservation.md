# Bro Barber — Reservasi & Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun landing page + sistem reservasi barbershop "Bro Barber" (role client/admin/kasir) dengan DP 50% (simulasi QRIS), CMS, dan dashboard.

**Architecture:** Next.js 16 App Router + MongoDB (Mongoose 9, Docker) + Better Auth (admin plugin roles) + lapisan PaymentProvider abstrak (simulasi → siap tukar Xendit). Semua kalkulasi server-side; anti double-booking via operasi atomik.

**Tech Stack:** next@16 · react@19 · typescript · tailwindcss@4 · mongoose@9 · better-auth@1.6 + @better-auth/mongo-adapter · zod@4 · qrcode · lucide-react · docker compose (mongo:7)

## Global Constraints

- Bahasa UI & kode komentar: **Indonesia**; brand: **Bro Barber**.
- Tema light minimalis: palet `@theme` di `globals.css` (krem/ink/bronze), jangan warna-warni.
- Font: Playfair Display (heading) + Inter (body) via `next/font`.
- Semua kalkulasi harga/DP/dikon dilakukan **server-side** di Route Handler.
- Transisi slot memakai **atomic `findOneAndUpdate` dengan filter status** — jangan pernah read-then-write.
- Role: `client` (default), `kasir`, `admin`. API admin selalu cek `session.user.role`.
- Payment default `PAYMENT_PROVIDER=simulation`; Xendit hanya stub.
- Next 16: middleware = `proxy.ts`; `params`/`searchParams` adalah Promise (wajib `await`).

---

### Task 1: Setup infrastruktur & environment
- [ ] `docker-compose.yml` (mongo:7, volume, healthcheck), `.env` + `.env.example` (MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL, PAYMENT_PROVIDER, PAYMENT_WEBHOOK_TOKEN, XENDIT_*, UPLOAD_DIR, SEED_*).
- [ ] `docker compose up -d` → MongoDB di `localhost:27017`.
- [ ] `package.json`: name `bro-barber`, scripts `dev/build/start/lint/seed`.
- [ ] Verify: `curl http://localhost:27017` respon (error "It looks like you are trying to access MongoDB over HTTP..." = OK).

### Task 2: Design system (Tailwind v4)
- [ ] `src/app/globals.css`: `@import "tailwindcss"` + `@theme` token palet (§8.1 SDD) + `@theme inline` font.
- [ ] `src/app/layout.tsx`: font Playfair Display + Inter (`next/font/google`), metadata "Bro Barber", html lang="id".
- [ ] `src/components/ui/*`: Button, Input, Textarea, Select, Card, Badge, Modal, Table, Spinner, Skeleton, EmptyState, ErrorState, Logo (scissors icon), formatRupiah util.
- [ ] Verify: `npm run build` hijau.

### Task 3: Data layer (Mongoose)
- [ ] `src/lib/db/connect.ts`: singleton `mongoose.connect(MONGODB_URI)`.
- [ ] Models di `src/lib/db/models/`: `Service`, `TimeSlot`, `Reservation`, `Voucher`, `Payment`, `Review`, `SiteContent` (sesuai §4 SDD; enum status; indeks unique pada `Reservation.user+voucherCode` untuk reservasi terbayar, `Review.reservation`, `Voucher.code`).
- [ ] `src/lib/services/pricing.ts`: `computePrice(servicePrice, discountPercent)` → `{ subtotal, discountAmount, total, dpAmount, remainingAmount }` (dp = 50% total, dibulatkan).
- [ ] Verify: unit test pricing.

### Task 4: Autentikasi (Better Auth)
- [ ] `src/auth.ts`: `betterAuth({ database: mongodbAdapter(db, { client }), emailAndPassword: { enabled: true }, user: { additionalFields: { phone } }, plugins: [admin({ defaultRole: 'client', adminRoles: ['admin'] })] })`.
- [ ] `src/app/api/auth/[...all]/route.ts` → `toNextJsHandler(auth)`.
- [ ] `src/lib/auth-client.ts` (better-auth/react).
- [ ] `src/proxy.ts`: `export { auth as proxy }` + matcher.
- [ ] Halaman `(auth)/login` & `(auth)/daftar` (form name/phone/email/password; toggle role hanya untuk register client).
- [ ] `scripts/seed.ts`: buat admin & kasir via `auth.api` (atau insert user + hash), services, voucher CUKURFIRST, SiteContent (copy §9), review contoh.
- [ ] Verify: login/register berfungsi; session role terbaca.

### Task 5: Logika slot & booking inti
- [ ] `src/lib/services/slots.ts`: `ensureSlotsForDate(date)` (generate dari jam buka SiteContent + durasi service), `sweepExpiredSlots()`, `lockSlot(id)` (atomic).
- [ ] API `GET /api/slots?date=` (sweep dulu, filter AVAILABLE), `GET /api/slots/availability?days=14`.
- [ ] API `POST /api/vouchers/validate` (cek voucher aktif + user belum pernah memakai kode pada reservasi terbayar).
- [ ] API `POST /api/reservations`: zod validate → lock slot atomic (gagal → 409) → `computePrice` → create Reservation + Payment(DP) → provider.createPayment → return.
- [ ] API `GET /api/reservations/mine`, `GET /api/reservations/[id]` (owner/admin/kasir).
- [ ] Unit test: lock slot race (dua request, satu menang), computePrice, voucher sekali pakai.

### Task 6: Payment simulation + webhook
- [ ] `src/lib/payment/types.ts`: `PaymentProvider { createPayment; verifyWebhook; mapEvent }`.
- [ ] `src/lib/payment/simulation.ts`: buat `externalId` + `qrString` (mis. `SIM-BB-<reservationId>`), `PAYMENT_WEBHOOK_TOKEN`.
- [ ] `src/lib/payment/xendit.ts`: stub dengan struktur panggilan Payment Request v3 (belum aktif).
- [ ] `src/lib/payment/index.ts`: pilih provider dari `PAYMENT_PROVIDER`.
- [ ] `POST /api/webhooks/payment`: verifikasi token → idempotent (cek externalId+status) → DP_PAID/BOOKED atau EXPIRED/free slot → 200 cepat.
- [ ] Verify: alur booking + simulasi bayar menghasilkan `DP_PAID`.

### Task 7: Landing page
- [ ] `src/app/page.tsx` (Server Component) + `src/components/landing/*`: Navbar, Hero (eyebrow/headline/sub/CTA per §9), Services (dari DB), About, Gallery, Hours & Contact, Testimonials (reviews APPROVED), Footer. Konten dari `SiteContent`.
- [ ] `loading.tsx`, `error.tsx` (root) + fallback.
- [ ] Responsif (mobile → desktop), transisi halus.

### Task 8: Alur booking client (UI)
- [ ] `src/app/booking/page.tsx` + `components/booking/*`: wizard 5 langkah — layanan → tanggal/slot → checkout (voucher + ringkasan + DP) → QRIS (QR via `qrcode`, countdown 15m, tombol "Simulasikan Pembayaran" saat dev/simulation, polling status) → sukses.
- [ ] `src/app/riwayat/page.tsx`: daftar reservasi user + status.
- [ ] `src/app/reservasi/[id]/page.tsx`: detail + tombol ulasan bila COMPLETED.
- [ ] `POST /api/reviews` + upload foto (`POST /api/admin/uploads` reusable untuk ulasan).
- [ ] Verify E2E: daftar → login → booking → simulasikan bayar → status DP_PAID → riwayat → (kasir tandai lunas) → ulasan.

### Task 9: Dashboard admin/kasir
- [ ] `src/app/dashboard/layout.tsx`: guard session + role (client → redirect), Sidebar (Jadwal, Reservasi, Slot, Layanan, Konten, Ulasan, Voucher, Pengguna), Topbar, link akun.
- [ ] `dashboard/page.tsx`: jadwal hari ini + statistik ringkas.
- [ ] `dashboard/reservasi/`: tabel + cari (nama/ID) + filter status + `PATCH /api/admin/reservations/[id]/status` ("Tandai Lunas" tampilkan sisa 50%).
- [ ] `dashboard/slot/`: kalender/tanggal, lihat semua slot, tutup/buka (`PATCH /api/admin/slots`).
- [ ] Verify: kasir dapat menandai lunas; tidak bisa akses CMS.

### Task 10: CMS admin
- [ ] `dashboard/layanan/`: CRUD service (+ upload gambar).
- [ ] `dashboard/konten/`: edit SiteContent (hero, tentang, jam, kontak, galeri + upload).
- [ ] `dashboard/ulasan/`: approve/reject review.
- [ ] `dashboard/voucher/`: CRUD voucher.
- [ ] `dashboard/pengguna/`: list user + ubah role (`/api/admin/users` pakai admin plugin / update langsung).
- [ ] API admin routes + cek role `admin` pada service/content/voucher/users; role `admin|kasir` pada schedule/reservation/slots/reviews.

### Task 11: Verifikasi & dokumentasi
- [ ] `npm run lint` bersih, `npm run build` sukses.
- [ ] Unit tests pass (pricing, voucher, slot race, sweep).
- [ ] Uji manual alur penuh client & kasir (dengan docker up).
- [ ] README.md: prasyarat, `docker compose up -d`, `.env`, `npm run seed`, `npm run dev`, akun seed, cara simulasi bayar, cara beralih ke Xendit.
