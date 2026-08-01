# Product Requirements Document (PRD): Sistem Reservasi Barbershop

## 1. Ringkasan & Tujuan Produk
**Tujuan:** Menyediakan *platform* reservasi cukur rambut berbasis *web* untuk menghilangkan waktu tunggu tidak pasti bagi pelanggan, meminimalisir *no-show* dengan sistem *Down Payment* (DP) 50%, dan memberikan kemudahan pengelolaan konten (CMS) bagi pemilik *barbershop*.

## 2. Arsitektur & Teknologi (*Tech Stack*)

| Komponen | Teknologi | Fungsi Utama |
| :--- | :--- | :--- |
| **Frontend & Backend** | Next.js (App Router) | *Landing page*, *routing* API, *server-side rendering*, dan *dashboard* admin. |
| **Database** | MongoDB (Mongoose) | Penyimpanan data *user*, reservasi, log pembayaran, dan konfigurasi CMS. |
| **Authentication** | NextAuth.js | Manajemen sesi, enkripsi JWT yang aman disimpan dalam *HttpOnly cookies*. |
| **Payment Gateway** | Xendit | Pembuatan QRIS dinamis untuk DP dan penerimaan *webhook* pembayaran. |
| **Asset Storage** | Cloudinary | Penyimpanan gambar CMS *landing page* dan foto ulasan pelanggan. |

## 3. User Stories

### A. Sisi Pelanggan (Client)
* **US-C01:** Sebagai pelanggan, saya ingin dapat melihat daftar layanan, harga, dan profil *barbershop* di *landing page* agar saya bisa memutuskan layanan yang tepat.
* **US-C02:** Sebagai pelanggan, saya ingin mendaftar dan masuk ke aplikasi agar dapat melakukan reservasi.
* **US-C03:** Sebagai pelanggan, saya ingin melihat ketersediaan slot waktu yang *real-time* agar saya tidak salah memilih jadwal yang sudah penuh.
* **US-C04:** Sebagai pelanggan baru, saya ingin memasukkan kode *voucher* saat *checkout* agar mendapatkan diskon 10% pada transaksi pertama saya.
* **US-C05:** Sebagai pelanggan, saya ingin membayar DP 50% (setelah diskon) menggunakan metode QRIS agar reservasi saya terkonfirmasi.
* **US-C06:** Sebagai pelanggan, saya ingin melihat riwayat dan status reservasi saya (Menunggu Pembayaran, DP Lunas, Selesai) agar saya bisa memantau jadwal cukur saya.
* **US-C07:** Sebagai pelanggan, saya ingin memberikan ulasan dan mengunggah foto hasil cukur agar pelanggan lain bisa melihat referensi potongan.

### B. Sisi Admin / Kasir
* **US-A01:** Sebagai admin, saya ingin melihat *dashboard* jadwal reservasi hari ini agar saya tahu siapa saja yang akan datang dan pada jam berapa.
* **US-A02:** Sebagai kasir, saya ingin mengubah status transaksi dari `DP_PAID` menjadi `COMPLETED` saat pelanggan membayar sisa tagihan 50% (tunai/QRIS *offline*) di lokasi.
* **US-A03:** Sebagai admin, saya ingin dapat menutup slot waktu tertentu secara manual (misal: kapster sakit/istirahat) agar pelanggan tidak bisa *booking* di waktu tersebut.
* **US-A04:** Sebagai admin, saya ingin mengubah teks (judul, deskripsi, harga) dan gambar *banner* pada *landing page* langsung dari *dashboard* (CMS) agar web selalu terbarui tanpa mengubah kode.

## 4. Alur Pengguna (*User Flow*)

### Alur Reservasi & Pembayaran DP
1. **Eksplorasi:** *User* membuka *landing page*, melihat layanan, dan menekan tombol "Booking Sekarang".
2. **Autentikasi:** Sistem meminta *user* login/register (jika belum).
3. **Pilih Jadwal:** *User* disajikan antarmuka kalender/jam. Sistem mengambil data dari MongoDB untuk hanya menampilkan slot dengan status `AVAILABLE`.
4. **Checkout & Voucher:** *User* memilih layanan dan menginput *voucher* (misal: `CUKURFIRST`). API Next.js memvalidasi apakah pengguna pernah memakai kode ini sebelumnya. Jika valid, total dipotong 10%.
5. **Generate Pembayaran:** Sistem mengalkulasi 50% dari final total, lalu menembak API Xendit untuk membuat QRIS. Slot di MongoDB dikunci sementara (`BOOKED_PENDING`) selama 15 menit.
6. **Pembayaran (QRIS):** *User* men-scan QRIS dalam batas waktu.
    * *Skenario Sukses:* *User* bayar -> Xendit mengirim *webhook* -> Sistem memvalidasi token *webhook* -> Status reservasi menjadi `DP_PAID` -> *User* diarahkan ke halaman "Reservasi Berhasil".
    * *Skenario Gagal/Expired:* Lewat 15 menit -> *Cron* atau pengecekan dinamis mengembalikan status slot di MongoDB menjadi `AVAILABLE`.

### Alur Pelunasan (Di Tempat)
1. Pelanggan datang dan menikmati layanan cukur.
2. Saat selesai, pelanggan menuju kasir.
3. Kasir membuka *Dashboard* Admin, mencari nama/ID pelanggan.
4. Sistem menampilkan sisa tagihan 50%.
5. Pelanggan membayar via tunai atau QRIS *offline* (mesin EDC kasir).
6. Kasir menekan tombol "Tandai Lunas". Sistem memperbarui status menjadi `COMPLETED`.

## 5. Kebutuhan Non-Fungsional & Sistem Keamanan

* **Concurrency & Double Booking:** Pengecekan ketersediaan slot harus dilakukan di tingkat *database* (seperti penerapan *locking* di Mongoose) saat *user* menekan tombol *checkout*, bukan hanya bergantung pada tampilan *frontend*.
* **Keamanan Endpoint & Autentikasi:** 
  * Mengamankan *session* dengan NextAuth.js dan menyimpan JWT secara eksklusif di *HttpOnly cookies* untuk melindungi aplikasi dari eksploitasi XSS.
  * *Endpoint* validasi pembayaran (`/api/webhooks/xendit`) wajib memverifikasi *header* `x-callback-token`.
* **Kalkulasi Server-Side:** Seluruh hitungan aritmatika untuk pemotongan diskon dan pembagian nilai DP dilakukan mutlak di *backend* (API route Next.js) sebelum dilempar ke API eksternal.
* **Optimasi Deployment:** Mengingat arsitektur API dan web disatukan menggunakan Next.js, pastikan pustaka yang digunakan di *server-side* dijaga seramping mungkin. Menghindari pustaka atau paket pengolah data berukuran masif jika ada alternatif yang lebih ringan akan sangat membantu mencegah risiko membentur batas maksimal ukuran *serverless function* jika sewaktu-waktu aplikasi ini di-deploy ke lingkungan *hosting* seperti Vercel.
