/**
 * /api/tournaments/[id]/pools/route.ts
 * ============================================================
 * List semua pool dalam turnamen, dikelompokkan per categoryKey
 * ============================================================
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/apiResponse";

// ----------------------------------------------------------------
// GET: List semua pool dalam turnamen
// Query params opsional: ?categoryKey=SMA_MALE_SINGLE
// ----------------------------------------------------------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const categoryKey = url.searchParams.get("categoryKey");

  try {
    const pools = await prisma.pool.findMany({
      where: {
        tournamentId: Number(id),
        ...(categoryKey ? { categoryKey } : {}),
      },
      include: {
        members: {
          orderBy: [{ rank: "asc" }, { wins: "desc" }],
        },
        matches: {
          include: { member1: true, member2: true },
          orderBy: { matchOrder: "asc" },
        },
        _count: {
          select: { members: true, matches: true },
        },
      },
      orderBy: [{ categoryKey: "asc" }, { poolCode: "asc" }],
    });

    // Group by categoryKey untuk tampilan terstruktur
    const grouped: Record<string, Prisma.PoolGetPayload<{ include: { members: true; matches: { include: { member1: true; member2: true } }; _count: { select: { members: true; matches: true } } } }>[]> = {};
    for (const pool of pools) {
      if (!grouped[pool.categoryKey]) {
        grouped[pool.categoryKey] = [];
      }
      grouped[pool.categoryKey].push(pool);
    }

    return successResponse(
      `Berhasil memuat ${pools.length} pool 📋`,
      { pools, grouped }
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal memuat data pool ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}
