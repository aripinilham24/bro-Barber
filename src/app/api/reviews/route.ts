import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { ReviewModel } from "@/lib/db/models";
import { getSession } from "@/lib/session";

/** GET: ulasan yang sudah disetujui (tampil di landing) */
export async function GET() {
  await connectDB();
  const reviews = await ReviewModel.find({ status: "APPROVED" })
    .sort({ createdAt: -1 })
    .limit(12)
    .populate<{ user: { name: string; image?: string | null } }>("user", "name image")
    .lean();
  const safe = reviews.map((r) => ({
    id: r._id,
    rating: r.rating,
    comment: r.comment,
    photoUrl: r.photoUrl,
    createdAt: r.createdAt,
    author: r.user?.name ?? "Pelanggan Bro Barber",
    avatar: r.user?.image ?? null,
  }));
  return NextResponse.json(safe);
}

/** POST: pelanggan memberikan ulasan untuk reservasinya yang COMPLETED */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login dulu" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }
  const { reservationId, rating, comment, photoUrl } = body;
  if (!reservationId || !rating || !comment?.trim()) {
    return NextResponse.json(
      { error: "reservationId, rating, dan komentar wajib diisi" },
      { status: 400 }
    );
  }
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return NextResponse.json(
      { error: "Rating harus 1–5" },
      { status: 400 }
    );
  }

  await connectDB();
  const { ReservationModel } = await import("@/lib/db/models");
  const userId = new Types.ObjectId(String(session.user.id));

  const reservation = await ReservationModel.findOne({
    _id: new Types.ObjectId(String(reservationId)),
    user: userId,
  }).lean();
  if (!reservation) {
    return NextResponse.json(
      { error: "Reservasi tidak ditemukan" },
      { status: 404 }
    );
  }
  if (reservation.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Ulasan hanya bisa diberikan setelah layanan selesai" },
      { status: 400 }
    );
  }

  const existing = await ReviewModel.findOne({ reservation: reservation._id });
  if (existing) {
    return NextResponse.json(
      { error: "Reservasi ini sudah pernah diulas" },
      { status: 409 }
    );
  }

  const review = await ReviewModel.create({
    reservation: reservation._id,
    user: userId,
    rating: r,
    comment: comment.trim(),
    photoUrl: photoUrl ?? "",
    status: "PENDING",
  });

  return NextResponse.json(
    { success: true, reviewId: review._id },
    { status: 201 }
  );
}
