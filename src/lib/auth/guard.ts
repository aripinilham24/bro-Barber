import type { NextRequest, NextResponse } from "next/server";

// In-memory session store untuk semua lingkungan
interface Session {
  id: string;
  userId: string;
  role: "client" | "kasir" | "admin";
  expiresAt: Date;
}

const sessions = new Map<string, Session>();

export async function protect(
  request: NextRequest,
  roles: string[]
): Promise<{ success: boolean; error?: string }> {
  const authHeader = request.headers.get("authorization");
  const sessionToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!sessionToken) {
    return {
      success: false,
      error: "Session tidak ditemukan",
    };
  }

  const session = sessions.get(sessionToken);
  if (!session || session.expiresAt < new Date()) {
    return {
      success: false,
      error: "Sesi tidak valid atau kadaluarsa",
    };
  }

  if (!roles.includes(session.role)) {
    return {
      success: false,
      error: "Anda tidak memiliki akses yang diperlukan",
    };
  }

  return { success: true };
}
