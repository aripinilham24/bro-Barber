# SDD — Sistem Reservasi Barbershop "Bro Barber"

> Software Design Document · Disusun 2026-08-01 · Berdasarkan `prd_barbershop_reservation.md`

## 1. Ringkasan

Aplikasi web **Bro Barber** menyediakan *landing page* barbershop plus sistem reservasi
online berbasis slot waktu. Tujuan utamanya sesuai PRD: menghilangkan waktu tunggu tidak
pasti, meminimalisir *no-show* lewat sistem **Down Payment (DP) 50%**, dan memberi
kemudahan pengelolaan konten (CMS) bagi pemilik barbershop. Aplikasi memiliki dua sisi
pengguna utama: **client** (orang yang akan cukur rambut) dan **admin/kasir**.

## 2. Keputusan Teknologi

| Komponen | Keputusan | Catatan |
| :--- | :--- | :--- |
| Frontend & Backend | **Next.js 16** (App Router, TypeScript, Turbopack) | API disatukan dalam Route Handlers |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) | Palet light minimalis + aksen bronze |
| Database | **MongoDB 7** (Docker Compose) + **Mongoose 9** | Transaksi & operasi atomik untuk anti double-booking |
| Autentikasi | **Better Auth 1.6** + `@better-auth/mongo-adapter` | Pengganti resmi NextAuth.js (sudah masuk maintenance mode). Sesi cookie HttpOnly, admin plugin untuk role |
| Pembayaran | **Mode simulasi** (abstraksi `PaymentProvider`) | Siap ditukar ke **Xendit** (Payment Request v3 + QRIS) tanpa ubah logika bisnis |
| Penyimpanan Gambar | **Lokal** `public/uploads` | Abstraksi siap ditukar ke Cloudinary |
| Validasi | **zod v4** | Body request & input form |
| Ikon | **lucide-react** | |

### Alasan mengganti NextAuth.js → Better Auth
Tim Auth.js/NextAuth secara resmi bergabung ke Better Auth pada 2026 dan
merekomendasikan Better Auth untuk proyek baru. Better Auth menyediakan adapter MongoDB
resmi, sistem role (admin/kasir/client) via admin plugin, sesi cookie `HttpOnly` aman
secara default, dan dukungan TypeScript yang lebih baik.

## 3. Arsitektur Aplikasi

```
src/
├── proxy.ts                  # Session refresh + guard rute ringan (pengganti middleware Next 16)
├── auth.ts                   # Instans Better Auth (adapter MongoDB, email/password, admin plugin)
├── app/
│   ├── layout.tsx            # Root layout + font + metadata "Bro Barber"
│   ├── page.tsx              # Landing page
│   ├── globals.css           # Tailwind v4 @theme: token warna, font
│   ├── (auth)/login|daftar   # Halaman autentikasi
│   ├── booking/              # Wizard reservasi (5 langkah)
│   ├── riwayat/              # Riwayat reservasi client
│   ├── reservasi/[id]/       # Detail reservasi + form ulasan
│   ├── dashboard/            # Admin & Kasir (guard role, sidebar, sub-halaman)
│   └── api/
│       ├── auth/[...all]/    # Route handler Better Auth
│       ├── webhooks/payment/ # Webhook pembayaran (verifikasi token, idempotent)
│       ├── slots/            # Ketersediaan slot (menjalankan sweep expiry)
│       ├── reservations/     # Buat reservasi (atomic slot lock, kalkulasi server-side)
│       ├── vouchers/validate/ # Validasi voucher sekali pakai per user
│       ├── reviews/          # Submit ulasan + foto
│       └── admin/            # services, content, uploads, vouchers, schedule, reviews, users
├── lib/
│   ├── db/
│   │   ├── connect.ts        # Koneksi Mongoose (singleton)
│   │   └── models/           # Service, TimeSlot, Reservation, Voucher, Payment, Review, SiteContent
│   ├── payment/
│   │   ├── types.ts          # Interface PaymentProvider
│   │   ├── index.ts          # getPaymentProvider() berdasar PAYMENT_PROVIDER
│   │   ├── simulation.ts     # Simulasi QRIS + "simulasikan pembayaran"
│   │   └── xendit.ts         # Stub siap diisi saat beralih ke Xendit asli
│   ├── services/
│   │   ├── slots.ts          # ensureSlots, sweepExpiredSlots, lockSlot
│   │   ├── pricing.ts        # kalkulasi subtotal, diskon, total, DP 50%
│   │   └── vouchers.ts       # validasi voucher
│   └── validations/          # Zod schema
└── components/
    ├── ui/                   # Button, Input, Card, Badge, Modal, Table, Skeleton, EmptyState...
    ├── landing/              # Navbar, Hero, Services, About, Gallery, Hours, Testimonials, Footer
    ├── booking/              # StepService, StepSlot, StepCheckout, StepPayment, StepSuccess
    └── dashboard/            # Sidebar, Topbar, StatusBadge, ReservationTable...
```

