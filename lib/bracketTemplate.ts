/**
 * lib/bracketTemplate.ts
 * ============================================================
 * Bagan knockout TEMPLATE: dibangun SEBELUM fase grup selesai.
 *
 * Slot bagan diisi token peringkat ("@@A:1@@" = Peringkat 1 Pool A),
 * sehingga peserta bisa melihat jalur bagan lebih awal. Ketika
 * peringkat pool sudah dihitung (fase grup selesai), token di-resolve
 * menjadi nama asli secara otomatis (fillBracketFromPools).
 *
 * Dipakai oleh:
 * - /api/tournaments/[id]/pools/[poolId]/bracket (template + fill)
 * - /api/tournaments/[id]/pools/[poolId]/matches (auto-fill saat skor)
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { buildBracket } from "./bracketGenerator";
import { formatSlotToken, parseSlotToken } from "./bracketSlot";

/**
 * Revalidate halaman yang menampilkan bagan (admin & publik).
 */
export function revalidateBracketViews(tournamentId: number) {
  revalidatePath(`/admin/tournaments/${tournamentId}/brackets`);
  revalidatePath(`/admin/tournaments/${tournamentId}/pools`);
  revalidatePath(`/tournament/${tournamentId}/bracket`);
  revalidatePath(`/tournament/${tournamentId}/schedule`);
}

/**
 * Bangun bracket TEMPLATE dari daftar slot.
 *
 * @param slots - Array token slot, mis. ["@@A:1@@", "@@B:1@@", "@@A:2@@", "@@B:2@@", "BYE", ...]
 *                "BYE" untuk slot kosong. Urutan = urutan seed (posisi di bagan).
 */
export async function buildTemplateBracket(
  prisma: PrismaClient,
  tournamentId: number,
  categoryKey: string,
  slots: string[]
) {
  const realSlots = slots.filter((s) => s !== "BYE");
  if (realSlots.length < 2) {
    throw new Error("Minimal 2 slot harus diisi untuk membuat bagan");
  }

  // Validasi format token
  for (const s of realSlots) {
    if (!parseSlotToken(s)) {
      throw new Error(`Slot tidak valid: ${s}`);
    }
  }

  // buildBracket menangani BYE padding + seeding + nextMatchId secara otomatis
  return buildBracket(slots, tournamentId, categoryKey, prisma);
}

/**
 * Isi otomatis slot bertoken dengan nama member sesuai peringkat pool.
 *
 * Untuk setiap slot "@@A:1@@" → cari PoolMember di pool dengan poolCode "A"
 * yang memiliki rank 1. Jika ditemukan, playerName diganti nama asli.
 *
 * @returns Jumlah nama yang berhasil di-resolve
 */
export async function fillBracketFromPools(
  prisma: PrismaClient,
  tournamentId: number,
  categoryKey: string
): Promise<number> {
  // Ambil semua pool dalam kategori ini beserta member-nya
  const pools = await prisma.pool.findMany({
    where: { tournamentId, categoryKey },
    include: { members: true },
  });

  if (pools.length === 0) return 0;

  // Map "poolCode:rank" → memberName (hanya member dengan rank terisi)
  const memberBySlot = new Map<string, string>();
  for (const pool of pools) {
    const code = pool.poolCode;
    for (const m of pool.members) {
      if (m.rank == null || m.rank < 1) continue;
      memberBySlot.set(formatSlotToken(code, m.rank), m.memberName);
    }
  }

  // Ambil semua match knockout kategori ini
  const matches = await prisma.knockoutMatch.findMany({
    where: { tournamentId, category: categoryKey },
  });

  let filledCount = 0;
  for (const match of matches) {
    const updates: Record<string, string> = {};

    const p1 = parseSlotToken(match.player1Name);
    if (p1) {
      const name = memberBySlot.get(formatSlotToken(p1.poolCode, p1.rank));
      if (name) {
        updates.player1Name = name;
        filledCount++;
      }
    }

    const p2 = parseSlotToken(match.player2Name);
    if (p2) {
      const name = memberBySlot.get(formatSlotToken(p2.poolCode, p2.rank));
      if (name) {
        updates.player2Name = name;
        filledCount++;
      }
    }

    // Match BYE yang sudah DONE menyimpan token di winnerName — resolve juga
    const w = parseSlotToken(match.winnerName);
    if (w) {
      const name = memberBySlot.get(formatSlotToken(w.poolCode, w.rank));
      if (name) {
        updates.winnerName = name;
        filledCount++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.knockoutMatch.update({
        where: { id: match.id },
        data: updates,
      });
    }
  }

  if (filledCount > 0) {
    revalidateBracketViews(tournamentId);
  }

  return filledCount;
}
