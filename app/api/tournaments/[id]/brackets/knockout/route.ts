import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/apiResponse";

// Fungsi untuk menentukan jumlah kelipatan 2 pembentuk bracket (2, 4, 8, 16...)
function getNextPowerOf2(num: number) {
  let power = 2;
  while (power < num) {
    power *= 2;
  }
  return power;
}

// GET: Fetch semua knockout matches untuk suatu turnamen & kategori
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  if (!category) {
    return Response.json({ error: "Category wajib diisi" }, { status: 400 });
  }

  try {
    const matches = await prisma.knockoutMatch.findMany({
      where: {
        tournamentId: Number(id),
        category,
      },
      orderBy: { id: "asc" },
    });

    return successResponse("Data knockout matches berhasil diambil 📅", matches);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal memuat knockout matches ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// POST: Generate Knockout Bracket dari Juara & Runner-Up Group
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournamentId = Number(id);

  try {
    const body = await req.json();
    const { category } = body;

    if (!category) {
      return errorResponse("Category wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    // 1. Ambil Juara 1 dan 2 dari setiap grup dalam kategori tersebut
    const groups = await prisma.tournamentGroup.findMany({
      where: { tournamentId, category },
      include: {
        members: {
          where: {
            rank: { in: [1, 2] },
          },
        },
      },
    });

    let qualifiedPlayers = groups.flatMap((g) => g.members);

    if (qualifiedPlayers.length < 2) {
      return errorResponse("Minimal butuh 2 pemain (juara) untuk fase knockout ⚠️", 400, "BAD_REQUEST");
    }

    // 2. Ranking ulang peserta: Utamakan Rank 1 (Juara Grup), lalu wins, pointDiff, pointsFor
    qualifiedPlayers.sort((a, b) => {
      // rank asc (1 lebih tinggi dari 2)
      if ((a.rank || 99) !== (b.rank || 99)) return (a.rank || 99) - (b.rank || 99);
      // wins desc
      if (b.wins !== a.wins) return b.wins - a.wins;
      // point diff desc
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      // points for desc
      return b.pointsFor - a.pointsFor;
    });

    // Extract names, already in seeded order (index 0 is highest seed)
    const seededNames = qualifiedPlayers.map((p) => p.playerName);

    // 3. Tentukan ukuran bracket standar (2, 4, 8, 16)
    const bracketSize = getNextPowerOf2(seededNames.length);
    const byesCount = bracketSize - seededNames.length;

    // Masukkan "BYE" ke slot bawah (pemain-pemain seed teratas tidak perlu lawan di ronde 1) 
    // Kita padding array hingga bracketSize
    const participants = [...seededNames];
    for (let i = 0; i < byesCount; i++) {
        participants.push("BYE"); 
    }

    // 4. Seeding konvensional untuk mempertemukan seed tinggi vs rendah di bracket
    const seeds = Array.from({ length: bracketSize }, (_, i) => i);
    // Algoritma recursive standard untuk bracket seeding 1 vs 8, 2 vs 7 dst
    function getSeeding(numPlayers: number): number[] {
      let rounds = Math.log2(numPlayers);
      let pls = [0, 1];
      for (let i = 1; i < rounds; i++) {
        const nextRound = [];
        let length = pls.length * 2;
        for (let j = 0; j < pls.length; j++) {
          nextRound.push(pls[j]);
          nextRound.push(length - 1 - pls[j]);
        }
        pls = nextRound;
      }
      return pls;
    }
    const arrangedIndices = getSeeding(bracketSize);
    const arrangedNames = arrangedIndices.map((idx) => participants[idx]);

    // 5. Bersihkan data knockout lama untuk turnamen dan kategori ini
    await prisma.knockoutMatch.deleteMany({
      where: { tournamentId, category },
    });

    // 6. Buat bagan dari Putaran Pertama hingga Final
    // Kita buat array node untuk match
    const numRounds = Math.log2(bracketSize);
    
    // Struktur node per ronde
    let roundsNodes: any[][] = [];
    
    // Ronde 1 (Putaran Pertama)
    const round1Matches = [];
    for (let i = 0; i < bracketSize; i += 2) {
      const p1 = arrangedNames[i];
      const p2 = arrangedNames[i + 1];
      
      // Jika salah satu BYE, pemenang otomatis adalah yang bukan BYE
      let status = "SCHEDULED";
      let winnerName = null;
      let score1 = null;
      let score2 = null;

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
        score1,
        score2,
        roundText: bracketSize === 2 ? "Final" : bracketSize === 4 ? "Semi Final" : bracketSize === 8 ? "Perempat Final" : "Ronde 1",
        matchOrder: Math.floor(i / 2),
      });
    }
    roundsNodes.push(round1Matches);

    // Ronde 2 s/d Final
    for (let round = 1; round < numRounds; round++) {
      const currentRoundMatchesCount = bracketSize / Math.pow(2, round + 1);
      const isFinal = currentRoundMatchesCount === 1;
      const isSemi = currentRoundMatchesCount === 2;
      const roundMatches = [];

      for (let i = 0; i < currentRoundMatchesCount; i++) {
        roundMatches.push({
          player1Name: null,
          player2Name: null,
          status: "SCHEDULED",
          winnerName: null,
          score1: null,
          score2: null,
          roundText: isFinal ? "Final" : isSemi ? "Semi Final" : `Ronde ${round + 1}`,
          matchOrder: i,
        });
      }
      roundsNodes.push(roundMatches);
    }

    // 7. Simpan semua dari Final (ronda paling akhir) mundur ke depan, agar kita bisa assign nextMatchId
    const savedMatchesMapping = new Map(); // Untuk simpan ID match biar bisa connect dari child parent

    for (let r = numRounds - 1; r >= 0; r--) {
        const matchesInRound = roundsNodes[r];
        
        for (let i = 0; i < matchesInRound.length; i++) {
             const mData = matchesInRound[i];
             
             // Cari nextMatchId kalau bukan final
             let nextMatchId = null;
             if (r < numRounds - 1) {
                 // Match parent (ronde selanjutnya) ada di index = Math.floor(i/2)
                 const parentMatchOrder = Math.floor(i / 2);
                 const parentKey = `R${r+1}-M${parentMatchOrder}`;
                 nextMatchId = savedMatchesMapping.get(parentKey);
             }

             // Simpan DB
             const saved = await prisma.knockoutMatch.create({
                 data: {
                     tournamentId,
                     category,
                     player1Name: mData.player1Name,
                     player2Name: mData.player2Name,
                     score1: mData.score1,
                     score2: mData.score2,
                     winnerName: mData.winnerName,
                     status: mData.status as any,
                     roundText: mData.roundText,
                     matchOrder: mData.matchOrder,
                     nextMatchId: nextMatchId,
                 }
             });

             // Jika map belum ada
             savedMatchesMapping.set(`R${r}-M${i}`, saved.id);

             // Jika ini adalah ronde 1 dan menang otomatis (karena musuh BYE), 
             // kita perlu update nextMatchId player-nya
             if (mData.status === "DONE" && mData.winnerName && nextMatchId) {
                 const isPlayer1ForNext = i % 2 === 0;
                 await prisma.knockoutMatch.update({
                     where: { id: nextMatchId },
                     data: isPlayer1ForNext 
                         ? { player1Name: mData.winnerName } 
                         : { player2Name: mData.winnerName }
                 });
             }
        }
    }

    const finalMatches = await prisma.knockoutMatch.findMany({
      where: { tournamentId, category },
      orderBy: { id: "asc" },
    });

    return successResponse("Bracket knockout berhasil digenerate 🏆", finalMatches, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal generate bracket knockout ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// PUT: Update Nama Pemain (manual edit) atau Input Skor
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { matchId, player1Name, player2Name, score1, score2, reset, refereeName } = body;

    if (!matchId) {
      return errorResponse("matchId wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    const matchBefore = await prisma.knockoutMatch.findUnique({ where: { id: Number(matchId) } });
    if (!matchBefore) return errorResponse("Match tidak ditemukan 🔍", 404, "NOT_FOUND");

    // Jika admin hanya merubah nama manual di bracket
    if (player1Name !== undefined || player2Name !== undefined) {
         const dataUpdate: any = {};
         if (player1Name !== undefined) dataUpdate.player1Name = player1Name || null;
         if (player2Name !== undefined) dataUpdate.player2Name = player2Name || null;
         await prisma.knockoutMatch.update({ where: { id: matchBefore.id }, data: dataUpdate });
         return successResponse("Nama pemain berhasil diupdate 📝");
    }

    // Jika admin me-reset skor
    if (reset) {
        await prisma.knockoutMatch.update({
            where: { id: matchBefore.id },
            data: {
                 score1: null,
                 score2: null,
                 winnerName: null,
                 refereeName: null,
                 status: "SCHEDULED"
            }
        });
        // Kosongkan dari match selanjutnya
        if (matchBefore.nextMatchId && matchBefore.winnerName) {
            const nextM = await prisma.knockoutMatch.findUnique({ where: { id: matchBefore.nextMatchId }});
            if (nextM) {
                if (nextM.player1Name === matchBefore.winnerName) {
                    await prisma.knockoutMatch.update({ where: { id: matchBefore.nextMatchId }, data: { player1Name: null }});
                } else if (nextM.player2Name === matchBefore.winnerName) {
                    await prisma.knockoutMatch.update({ where: { id: matchBefore.nextMatchId }, data: { player2Name: null }});
                }
            }
        }
        return successResponse("Skor berhasil direset 🔄");
    }

    const s1 = Number(score1);
    const s2 = Number(score2);

    const winner = s1 > s2 ? matchBefore.player1Name : s2 > s1 ? matchBefore.player2Name : null;

    if (!winner) {
        return errorResponse("Skor tidak boleh seri untuk pertandingan sistem gugur ⚠️", 400, "BAD_REQUEST");
    }

    // Update match dengan refereeName
    await prisma.knockoutMatch.update({
      where: { id: Number(matchId) },
      data: {
        score1: s1,
        score2: s2,
        winnerName: winner,
        refereeName: refereeName?.trim() || "Admin",
        status: "DONE",
      },
    });

    // Pindahkan winner ke match selanjutnya (kalau ada)
    if (matchBefore.nextMatchId) {
        const isPlayer1Pos = matchBefore.matchOrder % 2 === 0;
        
        await prisma.knockoutMatch.update({
             where: { id: matchBefore.nextMatchId },
             data: isPlayer1Pos ? { player1Name: winner } : { player2Name: winner }
        });
    }

    return successResponse("Match berhasil diupdate 📝");
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal update match ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

