import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireRoles, STAFF_ROLES } from "@/lib/api-helpers";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * POST /api/admin/uploads — upload gambar (multipart, field "file").
 * Disimpan ke public/uploads (mode lokal; siap dipindah ke Cloudinary).
 */
export async function POST(request: NextRequest) {
  const auth = await requireRoles(STAFF_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Hanya gambar (JPEG/PNG/WebP/GIF) yang diizinkan" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran maksimal 5 MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `${crypto.randomUUID()}.${ext}`;

  const uploadDir = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.UPLOAD_DIR ?? "public/uploads"
  );
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), bytes);

  return NextResponse.json({
    success: true,
    url: `/uploads/${name}`,
  });
}
