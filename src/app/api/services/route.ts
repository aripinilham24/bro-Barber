import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ServiceModel } from "@/lib/db/models";

/** Daftar layanan aktif untuk landing & booking */
export async function GET() {
  await connectDB();
  const services = await ServiceModel.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .lean();
  return NextResponse.json(services);
}
