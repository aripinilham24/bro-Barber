import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ReviewModel, REVIEW_STATUS } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

/** PATCH: setujui/tolak ulasan. Body: { status: "APPROVED" | "REJECTED" } */
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

  if (!body?.status || !REVIEW_STATUS.includes(body.status)) {
    return NextResponse.json(
      { error: "status wajib APPROVED atau REJECTED" },
      { status: 400 }
    );
  }

  await connectDB();
  const review = await ReviewModel.findByIdAndUpdate(
    id,
    { $set: { status: body.status } },
    { new: true }
  );
  if (!review) {
    return NextResponse.json({ error: "Ulasan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(review);
}
