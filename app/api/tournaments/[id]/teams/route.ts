/**
 * /api/tournaments/[id]/teams/route.ts
 * ============================================================
 * Buat tim untuk pertandingan DOUBLE atau MIXED
 * + Validasi gender (penempatan pool oleh panitia)
 * ============================================================
 */

import { Gender, MatchType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";
import {
  buildCategoryInfo,
  validateGenderForMatchType,
} from "@/lib/tournamentCategory";

// ----------------------------------------------------------------
// GET: List semua team dalam turnamen
// ----------------------------------------------------------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const matchType = url.searchParams.get("matchType") as MatchType | null;
  const grade = url.searchParams.get("grade") ?? null;

  try {
    const teams = await prisma.team.findMany({
      where: {
        tournamentId: Number(id),
        ...(matchType ? { matchType } : {}),
        ...(grade ? { grade } : {}),
      },
      include: {
        players: true,
        poolMembers: {
          include: { pool: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(`Berhasil memuat ${teams.length} tim 🏓`, teams);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal memuat data tim ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// ----------------------------------------------------------------
// POST: Buat tim baru (DOUBLE / MIXED)
//
// Payload:
// {
//   "teamName": "Budi & Andi",
//   "grade": "SMA",
//   "matchType": "DOUBLE",          // atau "MIXED"
//   "players": [
//     { "fullName": "Budi",  "schoolName": "SMA 1", "phoneNumber": "08xx", "gender": "MALE" },
//     { "fullName": "Andi",  "schoolName": "SMA 2", "phoneNumber": "08xx", "gender": "MALE" }
//   ]
// }
// ----------------------------------------------------------------
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournamentId = Number(id);

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { teamName, grade, matchType, players } = body;

    // --- Validasi field wajib ---
    if (!teamName || !grade || !matchType || !players) {
      return errorResponse(
        "Field wajib: teamName, grade, matchType, players ⚠️",
        400,
        "BAD_REQUEST"
      );
    }

    if (!Array.isArray(players)) {
      return errorResponse("Field 'players' harus berupa array ⚠️", 400, "BAD_REQUEST");
    }

    // --- Validasi enum ---
    const validMatchTypes: MatchType[] = ["DOUBLE", "MIXED"];

    if (!validMatchTypes.includes(matchType)) {
      return errorResponse(
        "MatchType untuk tim harus DOUBLE atau MIXED ⚠️",
        400,
        "BAD_REQUEST"
      );
    }

    // --- Validasi jumlah & struktur player ---
    if (players.length !== 2) {
      return errorResponse("Tim harus terdiri dari tepat 2 pemain ⚠️", 400, "BAD_REQUEST");
    }

    for (const p of players) {
      if (!p.fullName || !p.schoolName || !p.phoneNumber || !p.gender) {
        return errorResponse(
          "Setiap player wajib memiliki: fullName, schoolName, phoneNumber, gender ⚠️",
          400,
          "BAD_REQUEST"
        );
      }
    }

    const genders: Gender[] = players.map((p) => p.gender);

    // --- Validasi aturan gender ---
    const genderValidation = validateGenderForMatchType(matchType, genders);
    if (!genderValidation.valid) {
      return errorResponse(genderValidation.message ?? "Validasi gender gagal ⚠️", 400, "BAD_REQUEST");
    }

    // --- Cek turnamen ---
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) {
      return errorResponse("Turnamen tidak ditemukan 🔍", 404, "NOT_FOUND");
    }

    // --- Tentukan gender dominan (untuk DOUBLE) atau null (untuk MIXED) ---
    const dominantGender: Gender | null =
      matchType === "MIXED" ? null : genders[0];

    // --- Build category info ---
    const categoryInfo = buildCategoryInfo(grade, dominantGender, matchType);

    // --- Buat team + players dalam satu transaksi (tanpa assign pool) ---
    // Pool dibuat & diisi oleh panitia melalui halaman kelola pool
    // setelah TM/pengundian.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Team
      const team = await tx.team.create({
        data: {
          name: teamName,
          matchType,
          grade,
          categoryKey: categoryInfo.key,
          tournamentId,
        },
      });

      // 2. Buat Player & link ke team
      const createdPlayers = [];
      for (const p of players) {
        const player = await tx.player.create({
          data: {
            fullName: p.fullName,
            schoolName: p.schoolName,
            phoneNumber: p.phoneNumber,
            gender: p.gender,
            grade,
            matchType,
            tournamentId,
            teamId: team.id,
          },
        });
        createdPlayers.push(player);
      }

      return { team, players: createdPlayers };
    });

    return successResponse(
      "Tim berhasil didaftarkan 🎉 (penempatan pool menunggu pengundian panitia)",
      {
        team: result.team,
        players: result.players,
        categoryKey: categoryInfo.key,
        categoryLabel: categoryInfo.label,
      },
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mendaftarkan tim ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}
