import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ServiceModel } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

/** GET: semua layanan (termasuk non-aktif) untuk CMS */
export async function GET() {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  await connectDB();
  const services = await ServiceModel.find().sort({ sortOrder: 1 }).lean();
  return NextResponse.json(services);
}

/** POST: buat layanan baru */
export async function POST(request: NextRequest) {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const price = Number(body?.price);
  const duration = Number(body?.duration);
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(duration) || duration < 5) {
    return NextResponse.json(
      { error: "name, price (>=0), dan duration (>=5 menit) wajib valid" },
      { status: 400 }
    );
  }

  await connectDB();
  const service = await ServiceModel.create({
    name,
    description: body?.description ?? "",
    price: Math.round(price),
    duration: Math.round(duration),
    image: body?.image ?? "",
    isActive: body?.isActive ?? true,
    sortOrder: Number(body?.sortOrder ?? 0),
  });
  return NextResponse.json(service, { status: 201 });
}