## 4. Model Data

### User (dikelola Better Auth + admin plugin)
Field inti: `id, name, email, emailVerified, image, createdAt, updatedAt`.
Admin plugin menambah: `role` (`client` | `kasir` | `admin`), `banned`, `banReason`, `banExpires`.
Additional field aplikasi: `phone`.

### Service
`name` · `description` · `price` (number) · `duration` (menit) · `image` · `isActive` · `sortOrder`

### TimeSlot
`date` (YYYY-MM-DD) · `startTime` (HH:mm) · `endTime` (HH:mm) · `status` · `lockedUntil` · `reservationId`
Status slot: `AVAILABLE` → `BOOKED_PENDING` (dikunci 15 menit) → `BOOKED`, atau `CLOSED` (manual admin).

### Reservation
`user` (ref) · `service` (ref) · `timeSlot` (ref) · `date` · `startTime` · `status` · `notes`
Rincian harga: `subtotal` · `discountPercent` · `discountAmount` · `total` · `dpAmount` · `remainingAmount` · `voucherCode`
Status reservasi: `PENDING_PAYMENT` → `DP_PAID` → `COMPLETED`, plus `EXPIRED` / `CANCELLED`.

### Voucher
`code` (unique) · `discountPercent` · `description` · `isActive`
Aturan: berlaku untuk transaksi pertama pelanggan, **sekali pakai per user**
(cek unik user+voucher pada reservasi berstatus `DP_PAID`/`COMPLETED`).

### Payment (log pembayaran)
`reservation` (ref) · `type` (`DP` | `REMAINING` | `CASH`) · `provider` (`simulation` | `xendit`) ·
`externalId` · `amount` · `status` (`PENDING` | `PAID` | `EXPIRED` | `FAILED`) · `qrString` ·
`paidAt` · `raw` · timestamps

### Review
`reservation` (ref, unique) · `user` (ref) · `rating` (1–5) · `comment` · `photoUrl` ·
`status` (`PENDING` | `APPROVED`)

### SiteContent (singleton CMS)
`businessName` ("Bro Barber") · `tagline` · `hero` (title, subtitle, ctaText, image) ·
`about` (title, text, image) · `hours` (per hari, buka/tutup, buka/tutup slot) ·
`contact` (address, phone, instagram, mapsUrl) · `gallery` (array image) · `footerText`

## 5. API Design

| Method & Path | Akses | Fungsi |
| :--- | :--- | :--- |
| `POST/GET /api/auth/*` | publik | Handler Better Auth (sign-in, sign-up, session, admin plugin) |
| `POST /api/webhooks/payment` | webhook | Terima event pembayaran, verifikasi token, proses idempotent |
| `GET /api/services` | publik | Daftar layanan aktif |
| `GET /api/slots?date=` | publik | Slot tersedia per tanggal (jalankan sweep) |
| `GET /api/slots/availability?days=14` | publik | Ringkasan tanggal + jumlah slot untuk kalender |
| `GET /api/content` | publik | Konten landing dari CMS |
| `GET /api/reviews` | publik | Ulasan berstatus APPROVED |
| `POST /api/vouchers/validate` | client | Validasi voucher (user belum pernah pakai) |
| `POST /api/reservations` | client | Buat reservasi: lock slot atomik, kalkulasi harga, buat payment + QR |
| `GET /api/reservations/mine` | client | Riwayat reservasi user |
| `GET /api/reservations/[id]` | owner/admin/kasir | Detail reservasi |
| `POST /api/reviews` | client | Submit ulasan (hanya untuk reservasi COMPLETED miliknya) |
| `GET /api/admin/schedule?date=` | admin, kasir | Jadwal reservasi per tanggal |
| `PATCH /api/admin/reservations/[id]/status` | admin, kasir | DP_PAID → COMPLETED (tandai lunas) |
| `GET/POST/PATCH/DELETE /api/admin/services` | admin | CRUD layanan |
| `GET/PUT /api/admin/content` | admin | Baca/ubah konten CMS |
| `POST /api/admin/uploads` | admin, kasir | Upload gambar (lokal) |
| `GET/PATCH /api/admin/slots` | admin, kasir | Lihat semua status + tutup/buka slot |
| `GET/PATCH /api/admin/reviews` | admin | Moderasi ulasan (approve/reject) |
| `GET/POST/PATCH/DELETE /api/admin/vouchers` | admin | Kelola voucher |
| `GET/PATCH /api/admin/users` | admin | Kelola user & role |

