import { auth } from "@/auth";
import { headers } from "next/headers";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  phone?: string;
};

/** Ambil sesi aktif (server-only). Kembalikan null bila belum login. */
export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const role = (session.user as unknown as { role?: string }).role ?? "client";
  return { ...session, role };
}

/** Cek role user aktif (server-only). */
export async function requireRole(
  roles: string[]
): Promise<{ session: SessionUser | null; role: string | null; allowed: boolean }> {
  const session = await getSession();
  if (!session) return { session: null, role: null, allowed: false };
  const allowed = roles.includes(session.role);
  return { session: session.user as SessionUser, role: session.role, allowed };
}
