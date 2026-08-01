import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { VoucherModel } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

/** GET: daftar voucher */
export async function GET() {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  await connectDB();
  const vouchers = await VoucherModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(vouchers);
}

/** POST: buat voucher baru */
export async function POST(request: NextRequest) {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = await request.json().catch(() => null);
  const code = body?.code?.trim().toUpperCase();
  const discountPercent = Number(body?.discountPercent);
  if (!code || !Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
    return NextResponse.json(
      { error: "code wajib dan discountPercent harus 1–100" },
      { status: 400 }
    );
  }

  await connectDB();
  const existing = await VoucherModel.findOne({ code });
  if (existing) {
    return NextResponse.json({ error: "Kode voucher sudah ada" }, { status: 409 });
  }
  const voucher = await VoucherModel.create({
    code,
    discountPercent: Math.round(discountPercent),
    description: body?.description ?? "",
    isActive: body?.isActive ?? true,
  });
  return NextResponse.json(voucher, { status: 201 });
}
