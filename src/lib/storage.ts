import { Client } from "minio";

/**
 * Lapisan object storage — abstraksi di atas provider.
 *
 * Lokal: RustFS (S3-compatible, protokol identik MinIO/S3).
 * Produksi: Cloudinary.
 *
 * Pilih lewat env STORAGE_PROVIDER ("s3" | "cloudinary").
 */

export type StorageProviderName = "s3" | "cloudinary";

export type UploadResult = {
  /** URL publik untuk disimpan di database & dirender <Image src=...> */
  url: string;
  /** Identifier objek (object key S3 atau public_id Cloudinary) */
  key: string;
};

export interface ObjectStorage {
  readonly name: StorageProviderName;
  upload(bytes: Buffer, folder: string): Promise<UploadResult>;
}

/* ------------------------------------------------------------------ *
 * S3-compatible (RustFS / MinIO / AWS S3)
 * ------------------------------------------------------------------ */

type S3Config = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrl: string;
};

function readS3Config(): S3Config | null {
  const endPoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;
  if (!endPoint || !accessKey || !secretKey || !bucket) return null;

  return {
    endPoint,
    port: Number(process.env.S3_PORT ?? 9000),
    useSSL: process.env.S3_USE_SSL === "true",
    accessKey,
    secretKey,
    bucket,
    // URL dasar untuk merender gambar di browser (bukan endpoint API internal).
    publicUrl: (process.env.S3_PUBLIC_URL ?? `http://${endPoint}:${process.env.S3_PORT ?? 9000}/${bucket}`).replace(/\/$/, ""),
  };
}

let s3Client: Client | null = null;

function getS3(config: S3Config): Client {
  if (!s3Client) {
    s3Client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: process.env.S3_REGION ?? "us-east-1",
    });
  }
  return s3Client;
}

/** Nama objek unik: folder/xxxxxxxx.jpg (pakai timestamp + acak). */
function buildObjectKey(folder: string) {
  const rand = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${folder}/${stamp}-${rand}`;
}

const s3Storage: ObjectStorage = {
  name: "s3",

  async upload(bytes, folder) {
    const config = readS3Config();
    if (!config) {
      throw new Error(
        "Object storage S3 belum dikonfigurasi (S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET)."
      );
    }

    const client = getS3(config);
    const key = buildObjectKey(folder);

    // Deteksi ekstensi dari magic bytes agar tidak bergantung pada nama file.
    const ext = detectImageExtension(bytes);
    const objectKey = ext ? `${key}.${ext}` : key;

    await client.putObject(config.bucket, objectKey, bytes, bytes.length, {
      "Content-Type": guessContentType(ext),
    });

    return {
      key: objectKey,
      url: `${config.publicUrl}/${objectKey}`,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Cloudinary (produksi)
 * ------------------------------------------------------------------ */

import {
  uploadImage as cloudinaryUpload,
  isCloudinaryConfigured,
} from "./cloudinary";

const cloudinaryStorage: ObjectStorage = {
  name: "cloudinary",

  async upload(bytes, folder) {
    const { publicId, secureUrl } = await cloudinaryUpload(bytes, folder);
    return { key: publicId, url: secureUrl };
  },
};

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

function resolveProvider(): ObjectStorage {
  const mode = process.env.STORAGE_PROVIDER ?? "s3";
  if (mode === "cloudinary") return cloudinaryStorage;
  return s3Storage;
}

/**
 * Upload satu gambar. Memilih provider sesuai STORAGE_PROVIDER.
 * Melempar error bila provider tidak terkonfigurasi.
 */
export async function uploadImage(
  bytes: Buffer,
  folder: string
): Promise<UploadResult> {
  return resolveProvider().upload(bytes, folder);
}

/** True bila provider aktif siap dipakai (untuk disable kontrol upload di UI). */
export function isStorageConfigured(): boolean {
  const mode = process.env.STORAGE_PROVIDER ?? "s3";
  return mode === "cloudinary" ? isCloudinaryConfigured() : readS3Config() !== null;
}

export function getStorageProviderName(): StorageProviderName {
  return resolveProvider().name;
}

/* ---------------------------- utilitas ---------------------------- */

function detectImageExtension(bytes: Buffer): string | null {
  // JPEG
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  // PNG
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  // GIF
  if (bytes.length > 6 && bytes.toString("ascii", 0, 3) === "GIF") return "gif";
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes.length > 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function guessContentType(ext: string | null): string {
  switch (ext) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}