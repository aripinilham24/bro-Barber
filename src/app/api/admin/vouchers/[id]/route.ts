import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { VoucherModel } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

/** PATCH: perbarui voucher */
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
  const update: Record<string, unknown> = {};
  for (const key of ["code", "discountPercent", "description", "isActive"] as const) {
    if (body?.[key] !== undefined) update[key] = key === "code" ? String(body[key]).trim().toUpperCase() : body[key];
  }
  const voucher = await VoucherModel.findByIdAndUpdate(id, update, { new: true });
  if (!voucher) {
    return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(voucher);
}

/** DELETE: hapus voucher */
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
  const voucher = await VoucherModel.findByIdAndDelete(id);
  if (!voucher) {
    return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
