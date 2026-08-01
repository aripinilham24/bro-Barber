"use strict";
require("dotenv/config");

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import models
const User = require("./src/lib/db/models/User");
const Service = require("./src/lib/db/models/Service");
const Voucher = require("./src/lib/db/models/Voucher");
const SiteContent = require("./src/lib/db/models/SiteContent");
const { admin } = require("better-auth/plugins");

// Koneksi MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bro-barber";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("✓ Terhubung ke MongoDB");

    // Hapus data yang ada
    await User.deleteMany({});
    await Service.deleteMany({});
    await Voucher.deleteMany({});
    await SiteContent.deleteMany({});

    // Seed layanan
    const services = [
      {
        name: "Cukur Khas Bro Barber",
        description: "Potongan rapi, tepat waktu, suasana barbershop klasik.",
        price: 50000,
        duration: 45,
        image: "https://picsum.photos/seed/barber-1",
        isActive: true,
        sortOrder: 0,
      },
      {
        name: "Grooming Komplet",
        description: "Potong rambut + cukur + perawatan leher.",
        price: 85000,
        duration: 60,
        image: "https://picsum.photos/seed/barber-2",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Cukur Alis + Jenggot",
        description: "Bentuk alis dan rapikan jenggot sesuai bentuk wajah.",
        price: 40000,
        duration: 30,
        image: "https://picsum.photos/seed/barber-3",
        isActive: true,
        sortOrder: 2,
      },
    ];

    await Service.insertMany(services);
    console.log(`✓ ${services.length} layanan dis seed`);

    // Seed voucher
    const voucher = new Voucher({
      code: "CUKURFIRST",
      discountPercent: 10,
      description: "Potongan 10% untuk pelanggan baru.",
      isActive: true,
    });
    await voucher.save();
    console.log(`✓ Voucher ${voucher.code} dis seed`);

    // Seed admin dan kasir pengguna Better Auth
    // Menggunakan native Node MongoDB driver untuk collections auth
    const adminDb = mongoose.connection.db;
    const usersCollection = adminDb.collection("user");
    const sessionsCollection = adminDb.collection("session");

    // Helper fungsi hash password
    const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

    //Buat admin
    const existingAdmin = await usersCollection.findOne({ email: "admin@brobarber.id" });
    if (!existingAdmin) {
      const adminUser = {
        id: new mongoose.Types.ObjectId().toString(),
        name: "Admin Bro",
        email: "admin@brobarber.id",
        password: hashPassword("BroBarber123!"),
        emailVerified: true,
        role: "admin",
        phone: "",
        banned: false,
        banReason: null,
        banExpires: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await usersCollection.insertOne(adminUser);
      console.log("✓ Admin dis seed");
    }

    //Buat kasir
    const existingCashier = await usersCollection.findOne({ email: "kasir@brobarber.id" });
    if (!existingCashier) {
      const cashierUser = {
        id: new mongoose.Types.ObjectId().toString(),
        name: "Kasir Bro",
        email: "kasir@brobarber.id",
        password: hashPassword("BroBarber123!"),
        emailVerified: true,
        role: "kasir",
        phone: "",
        banned: false,
        banReason: null,
        banExpires: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await usersCollection.insertOne(cashierUser);
      console.log("✓ Kasir dis seed");
    }

    // Seed SiteContent
    const content = new SiteContent({
      businessName: "Bro Barber",
      tagline: "Datang rapi, pulang lebih pede.",
      hero: {
        eyebrow: "Bro Barber — Cukur & Grooming",
        title: "Datang. Cukur. Pulang Keren.",
        subtitle:
          "Pilih jamnya, kami siapkan kursinya. Tanpa nunggu antri, tanpa tebak-tebakan.",
        ctaText: "Amankan Slotmu",
        ctaSecondaryText: "Lihat Layanan",
        image: "https://picsum.photos/seed/hero-brobarber",
      },
      about: {
        title: "Dari satu kursi, untuk setiap potongan",
        text:
          "Bro Barber dimulai dari satu kursi dan satu keyakinan: setiap orang pantas tampil rapi tanpa drama. Tepat waktu, alat steril, harga transparan — itu janji kami di setiap potongan.",
        image: "https://picsum.photos/seed/about-brobarber",
      },
      hours: {
        slotDurationMinutes: 45,
        slotGapMinutes: 0,
        days: {
          1: { open: "", close: "" }, // Minggu tutup
          2: { open: "10:00", close: "21:00" },
          3: { open: "10:00", close: "21:00" },
          4: { open: "10:00", close: "21:00" },
          5: { open: "10:00", close: "21:00" },
          6: { open: "09:00", close: "22:00" },
          7: { open: "09:00", close: "22:00" },
        },
      },
      contact: {
        address: "Jl. Merdeka No. 12, Jakarta",
        phone: "0812-3456-7890",
        instagram: "@brobarber.id",
        mapsUrl: "https://maps.app.goo.gl/...",
      },
      gallery: [
        "https://picsum.photos/seed/gallery-1",
        "https://picsum.photos/seed/gallery-2",
        "https://picsum.photos/seed/gallery-3",
        "https://picsum.photos/seed/gallery-4",
      ],
      footerText: "Datang rapi, pulang lebih pede.",
    });
    await content.save();
    console.log("✓ Konten CMS dis seed");

    console.log("\n🎉 Seed selesai! Data siap untuk aplikasi Bro Barber.");
  } catch (error) {
    console.error("❌ Seed gagal:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