## 6. Alur Kunci

### 6.1 Reservasi & DP
1. Landing → "Amankan Slotmu" → login/daftar (jika belum).
2. Wizard: pilih layanan → pilih tanggal & slot (hanya `AVAILABLE`) → checkout.
3. Checkout: input voucher (opsional) → validasi server-side → diskon 10%.
4. `POST /api/reservations`:
   - Lock slot atomik: `findOneAndUpdate({_id, status:'AVAILABLE'}, {status:'BOOKED_PENDING', lockedUntil: now+15m})`. Gagal → 409 (slot terambil).
   - Kalkulasi harga server-side: `subtotal`, `discountAmount`, `total`, `dpAmount = ceil(total × 0.5)`, `remainingAmount = total - dp`.
   - Simpan `Reservation (PENDING_PAYMENT)` + `Payment (DP, PENDING)`.
   - Provider (simulation) menghasilkan `qrString`; simpan `externalId`.
5. UI menampilkan QR + countdown 15 menit (polling status via `GET /api/reservations/[id]`).
6. Webhook masuk → verifikasi token → idempotent:
   - Sukses: `Payment.PAID`, `Reservation.DP_PAID`, `TimeSlot.BOOKED`.
   - Expired: `Payment.EXPIRED`, `Reservation.EXPIRED`, slot kembali `AVAILABLE`.

### 6.2 Sweep expiry (15 menit)
`sweepExpiredSlots()` mengembalikan slot `BOOKED_PENDING` yang lewat `lockedUntil` ke
`AVAILABLE` dan menandai reservasi/payment terkait `EXPIRED`. Dipanggil saat
`GET /api/slots*`, sebelum checkout, dan setelah webhook — tanpa cron eksternal.

### 6.3 Pelunasan di tempat
1. Pelanggan selesai dicukur → kasir buka Dashboard → cari nama/ID.
2. Sistem tampilkan sisa 50% (`remainingAmount`).
3. Kasir klik **"Tandai Lunas"** → `PATCH .../status` → buat log `Payment(CASH, PAID)` → `Reservation.COMPLETED`.

### 6.4 Ulasan
Reservasi `COMPLETED` milik user → form ulasan (rating, komentar, upload foto) →
tersimpan `PENDING` → admin approve → tampil di landing.

## 7. Keamanan & Integritas (sesuai PRD)

- **Anti double-booking**: transisi status slot via operasi atomik Mongoose (filter `status: 'AVAILABLE'` dalam satu query). Tidak hanya andalkan frontend.
- **Kalkulasi server-side**: diskon & DP dihitung di Route Handler, nilai dari client tidak dipercaya (harga diambil dari DB).
- **Sesi**: Better Auth, cookie `HttpOnly` + `Secure`, `BETTER_AUTH_SECRET` dari `.env`.
- **Webhook**: verifikasi token (simulasi: token statis/tersimpan; Xendit: header `x-callback-token`), pemrosesan idempotent terhadap webhook duplikat (cek `Payment.externalId` + status).
- **Otorisasi role**: setiap API admin memeriksa `session.user.role`. Kasir tidak bisa mengubah layanan/konten.
- **Upload**: hanya image, batas ukuran, ekstensi aman, nama file acak.

## 8. Desain UI/UX — Light Minimalis "Bro Barber"

