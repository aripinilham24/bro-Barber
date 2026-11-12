# Bro Barber — Landing Page + Sistem Reservasi Barbershop

Aplikasi web barbershop **Bro Barber**: landing page + reservasi online berbasis slot waktu,
DP 50% via QRIS (mode simulasi), dashboard admin/kasir, dan CMS.

Dibangun dengan **Next.js 16** (App Router, TypeScript, Tailwind CSS v4), **MongoDB** (Mongoose 9),
**Better Auth**, dan pembayaran **simulasi** (kode integrasi Xendit tetap tersedia untuk pengembangan lanjutan).

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
- Docker + Docker Compose (untuk MongoDB & object storage lokal)

## Menjalankan

```bash
# 1. Install dependensi
npm install

# 2. Siapkan environment
cp .env.example .env
# Isi BETTER_AUTH_SECRET: openssl rand -base64 32

# 3. Jalankan MongoDB + object storage
docker compose up -d
docker compose ps          # tunggu keduanya (healthy)

# 4. Inisialisasi replica set MongoDB (WAJIB, sekali saja per volume)
docker compose exec mongodb mongosh --quiet --eval \
  'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
# Pastikan PRIMARY: docker compose exec mongodb mongosh --quiet \
#   --eval 'rs.status().members.map(m=>m.stateStr)'

# 5. Buat bucket object storage + policy public read (idempotent)
npm run storage:init

# 6. Seed data awal (admin, kasir, layanan, voucher, konten, slot 14 hari)
npm run seed

# 7. Jalankan dev server
npm run dev
# Buka http://localhost:3000
```

### Layanan Lokal

| Layanan | URL | Keterangan |
| --- | --- | --- |
| Aplikasi | http://localhost:3000 | Next.js dev server |
| MongoDB | `localhost:27017` | `mongo:8`, replica set `rs0` |
| Object storage (S3 API) | http://localhost:9000 | Bucket `bro-barber`, public read |
| Object storage (console) | http://localhost:9001 | Login: `brobarber` / `brobarber123` |

### Kenapa `rs.initiate()` wajib

Better Auth mengaktifkan transaksi secara otomatis pada adapter MongoDB
(`src/auth.ts` mengoper `client` ke `mongodbAdapter`). Transaksi hanya
berjalan di **replica set member**, bukan standalone. Tanpa `rs.initiate()`,
login & registrasi gagal dengan:
`Transaction numbers are only allowed on a replica set member or mongos`.

Host member di-set eksplisit ke `localhost:27017` agar dapat di-resolve dari
host (bukan hostname container).

### Troubleshooting

| Gejala | Penyebab & solusi |
| --- | --- |
| `Transaction numbers are only allowed on a replica set member or mongos` | Replica set belum di-init → jalankan `rs.initiate()` (langkah 4) |
| `Server selection timed out` / `no primary` | `rs.status()` belum `PRIMARY`, atau member host bukan `localhost:27017` |
| `rs.initiate()` error "already initialized" | Sudah pernah di-init. Ini normal & idempoten — lanjutkan |
| Upload gambar `501 Object storage belum dikonfigurasi` | `STORAGE_PROVIDER=s3` tapi env S3 kosong, atau `npm run storage:init` belum dijalankan |
| Gambar 403 saat dibuka | Bucket belum public read → `npm run storage:init` |
| `/_next/image` balas 400 | `images.dangerouslyAllowLocalIP` — sudah otomatis aktif di development |

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
| `npm run storage:init` | Buat bucket + policy public read |

## Environment Variables

Lihat `.env.example`:

- `MONGODB_URI` — koneksi MongoDB (harus replica set)
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` / `BETTER_AUTH_ALLOWED_HOSTS` — Better Auth
- `PAYMENT_WEBHOOK_TOKEN` — token webhook simulasi
- `XENDIT_SECRET_KEY` / `XENDIT_WEBHOOK_TOKEN` / `XENDIT_URL` — opsional, hanya untuk pengembangan integrasi Xendit (tidak aktif di aplikasi demo)
- `STORAGE_PROVIDER` — `s3` (default, lokal) atau `cloudinary`
- `S3_ENDPOINT` / `S3_PORT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` / `S3_PUBLIC_URL` — object storage S3-compatible
- `CLOUDINARY_URL` — hanya bila `STORAGE_PROVIDER=cloudinary`
- `SEED_ADMIN_*` / `SEED_CASHIER_*` — kredensial seed

## Object Storage

Upload gambar (foto ulasan, aset CMS) lewat `src/lib/storage.ts`, yang
memilih provider dari `STORAGE_PROVIDER`:

- **`s3`** (default, lokal) — RustFS, protokol S3 identik MinIO/AWS.
  Dijalankan lewat `docker compose up -d rustfs`, diinisialisasi dengan
  `npm run storage:init`.
- **`cloudinary`** (produksi) — set `CLOUDINARY_URL`.

Bucket harus **public read**, karena URL gambar dirender langsung di browser
oleh `next/image`. `npm run storage:init` menerapkan policy `s3:GetObject`
publik secara otomatis.

> **Catatan MinIO:** image resmi `minio/minio` dan `minio/mc` sudah dihapus
> dari Docker Hub, sehingga proyek ini memakai **RustFS** sebagai pengganti
> yang drop-in (protokol S3 identik). Kode aplikasi tidak berubah.

## Mode Pembayaran (Simulasi)

Aplikasi demo ini **selalu memakai provider simulasi** (`src/lib/payment/index.ts`).
Tidak ada transaksi atau uang sungguhan yang diproses. Pada langkah pembayaran,
gunakan tombol **"Simulasikan Pembayaran Berhasil"** untuk menandai DP lunas.

Kode integrasi Xendit tetap tersimpan di `src/lib/payment/xendit.ts`
(Payment Request v3 QRIS + verifikasi webhook) untuk pengembangan lanjutan.
Logika reservasi & slot tidak terikat ke provider karena memakai kontrak
`PaymentProvider`.

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
    ├── payment/            # PaymentProvider (simulation / xendit)
    ├── storage.ts          # Object storage (S3/RustFS ↔ Cloudinary)
    ├── services/           # slots, pricing, vouchers (logika inti)
    └── ...
```

## Dokumentasi

- **PRD**: `prd_barbershop_reservation.md`
- **SDD**: `docs/superpowers/specs/2026-08-01-bro-barber-reservation-design.md`
- **Rencana implementasi**: `docs/superpowers/plans/2026-08-01-bro-barber-reservation.md`
