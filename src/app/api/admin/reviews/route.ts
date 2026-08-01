import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ReviewModel } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

/** GET: semua ulasan (semua status) untuk moderasi */
export async function GET() {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  await connectDB();
  const reviews = await ReviewModel.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("reservation", "service date startTime")
    .lean();
  return NextResponse.json(reviews);
}