### 8.1 Palet (Tailwind v4 `@theme`)
| Token | Nilai | Fungsi |
| :--- | :--- | :--- |
| `--color-cream-50` | `#FAFAF7` | Background utama |
| `--color-cream-100` | `#F4F2EC` | Background section/surface lembut |
| `--color-ink-900` | `#17150F` | Teks utama / tombol primer |
| `--color-ink-600` | `#55524B` | Teks sekunder |
| `--color-ink-400` | `#8A877E` | Placeholder / muted |
| `--color-line` | `#E6E2D9` | Border / divider |
| `--color-bronze-500` | `#B08D57` | Aksen (dipakai hemat) |
| `--color-bronze-600` | `#96753F` | Hover aksen |
| `--color-bronze-100` | `#F1E9DC` | Tint background aksen |
| `--color-ok-*`, `--color-warn-*`, `--color-danger-*` | muted | Status reservasi/payment |

Prinsip: tidak warna-warni; dominan netral, aksen bronze hanya untuk CTA detail,
garis tipis, ikon, dan label kecil.

### 8.2 Tipografi
- Heading: **Playfair Display** (serif, via `next/font/google`)
- Body: **Inter** (via `next/font/google`)

### 8.3 Komponen & State
Button (primer hitam, sekunder outline, ghost), Input, Select, Textarea, Card, Badge
status, Modal, Table, Tabs, Skeleton, EmptyState, ErrorState. Semua halaman memiliki
loading (`loading.tsx`), empty, dan error state. Mobile-first.

## 9. Copywriting (nada & contoh)

Nada: hangat, percaya diri, santai tapi premium; Bahasa Indonesia ringkas; pelanggan
sebagai pahlawan. Contoh:

| Bagian | Teks |
| :--- | :--- |
| Hero eyebrow | `Bro Barber — Cukur & Grooming` |
| Hero headline | `Datang. Cukur. Pulang Keren.` |
| Hero sub | `Pilih jamnya, kami siapkan kursinya. Tanpa nunggu antri, tanpa tebak-tebakan.` |
| CTA | `Amankan Slotmu` |
| Layanan intro | `Pilih ritualmu. Semua dikerjakan kapster berpengalaman, alat steril, dan harga yang jelas dari awal.` |
| Tentang | `Bro Barber dimulai dari satu kursi dan satu keyakinan: setiap orang pantas tampil rapi tanpa drama.` |
| Booking intro | `Amankan slotmu dalam 2 menit. Cukup DP 50% via QRIS, sisanya bayar saat selesai di tempat.` |
| Sukses booking | `Slotmu aman, Bro! Datang 10 menit sebelum jam booking.` |
| Empty slot | `Slot hari ini sudah penuh — coba tanggal lain.` |
| Footer | `Datang rapi, pulang lebih pede.` |

Semua teks tersimpan di `SiteContent` (CMS) sehingga admin dapat mengubah tanpa kode.

## 10. Non-Fungsional

- **Performa**: Server Components untuk data statis; Route Handlers ringan; hindari paket
  berat di server (sesuai catatan optimasi PRD).
- **Deployment**: `next build` + `next start` (Node runtime); MongoDB lokal via Docker;
  siap dideploy ke Vercel dengan MongoDB Atlas + Xendit + Cloudinary nanti.

## 11. Integrasi Xendit di Masa Depan

`lib/payment/xendit.ts` sudah menyediakan kerangka: `createPayment()` memanggil Xendit
**Payment Request v3** (payment method `QRIS`, amount DP, expiry 15 menit, callbackUrl ke
`/api/webhooks/payment`), dan `verifyWebhookSignature()` memverifikasi header
`x-callback-token`. Cukup set `PAYMENT_PROVIDER=xendit` + isi env `XENDIT_SECRET_KEY` &
`XENDIT_WEBHOOK_TOKEN`; logika reservasi tidak berubah.

## 12. Akun Seed

- `admin@brobarber.id` / `BroBarber123!` → role `admin` (CMS, pengguna, layanan)
- `kasir@brobarber.id` / `BroBarber123!` → role `kasir` (jadwal, lunas, tutup slot)
- Voucher: `CUKURFIRST` (10%)
- Layanan, konten landing, ulasan contoh sesuai copywriting §9
