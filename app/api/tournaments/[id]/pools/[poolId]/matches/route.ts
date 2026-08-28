/**
 * /api/tournaments/[id]/pools/[poolId]/matches/route.ts
 * ============================================================
 * Generate & kelola pertandingan round-robin dalam pool
 * ============================================================
 */

import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { verifyRefereeAccess } from "@/lib/refereeAuth";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";
import {
  generatePoolMatches,
  recalculatePoolStandings,
} from "@/lib/tournamentCategory";
import { fillBracketFromPools } from "@/lib/bracketTemplate";

// ----------------------------------------------------------------
// GET: List semua match dalam pool
// ----------------------------------------------------------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  const { poolId } = await params;

  try {
    const matches = await prisma.poolMatch.findMany({
      where: { poolId: Number(poolId) },
      include: {
        member1: true,
        member2: true,
      },
      orderBy: { matchOrder: "asc" },
    });

    const pool = await prisma.pool.findUnique({
      where: { id: Number(poolId) },
      include: {
        members: { orderBy: [{ rank: "asc" }, { wins: "desc" }] },
      },
    });

    return successResponse("Data pool matches berhasil diambil 📅", {
      pool,
      matches,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal memuat pool matches ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// ----------------------------------------------------------------
// POST: Generate round-robin matches untuk pool ini
// ----------------------------------------------------------------
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  const { poolId } = await params;
  const pid = Number(poolId);

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    // Cek pool ada
    const pool = await prisma.pool.findUnique({ where: { id: pid } });
    if (!pool) {
      return errorResponse("Pool tidak ditemukan 🔍", 404, "NOT_FOUND");
    }

    const memberCount = await prisma.poolMember.count({
      where: { poolId: pid },
    });

    if (memberCount < 2) {
      return errorResponse(
        "Pool harus memiliki minimal 2 member sebelum generate matches ⚠️",
        400,
        "BAD_REQUEST"
      );
    }

    const matches = await generatePoolMatches(prisma, pid);

    return successResponse(
      `${matches.length} pertandingan round-robin berhasil di-generate 🏓`,
      { poolId: pid, matchCount: matches.length, matches },
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal generate pool matches ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// ----------------------------------------------------------------
// PUT: Input / update skor pertandingan pool
//
// Payload: { matchId, score1, score2 }
// atau reset: { matchId, reset: true }
// ----------------------------------------------------------------
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  const { id, poolId } = await params;
  const tid = Number(id);
  const pid = Number(poolId);

  try {
    const body = await req.json();
    const { matchId, score1, score2, reset, refereeCode } = body;

    if (!matchId) {
      return errorResponse("matchId wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    // Otorisasi:
    // - wasit: kirim refereeCode → validasi akses kode wasit
    // - admin: tanpa refereeCode → wajib sesi admin
    if (refereeCode) {
      const access = await verifyRefereeAccess(refereeCode, tid);
      if (!access.ok) {
        return errorResponse(access.message, access.status ?? 403, "REFEREE_UNAUTHORIZED");
      }
    } else if (!(await requireAdminSession())) {
      return unauthorizedResponse();
    }

    const match = await prisma.poolMatch.findUnique({
      where: { id: Number(matchId) },
    });

    if (!match || match.poolId !== pid) {
      return errorResponse("Match tidak ditemukan dalam pool ini 🔍", 404, "NOT_FOUND");
    }

    // Pastikan pool milik turnamen yang diminta
    const poolCtx = await prisma.pool.findUnique({ where: { id: pid } });
    if (!poolCtx || poolCtx.tournamentId !== tid) {
      return errorResponse("Pool tidak ditemukan pada turnamen ini 🔍", 404, "NOT_FOUND");
    }

    // --- Reset skor ---
    if (reset) {
      await prisma.poolMatch.update({
        where: { id: match.id },
        data: {
          score1: null,
          score2: null,
          winnerId: null,
          winnerName: null,
          status: "SCHEDULED",
        },
      });
      // Hitung ulang standings
      await recalculatePoolStandings(prisma, pid);
      return successResponse("Skor berhasil direset 🔄");
    }

    // --- Input skor ---
    if (score1 === undefined || score2 === undefined) {
      return errorResponse("score1 dan score2 wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    const s1 = Number(score1);
    const s2 = Number(score2);

    if (s1 === s2) {
      return errorResponse(
        "Skor tidak boleh seri dalam pertandingan sistem pool ⚠️",
        400,
        "BAD_REQUEST"
      );
    }

    const winnerId = s1 > s2 ? match.member1Id : match.member2Id;

    // Ambil nama pemenang
    const winner = await prisma.poolMember.findUnique({
      where: { id: winnerId },
    });

    await prisma.poolMatch.update({
      where: { id: match.id },
      data: {
        score1: s1,
        score2: s2,
        winnerId,
        winnerName: winner?.memberName ?? null,
        status: "DONE",
      },
    });

    // Hitung ulang standings setelah update skor
    await recalculatePoolStandings(prisma, pid);

    // Auto-fill slot bagan template yang sudah bisa di-resolve dari peringkat pool
    const pool = await prisma.pool.findUnique({ where: { id: pid } });
    if (pool) {
      await fillBracketFromPools(prisma, pool.tournamentId, pool.categoryKey);
    }

    return successResponse("Skor berhasil diupdate 📝", {
      matchId: match.id,
      winnerId,
      winnerName: winner?.memberName,
      poolStatus: pool?.status,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal update skor ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}
