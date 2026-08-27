/**
 * lib/bracketGenerator.ts
 * ============================================================
 * Helper untuk generate bracket knockout (single-elimination)
 * dari daftar nama peserta yang sudah terurut (seeded).
 *
 * Digunakan oleh:
 * - /api/tournaments/[id]/brackets/knockout (legacy)
 * - /api/tournaments/[id]/pools/[poolId]/bracket (sistem baru)
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";

// ----------------------------------------------------------------
// BRACKET MATH HELPERS
// ----------------------------------------------------------------

/** Menghitung kelipatan 2 terkecil yang >= num (ukuran bracket standar) */
export function getNextPowerOf2(num: number): number {
  let power = 2;
  while (power < num) {
    power *= 2;
  }
  return power;
}

/**
 * Algoritma seeding konvensional bracket.
 * Mengatur posisi sehingga seed 1 vs 8, 2 vs 7, dst.
 * Memastikan unggulan teratas tidak bertemu terlalu awal.
 */
export function getSeeding(numPlayers: number): number[] {
  const rounds = Math.log2(numPlayers);
  let positions = [0, 1];
  for (let i = 1; i < rounds; i++) {
    const next: number[] = [];
    const length = positions.length * 2;
    for (let j = 0; j < positions.length; j++) {
      next.push(positions[j]);
      next.push(length - 1 - positions[j]);
    }
    positions = next;
  }
  return positions;
}

// ----------------------------------------------------------------
// ROUND TEXT
// ----------------------------------------------------------------

export function getRoundText(bracketSize: number, round: number): string {
  const matchesInRound = bracketSize / Math.pow(2, round + 1);
  if (matchesInRound === 1) return "Final";
  if (matchesInRound === 2) return "Semifinal";
  if (matchesInRound === 4) return "Perempatfinal";
  return `Babak ${round + 1}`;
}

// ----------------------------------------------------------------
// MAIN: Generate & Simpan Bracket ke Database
// ----------------------------------------------------------------

/**
 * Membuat struktur bracket knockout penuh dari daftar nama peserta
 * dan menyimpannya ke tabel KnockoutMatch di database.
 *
 * Peserta harus sudah diurutkan berdasarkan seed (index 0 = seed terbaik).
 * Jika jumlah peserta bukan kelipatan 2, akan ditambahkan "BYE" secara otomatis.
 *
 * @param seededNames  - Array nama peserta sudah terurut (seed 1 di index 0)
 * @param tournamentId - ID Turnamen
 * @param categoryKey  - Key kategori (contoh: "SMA_MALE_SINGLE")
 * @param prisma       - PrismaClient instance
 * @returns Array semua KnockoutMatch yang dibuat
 */
export async function buildBracket(
  seededNames: string[],
  tournamentId: number,
  categoryKey: string,
  prisma: PrismaClient
): Promise<any[]> {
  if (seededNames.length < 2) {
    throw new Error("Minimal 2 peserta diperlukan untuk membuat bracket");
  }

  // 1. Tentukan ukuran bracket (kelipatan 2)
  const bracketSize = getNextPowerOf2(seededNames.length);
  const byesCount = bracketSize - seededNames.length;

  // 2. Padding dengan BYE untuk slot yang kosong
  const participants = [...seededNames];
  for (let i = 0; i < byesCount; i++) {
    participants.push("BYE");
  }

  // 3. Atur posisi sesuai seeding konvensional
  const arrangedIndices = getSeeding(bracketSize);
  const arrangedNames = arrangedIndices.map((idx) => participants[idx]);

  const numRounds = Math.log2(bracketSize);

  // 4. Hapus bracket lama untuk kategori ini
  await prisma.knockoutMatch.deleteMany({
    where: { tournamentId, category: categoryKey },
  });

  // 5. Bangun struktur rounds dari ronde 1 hingga final
  const roundsNodes: Array<
    Array<{
      player1Name: string | null;
      player2Name: string | null;
      status: string;
      winnerName: string | null;
      score1: number | null;
      score2: number | null;
      roundText: string;
      matchOrder: number;
    }>
  > = [];

  // Ronde 1 — isi nama peserta
  const round1Matches = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const p1 = arrangedNames[i];
    const p2 = arrangedNames[i + 1];

    let status = "SCHEDULED";
    let winnerName: string | null = null;

    // BYE: pemenang otomatis
    if (p1 === "BYE") {
      winnerName = p2;
      status = "DONE";
    } else if (p2 === "BYE") {
      winnerName = p1;
      status = "DONE";
    }

    round1Matches.push({
      player1Name: p1,
      player2Name: p2,
      status,
      winnerName,
      score1: null,
      score2: null,
      roundText: getRoundText(bracketSize, 0),
      matchOrder: Math.floor(i / 2),
    });
  }
  roundsNodes.push(round1Matches);

  // Ronde 2 s.d. Final — slot kosong (diisi setelah match selesai)
  for (let round = 1; round < numRounds; round++) {
    const count = bracketSize / Math.pow(2, round + 1);
    const roundMatches = [];
    for (let i = 0; i < count; i++) {
      roundMatches.push({
        player1Name: null,
        player2Name: null,
        status: "SCHEDULED",
        winnerName: null,
        score1: null,
        score2: null,
        roundText: getRoundText(bracketSize, round),
        matchOrder: i,
      });
    }
    roundsNodes.push(roundMatches);
  }

  // 6. Simpan dari Final → Ronde 1 agar bisa assign nextMatchId
  const savedMap = new Map<string, number>(); // "R{r}-M{i}" → DB id

  for (let r = numRounds - 1; r >= 0; r--) {
    const matchesInRound = roundsNodes[r];

    for (let i = 0; i < matchesInRound.length; i++) {
      const mData = matchesInRound[i];

      // Cari nextMatchId (kecuali Final)
      let nextMatchId: number | null = null;
      if (r < numRounds - 1) {
        const parentOrder = Math.floor(i / 2);
        nextMatchId = savedMap.get(`R${r + 1}-M${parentOrder}`) ?? null;
      }

      const saved = await prisma.knockoutMatch.create({
        data: {
          tournamentId,
          category: categoryKey,
          player1Name: mData.player1Name,
          player2Name: mData.player2Name,
          score1: mData.score1,
          score2: mData.score2,
          winnerName: mData.winnerName,
          status: mData.status as any,
          roundText: mData.roundText,
          matchOrder: mData.matchOrder,
          nextMatchId,
        },
      });

      savedMap.set(`R${r}-M${i}`, saved.id);

      // Jika BYE auto-win di ronde 1, propagate winner ke ronde berikutnya
      if (mData.status === "DONE" && mData.winnerName && nextMatchId) {
        const isPlayer1ForNext = i % 2 === 0;
        await prisma.knockoutMatch.update({
          where: { id: nextMatchId },
          data: isPlayer1ForNext
            ? { player1Name: mData.winnerName }
            : { player2Name: mData.winnerName },
        });
      }
    }
  }

  // 7. Return semua match yang tersimpan
  return prisma.knockoutMatch.findMany({
    where: { tournamentId, category: categoryKey },
    orderBy: { id: "asc" },
  });
}
