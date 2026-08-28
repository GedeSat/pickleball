// /api/tournaments/[id]/brackets/matches/route.ts
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { verifyRefereeAccess } from "@/lib/refereeAuth";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";

const prisma = new PrismaClient();

// POST: Generate round-robin matches untuk sebuah grup
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { groupId } = body;

    if (!groupId) {
      return errorResponse("groupId wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    // Ambil semua member di grup ini
    const members = await prisma.groupMember.findMany({
      where: { groupId: Number(groupId) },
      orderBy: { seedOrder: "asc" },
    });

    if (members.length < 2) {
      return errorResponse("Minimal 2 pemain untuk generate pertandingan ⚠️", 400, "BAD_REQUEST");
    }

    // Hapus match lama di grup ini (reset)
    await prisma.groupMatch.deleteMany({
      where: { groupId: Number(groupId) },
    });

    // Reset statistik semua member
    await Promise.all(
      members.map((m) =>
        prisma.groupMember.update({
          where: { id: m.id },
          data: {
            played: 0,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointDiff: 0,
            rank: null,
          },
        })
      )
    );

    // Generate round-robin: setiap pemain melawan semua pemain lain
    const matches: { groupId: number; player1Name: string; player2Name: string }[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        matches.push({
          groupId: Number(groupId),
          player1Name: members[i].playerName,
          player2Name: members[j].playerName,
        });
      }
    }

    // Simpan semua match ke database
    await prisma.groupMatch.createMany({ data: matches });

    // Ambil matches yang baru dibuat
    const createdMatches = await prisma.groupMatch.findMany({
      where: { groupId: Number(groupId) },
      orderBy: { id: "asc" },
    });

    return successResponse("Pertandingan berhasil digenerate 📅", createdMatches, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal generate pertandingan ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// PUT: Update skor pertandingan + hitung statistik member otomatis
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { matchId, score1, score2, refereeName, refereeCode } = body;

    if (matchId === undefined || score1 === undefined || score2 === undefined) {
      return errorResponse("matchId, score1, score2 wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    // Otorisasi:
    // - wasit: kirim refereeCode → validasi akses kode wasit
    // - admin: tanpa refereeCode → wajib sesi admin
    if (refereeCode) {
      const access = await verifyRefereeAccess(refereeCode, Number(id));
      if (!access.ok) {
        return errorResponse(access.message, access.status ?? 403, "REFEREE_UNAUTHORIZED");
      }
    } else if (!(await requireAdminSession())) {
      return unauthorizedResponse();
    }

    const s1 = Number(score1);
    const s2 = Number(score2);

    // Ambil match yang akan di-update
    const match = await prisma.groupMatch.findUnique({
      where: { id: Number(matchId) },
    });

    if (!match) {
      return errorResponse("Match tidak ditemukan 🔍", 404, "NOT_FOUND");
    }

    // Pastikan match milik turnamen yang diminta
    const group = await prisma.tournamentGroup.findUnique({
      where: { id: match.groupId },
    });
    if (!group || group.tournamentId !== Number(id)) {
      return errorResponse("Match tidak ditemukan pada turnamen ini 🔍", 404, "NOT_FOUND");
    }

    // Tentukan pemenang
    const winner = s1 > s2 ? match.player1Name : s2 > s1 ? match.player2Name : null;

    // Update match dengan refereeName
    await prisma.groupMatch.update({
      where: { id: Number(matchId) },
      data: {
        score1: s1,
        score2: s2,
        winnerName: winner,
        refereeName: refereeName?.trim() || "Admin",
        status: "DONE",
      },
    });

    // Recalculate semua statistik member di grup ini
    await recalculateGroupStats(match.groupId);

    return successResponse("Skor berhasil diupdate 📝");
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal update skor ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// Fungsi untuk menghitung ulang statistik semua member dalam grup
async function recalculateGroupStats(groupId: number) {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
  });

  const matches = await prisma.groupMatch.findMany({
    where: { groupId, status: "DONE" },
  });

  // Hitung statistik per member
  const stats: Record<string, {
    played: number; wins: number; losses: number;
    pointsFor: number; pointsAgainst: number;
  }> = {};

  members.forEach((m) => {
    stats[m.playerName] = {
      played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0,
    };
  });

  matches.forEach((match) => {
    const p1 = match.player1Name;
    const p2 = match.player2Name;
    const s1 = match.score1 || 0;
    const s2 = match.score2 || 0;

    if (stats[p1]) {
      stats[p1].played++;
      stats[p1].pointsFor += s1;
      stats[p1].pointsAgainst += s2;
      if (s1 > s2) stats[p1].wins++;
      else if (s2 > s1) stats[p1].losses++;
    }

    if (stats[p2]) {
      stats[p2].played++;
      stats[p2].pointsFor += s2;
      stats[p2].pointsAgainst += s1;
      if (s2 > s1) stats[p2].wins++;
      else if (s1 > s2) stats[p2].losses++;
    }
  });

  // Buat array untuk di-rank
  const ranked = members.map((m) => ({
    id: m.id,
    ...stats[m.playerName],
    pointDiff: (stats[m.playerName]?.pointsFor || 0) - (stats[m.playerName]?.pointsAgainst || 0),
  }));

  // Sort: menang terbanyak → selisih poin terbesar → poin terbanyak
  ranked.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsFor - a.pointsFor;
  });

  // Update semua member dengan statistik dan ranking baru
  await Promise.all(
    ranked.map((r, index) =>
      prisma.groupMember.update({
        where: { id: r.id },
        data: {
          played: r.played,
          wins: r.wins,
          losses: r.losses,
          pointsFor: r.pointsFor,
          pointsAgainst: r.pointsAgainst,
          pointDiff: r.pointDiff,
          rank: index + 1,
        },
      })
    )
  );
}
