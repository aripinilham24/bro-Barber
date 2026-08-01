import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SiteContentModel } from "@/lib/db/models";

/** Konten landing dari CMS (publik) */
export async function GET() {
  await connectDB();
  const content = await SiteContentModel.findOne().lean();
  if (!content) {
    return NextResponse.json({ error: "Konten belum di-set" }, { status: 404 });
  }
  return NextResponse.json(content);
}
