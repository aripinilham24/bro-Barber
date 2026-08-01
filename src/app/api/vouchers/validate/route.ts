import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { validateVoucherForUser } from "@/lib/services/vouchers";
import { Types } from "mongoose";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || !body.code || !body.userId) {
    return NextResponse.json(
      { error: "code dan userId diperlukan" },
      { status: 400 }
    );
  }

  const result = await validateVoucherForUser(body.code, new Types.ObjectId(body.userId));

  return NextResponse.json({
    valid: result.ok,
    discountPercent: result.ok ? result.voucher.discountPercent : 0,
    reason: result.ok ? null : result.reason,
  });
}
