/**
 * Seed database "Bro Barber".
 * Jalankan: npm run seed
 *
 * Membuat: layanan, voucher, konten CMS, user admin/kasir/client demo,
 * ulasan contoh, dan slot untuk beberapa hari ke depan.
 */
import "dotenv/config";

import { connectDB } from "@/lib/db/connect";
import {
  ServiceModel,
  VoucherModel,
  SiteContentModel,
  ReviewModel,
  DEFAULT_BUSINESS_DAYS,
} from "@/lib/db/models";
import { ensureSlotsForRange } from "@/lib/services/slots";
import { auth } from "@/auth";

const SEED = {
  admin: {
    name: "Admin Bro",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@brobarber.id",
    password: process.env.SEED_ADMIN_PASSWORD ?? "BroBarber123!",
    role: "admin",
    phone: "0812-0000-0001",
  },
  kasir: {
    name: "Kasir Bro",
    email: process.env.SEED_CASHIER_EMAIL ?? "kasir@brobarber.id",
    password: process.env.SEED_CASHIER_PASSWORD ?? "BroBarber123!",
    role: "kasir",
    phone: "0812-0000-0002",
  },
  client: {
    name: "Client Demo",
    email: "client@brobarber.id",
    password: "BroBarber123!",
    role: "client",
    phone: "0812-0000-0003",
  },
};

async function seedUser(user: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}) {
  const conn = await connectDB();
  const db = conn.connection.db;
  if (!db) throw new Error("Koneksi MongoDB belum siap");
  const users = db.collection("user");

  const existing = await users.findOne({ email: user.email });
  if (existing) {
    // Pastikan role selalu benar (idempotent)
    await users.updateOne(
      { email: user.email },
      { $set: { role: user.role, emailVerified: true } }
    );
    console.log(`  · user ${user.email} sudah ada (role diperbaiki)`);
    return existing._id;
  }

  // Buat via API Better Auth agar password di-hash dengan algoritma yang sama.
  const result = await auth.api.signUpEmail({
    body: {
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
    },
  });

  // Catatan: `_id` user adalah ObjectId; cocokkan via email (lebih aman).
  await users.updateOne(
    { email: user.email },
    { $set: { role: user.role, emailVerified: true } }
  );

  console.log(`  · user ${user.email} dibuat (role ${user.role})`);
  return result.user.id;
}

async function main() {
  console.log("🌱 Seeding database Bro Barber...\n");
  await connectDB();

  // 1. Layanan
  if ((await ServiceModel.countDocuments()) === 0) {
    await ServiceModel.insertMany([
      {
        name: "Cukur Khas Bro Barber",
        description:
          "Potongan presisi sesuai bentuk wajah, diakhiri cuci + kering. Ritual paling dicari di Bro Barber.",
        price: 50000,
        duration: 45,
        image: "",
        isActive: true,
        sortOrder: 0,
      },
      {
        name: "Grooming Komplet",
        description:
          "Potong rambut, cukur jenggot/kumis, rapikan alis, dan perawatan wajah. Selesai dalam satu kursi.",
        price: 85000,
        duration: 60,
        image: "",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Cukur Jenggot & Kumis",
        description:
          "Rapikan garis dan bentuk dengan handuk panas, minyak setelahnya. Dijamin plong.",
        price: 40000,
        duration: 30,
        image: "",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Hair Tattoo & Detail",
        description:
          "Detail garis dan pola sesuai request. Untuk yang mau tampil beda.",
        price: 60000,
        duration: 40,
        image: "",
        isActive: true,
        sortOrder: 3,
      },
    ]);
    console.log("  ✓ 4 layanan dibuat");
  } else {
    console.log("  · layanan sudah ada");
  }

  // 2. Voucher
  if ((await VoucherModel.countDocuments()) === 0) {
    await VoucherModel.create({
      code: "CUKURFIRST",
      discountPercent: 10,
      description: "Potongan 10% untuk cukur pertamamu.",
      isActive: true,
    });
    console.log("  ✓ voucher CUKURFIRST (10%) dibuat");
  } else {
    console.log("  · voucher sudah ada");
  }

  // 3. User admin/kasir/client
  const adminId = await seedUser(SEED.admin);
  const cashierId = await seedUser(SEED.kasir);
  const clientId = await seedUser(SEED.client);

  // 4. Konten CMS
  if ((await SiteContentModel.countDocuments()) === 0) {
    await SiteContentModel.create({
      businessName: "Bro Barber",
      tagline: "Datang rapi, pulang lebih pede.",
      hero: {
        eyebrow: "Bro Barber — Cukur & Grooming",
        title: "Datang. Cukur. Pulang Keren.",
        subtitle:
          "Pilih jamnya, kami siapkan kursinya. Tanpa nunggu antri, tanpa tebak-tebakan.",
        ctaText: "Amankan Slotmu",
        ctaSecondaryText: "Lihat Layanan",
        image: "",
      },
      about: {
        title: "Dari satu kursi, untuk setiap potongan",
        text: "Bro Barber dimulai dari satu kursi dan satu keyakinan: setiap orang pantas tampil rapi tanpa drama. Tepat waktu, alat steril, harga transparan — itu janji kami di setiap potongan.",
        image: "",
      },
      hours: {
        slotDurationMinutes: 45,
        slotGapMinutes: 0,
        days: DEFAULT_BUSINESS_DAYS,
      },
      contact: {
        address: "Jl. Merdeka No. 12, Jakarta",
        phone: "0812-3456-7890",
        instagram: "@brobarber.id",
        mapsUrl: "",
      },
      gallery: [],
      footerText: "Datang rapi, pulang lebih pede.",
    });
    console.log("  ✓ konten CMS dibuat");
  } else {
    console.log("  · konten CMS sudah ada");
  }

  // 5. Ulasan contoh (status APPROVED agar tampil di landing)
  if ((await ReviewModel.countDocuments()) === 0) {
    const reviews = [
      {
        user: clientId,
        rating: 5,
        comment:
          "Booking online-nya beneran anti antri. Datang langsung dicukur, hasil rapi dan kapsternya ramah. Recommended!",
        photoUrl: "",
        status: "APPROVED",
      },
      {
        user: adminId,
        rating: 5,
        comment:
          "Grooming kompletnya juara. Handuk panasnya bikin ngantuk, hasilnya fresh seharian.",
        photoUrl: "",
        status: "APPROVED",
      },
      {
        user: cashierId,
        rating: 4,
        comment:
          "Tempatnya bersih, alat steril, harga jelas dari awal. DP 50% via QRIS bikin aman dari no-show.",
        photoUrl: "",
        status: "APPROVED",
      },
    ];
    await ReviewModel.insertMany(reviews);
    console.log("  ✓ 3 ulasan contoh dibuat");
  } else {
    console.log("  · ulasan sudah ada");
  }

  // 6. Slot untuk 14 hari ke depan
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const created = await ensureSlotsForRange(todayStr, 14);
  console.log(`  ✓ ${created} slot dibuat untuk 14 hari ke depan`);

  console.log("\n🎉 Seed selesai!");
  console.log("   Admin: admin@brobarber.id / BroBarber123!");
  console.log("   Kasir: kasir@brobarber.id / BroBarber123!");
  console.log("   Client demo: client@brobarber.id / BroBarber123!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed gagal:", err);
    process.exit(1);
  });
