import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadImage } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * POST /api/uploads — upload gambar untuk user yang login (mis. foto ulasan).
 * Disimpan ke object storage aktif (RustFS/MinIO S3 atau Cloudinary);
 * mengembalikan URL publik.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
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

  try {
    const { url } = await uploadImage(bytes, "reviews");
    return NextResponse.json({ success: true, url });
  } catch {
    return NextResponse.json(
      { error: "Object storage belum dikonfigurasi atau upload gagal" },
      { status: 501 }
    );
  }
}
