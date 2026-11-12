/**
 * Inisialisasi object storage (bucket + policy public read).
 * Jalankan: npm run storage:init
 *
 * Hanya untuk mode S3 (RustFS/MinIO). Idempotent — aman dijalankan berulang.
 *
 * Policy public-read WAJIB diterapkan karena URL gambar dirender langsung
 * di browser lewat <Image src=...>; tanpa itu Next.js Image Optimization
 * akan mendapat 403 dari storage.
 */
import "dotenv/config";

import { Client } from "minio";

type StorageInitConfig = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  consolePort: number;
  publicUrl: string;
};

/** Baca & validasi env S3. Mengembalikan null bila ada yang belum terisi. */
function readConfig(): StorageInitConfig | null {
  const endPoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;
  if (!endPoint || !accessKey || !secretKey || !bucket) return null;

  const port = Number(process.env.S3_PORT ?? 9000);
  const consolePort = Number(process.env.S3_CONSOLE_PORT ?? 9001);

  return {
    endPoint,
    port,
    useSSL: process.env.S3_USE_SSL === "true",
    accessKey,
    secretKey,
    bucket,
    region: process.env.S3_REGION ?? "us-east-1",
    consolePort,
    publicUrl: (
      process.env.S3_PUBLIC_URL ?? `http://${endPoint}:${port}/${bucket}`
    ).replace(/\/$/, ""),
  };
}

function buildPolicy(bucket: string) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

/** Tunggu storage siap (health check sederhana). */
async function waitForStorage(client: Client, maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await client.listBuckets();
      return true;
    } catch {
      if (i === maxAttempts) return false;
      console.log(`  … menunggu storage siap (${i}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

async function main() {
  const config = readConfig();
  if (!config) {
    console.error(
      "❌ Env S3 belum lengkap. Pastikan S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET terisi di .env"
    );
    process.exit(1);
  }

  const { endPoint, port, useSSL, accessKey, secretKey, bucket, region } = config;

  const client = new Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
    region,
  });

  console.log(`🪣 Inisialisasi object storage di http://${endPoint}:${port}\n`);

  if (!(await waitForStorage(client))) {
    console.error(
      "❌ Storage tidak dapat diakses. Pastikan container sudah jalan:\n   docker compose up -d rustfs"
    );
    process.exit(1);
  }

  // 1. Bucket
  // Sebagian server S3 (termasuk RustFS) treat makeBucket pada bucket yang
  // sudah ada sebagai sukses tanpa error, jadi cek dulu lewat listBuckets
  // agar log akurat.
  const existing = (await client.listBuckets()).map((b) => b.name);
  if (existing.includes(bucket)) {
    console.log(`  · bucket "${bucket}" sudah ada`);
  } else {
    await client.makeBucket(bucket, region);
    console.log(`  ✓ bucket "${bucket}" dibuat`);
  }

  // 2. Policy public read
  await client.setBucketPolicy(bucket, buildPolicy(bucket));
  console.log("  ✓ policy public read diterapkan (s3:GetObject)");

  console.log(`\n🎉 Object storage siap.`);
  console.log(`   Endpoint API : http://${endPoint}:${port}`);
  console.log(`   Console web  : http://${endPoint}:${config.consolePort}`);
  console.log(`   Bucket       : ${bucket}`);
  console.log(`   Public URL   : ${config.publicUrl}/`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Inisialisasi storage gagal:", err);
    process.exit(1);
  });