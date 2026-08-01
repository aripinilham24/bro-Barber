import { getSession } from "@/lib/session";

export type ApiError = { error: string; status: number };

/** Wajib login + role tertentu (server-side). Return error berstatus bila gagal. */
export async function requireRoles(
  roles: readonly string[]
): Promise<{ session: NonNullable<Awaited<ReturnType<typeof getSession>>> } | ApiError> {
  const session = await getSession();
  if (!session) return { error: "Silakan login dulu", status: 401 };
  if (!roles.includes(session.role)) {
    return { error: "Anda tidak memiliki akses ke fitur ini", status: 403 };
  }
  return { session };
}

/** Staff = admin | kasir */
export const STAFF_ROLES = ["admin", "kasir"] as const;
/** Admin saja */
export const ADMIN_ROLES = ["admin"] as const;
