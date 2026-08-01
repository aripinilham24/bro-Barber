import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SiteContentModel, DEFAULT_BUSINESS_DAYS } from "@/lib/db/models";
import { requireRoles, ADMIN_ROLES } from "@/lib/api-helpers";

/** GET: konten CMS saat ini */
export async function GET() {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  await connectDB();
  const content = await SiteContentModel.findOne().lean();
  if (!content) {
    return NextResponse.json({ error: "Konten belum dibuat" }, { status: 404 });
  }
  return NextResponse.json(content);
}

/** PUT: simpan seluruh konten CMS */
export async function PUT(request: NextRequest) {
  const auth = await requireRoles(ADMIN_ROLES);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  await connectDB();
  const existing = await SiteContentModel.findOne();
  if (!existing) {
    const created = await SiteContentModel.create({
      ...DEFAULT_BUSINESS_DAYS_SAFE(body),
      ...body,
    });
    return NextResponse.json(created);
  }

  // Setel semua field kecuali timestamps/objectId
  Object.assign(existing, sanitizeContent(body, existing.toObject()));
  await existing.save();
  return NextResponse.json(existing);
}

/** Isi default bila site content belum ada */
function DEFAULT_BUSINESS_DAYS_SAFE(_body: unknown) {
  return { hours: { days: DEFAULT_BUSINESS_DAYS } };
}

function sanitizeContent(body: Record<string, unknown>, fallback: Record<string, unknown>) {
  const allowed = [
    "businessName",
    "tagline",
    "hero",
    "about",
    "hours",
    "contact",
    "gallery",
    "footerText",
  ];
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) out[key] = body[key];
    else if (fallback[key] !== undefined) out[key] = fallback[key];
  }
  return out;
}
