/**
 * /api/tournaments/[id]/players/route.ts
 * ============================================================
 * Daftarkan player ke turnamen (penempatan pool dilakukan panitia)
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
// GET: List semua player dalam turnamen (dengan filter opsional)
// ----------------------------------------------------------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);

  const gender = url.searchParams.get("gender") as Gender | null;
  const grade = url.searchParams.get("grade") ?? null;
  const matchType = url.searchParams.get("matchType") as MatchType | null;

  try {
    const players = await prisma.player.findMany({
      where: {
        tournamentId: Number(id),
        ...(gender ? { gender } : {}),
        ...(grade ? { grade } : {}),
        ...(matchType ? { matchType } : {}),
      },
      include: {
        team: true,
        poolMembers: {
          include: { pool: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(`Berhasil memuat ${players.length} player 🏓`, players);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal memuat data player ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// ----------------------------------------------------------------
// POST: Daftarkan player baru (hanya untuk SINGLE)
//       → Menentukan categoryKey; penempatan pool oleh panitia
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
    const { fullName, schoolName, phoneNumber, gender, grade, matchType } = body;

    // --- Validasi field wajib ---
    if (!fullName || !schoolName || !phoneNumber || !gender || !grade || !matchType) {
      return errorResponse(
        "Semua field wajib diisi: fullName, schoolName, phoneNumber, gender, grade, matchType ⚠️",
        400,
        "BAD_REQUEST"
      );
    }

    // --- Validasi enum values ---
    const validGenders: Gender[] = ["MALE", "FEMALE"];
    const validMatchTypes: MatchType[] = ["SINGLE", "DOUBLE", "MIXED"];

    if (!validGenders.includes(gender)) {
      return errorResponse(`Gender tidak valid. Pilih: ${validGenders.join(", ")} ⚠️`, 400, "BAD_REQUEST");
    }
    if (!validMatchTypes.includes(matchType)) {
      return errorResponse(`MatchType tidak valid. Pilih: ${validMatchTypes.join(", ")} ⚠️`, 400, "BAD_REQUEST");
    }

    // --- Aturan bisnis: SINGLE hanya boleh daftar sendiri (bukan via endpoint team) ---
    if (matchType === "DOUBLE" || matchType === "MIXED") {
      return errorResponse(
        "Untuk DOUBLE dan MIXED, gunakan endpoint POST /teams untuk mendaftarkan tim ⚠️",
        400,
        "BAD_REQUEST"
      );
    }

    // --- Validasi gender terhadap matchType (SINGLE hanya 1 gender, tidak ada aturan tambahan) ---
    const genderValidation = validateGenderForMatchType(matchType, [gender]);
    if (!genderValidation.valid) {
      return errorResponse(genderValidation.message ?? "Validasi gender gagal ⚠️", 400, "BAD_REQUEST");
    }

    // --- Cek turnamen ada ---
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) {
      return errorResponse("Turnamen tidak ditemukan 🔍", 404, "NOT_FOUND");
    }

    // --- Buat player dalam satu transaksi (tanpa assign pool) ---
    // Pool dibuat & diisi oleh panitia melalui halaman kelola pool
    // setelah TM/pengundian.
    const categoryInfo = buildCategoryInfo(grade, gender, matchType);

    const player = await prisma.$transaction((tx) =>
      tx.player.create({
        data: {
          fullName,
          schoolName,
          phoneNumber,
          gender,
          grade,
          matchType,
          tournamentId,
        },
      })
    );

    return successResponse(
      "Player berhasil didaftarkan 🎉 (penempatan pool menunggu pengundian panitia)",
      {
        player,
        categoryKey: categoryInfo.key,
        categoryLabel: categoryInfo.label,
      },
      201
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mendaftarkan player ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}
