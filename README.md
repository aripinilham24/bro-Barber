# Bro Barber — Landing Page + Sistem Reservasi Barbershop

Aplikasi web barbershop **Bro Barber**: landing page + reservasi online berbasis slot waktu,
DP 50% via QRIS (mode simulasi), dashboard admin/kasir, dan CMS.

Dibangun dengan **Next.js 16** (App Router, TypeScript, Tailwind CSS v4), **MongoDB** (Mongoose 9),
**Better Auth**, dan lapisan pembayaran yang siap ditukar ke **Xendit**.

---

## Fitur

### Pelanggan (Client)
- Landing page dengan konten CMS (hero, layanan, tentang, jam buka, testimoni)
- Registrasi & login (email/password)
- Booking online: pilih layanan → tanggal & slot → voucher → DP QRIS 50%
- Voucher **CUKURFIRST** (10%) untuk transaksi pertama (sekali pakai per pelanggan)
- Riwayat & status reservasi (Menunggu DP → DP Lunas → Selesai)
- Ulasan + foto setelah layanan selesai

### Admin & Kasir
- **Dashboard jadwal hari ini** + statistik
- Cari & kelola semua reservasi
- **Tandai Lunas** saat pelanggan membayar sisa 50% di tempat (DP_PAID → COMPLETED)
- **Tutup/buka slot** manual (kapster sakit/istirahat)
- **CMS**: edit layanan, konten landing, moderasi ulasan, kelola voucher, kelola role pengguna

### Keamanan & Integritas
- Anti double-booking: transisi slot atomik di database (`AVAILABLE → BOOKED_PENDING`)
- Slot dikunci **15 menit** saat menunggu DP, dikembalikan otomatis bila kedaluwarsa
- Kalkulasi harga (diskon + DP) **server-side**, nilai dari client tidak dipercaya
- Sesi cookie HttpOnly (Better Auth), role-check di setiap API admin

---

## Prasyarat

- Node.js 20.9+ (direkomendasikan 22+)
- Docker (untuk MongoDB lokal)
- CPU tanpa AVX → otomatis memakai `mongo:4.4` (MongoDB 5+ butuh AVX)

## Menjalankan

```bash
# 1. Install dependensi
npm install

# 2. Siapkan environment
cp .env.example .env
# Isi BETTER_AUTH_SECRET (acak panjang) — opsional bila hanya lokal

# 3. Jalankan MongoDB
docker compose up -d
# Pastikan sehat: docker compose ps

# 4. Seed data awal (admin, kasir, layanan, voucher, konten, slot 14 hari)
npm run seed

# 5. Jalankan dev server
npm run dev
# Buka http://localhost:3000
```

## Akun Seed

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@brobarber.id` | `BroBarber123!` |
| Kasir | `kasir@brobarber.id` | `BroBarber123!` |
| Client demo | `client@brobarber.id` | `BroBarber123!` |

> Ubah password admin setelah login pertama.

## Alur Demo Booking

1. Buka `/booking` (akan diarahkan login jika belum).
2. Pilih layanan → tanggal & jam → masukkan voucher `CUKURFIRST` → lihat ringkasan.
3. **Bayar DP via QRIS** → tombol **"Simulasikan Pembayaran Berhasil"** (mode simulasi).
4. Status berubah jadi **DP Lunas** → cek di `/riwayat`.
5. Login sebagai **kasir** → buka `/dashboard` → cari reservasi → **Tandai Lunas**.
6. Login sebagai **client** → halaman reservasi → beri **ulasan**.
7. Login sebagai **admin** → setujui ulasan di `/dashboard/ulasan` → muncul di landing.

## Script

| Command | Fungsi |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Jalankan production build |
| `npm run lint` | ESLint |
| `npm run test` | Unit test logika inti (pricing, slot) |
| `npm run seed` | Seed database |

## Environment Variables

Lihat `.env.example`:

- `MONGODB_URI` — koneksi MongoDB
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` — Better Auth
- `PAYMENT_PROVIDER` — `simulation` (default) atau `xendit`
- `PAYMENT_WEBHOOK_TOKEN` — token webhook simulasi
- `XENDIT_SECRET_KEY` / `XENDIT_WEBHOOK_TOKEN` — untuk beralih ke Xendit
- `UPLOAD_DIR` — folder upload lokal (`public/uploads`)
- `SEED_ADMIN_*` / `SEED_CASHIER_*` — kredensial seed

## Beralih ke Xendit (Pembayaran Asli)

1. Isi `PAYMENT_PROVIDER=xendit`, `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`.
2. Terapkan `src/lib/payment/xendit.ts` (stub sudah menyiapkan struktur):
   - `createPayment()` → Xendit **Payment Request v3** (QRIS), callbackUrl ke `/api/webhooks/payment`.
   - `parseWebhook()` → verifikasi header `x-callback-token`.
3. Logika reservasi & slot **tidak berubah** karena lewat `PaymentProvider`.

## Struktur Utama

```
src/
├── app/                    # Halaman (landing, booking, riwayat, dashboard, api)
├── auth.ts                 # Konfigurasi Better Auth (MongoDB adapter + admin plugin)
├── components/
│   ├── ui/                 # Button, Input, Card, Badge, Modal, Table, dsb.
│   ├── landing/            # Navbar, Hero, Services, About, Hours, Testimonials, Footer
│   ├── booking/            # Wizard booking (5 langkah)
│   └── dashboard/          # Sidebar, PageHeader
└── lib/
    ├── db/                 # Koneksi + model Mongoose
    ├── payment/            # PaymentProvider (simulation / xendit stub)
    ├── services/           # slots, pricing, vouchers (logika inti)
    └── ...
```

## Dokumentasi

- **PRD**: `prd_barbershop_reservation.md`
- **SDD**: `docs/superpowers/specs/2026-08-01-bro-barber-reservation-design.md`
- **Rencana implementasi**: `docs/superpowers/plans/2026-08-01-bro-barber-reservation.md`
