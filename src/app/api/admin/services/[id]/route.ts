import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ServiceModel } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

/** PATCH: perbarui layanan */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);

  await connectDB();
  const allowed = [
    "name",
    "description",
    "price",
    "duration",
    "image",
    "isActive",
    "sortOrder",
  ] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body?.[key] !== undefined) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diubah" }, { status: 400 });
  }

  const service = await ServiceModel.findByIdAndUpdate(id, update, { new: true });
  if (!service) {
    return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(service);
}

/** DELETE: hapus layanan */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  await connectDB();
  const service = await ServiceModel.findByIdAndDelete(id);
  if (!service) {
    return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
