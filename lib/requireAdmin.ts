// lib/requireAdmin.ts
// Helper otorisasi untuk API admin — dipakai di Route Handlers (server-side).
// Menolak akses jika tidak ada sesi NextAuth dengan role admin yang diizinkan.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { errorResponse } from "@/lib/apiResponse";

const ADMIN_ROLES = new Set<string>(["SUPER_ADMIN", "ADMIN", "MATCH_ADMIN"]);

/**
 * Validasi sesi admin dari cookie server.
 * Mengembalikan session jika user login dengan role SUPER_ADMIN / ADMIN / MATCH_ADMIN,
 * selain itu null.
 */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !ADMIN_ROLES.has(role)) return null;
  return session;
}

/**
 * Response 401 Unauthorized dengan format API yang konsisten.
 */
export function unauthorizedResponse() {
  return errorResponse(
    "Akses ditolak. Anda harus login sebagai admin.",
    401,
    "UNAUTHORIZED"
  );
}