import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { validateVoucherForUser } from "@/lib/services/vouchers";
import { getSession } from "@/lib/session";

/**
 * POST /api/vouchers/validate — validasi voucher untuk user yang login.
 * Body: { code }
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = body?.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Kode voucher wajib diisi" }, { status: 400 });
  }

  await connectDB();
  const result = await validateVoucherForUser(code, session.user.id);

  if (!result.ok) {
    return NextResponse.json(
      { valid: false, reason: result.reason },
      { status: 200 }
    );
  }
  return NextResponse.json({
    valid: true,
    code: result.voucher.code,
    discountPercent: result.voucher.discountPercent,
    description: result.voucher.description,
  });
}
