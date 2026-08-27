/**
 * lib/bracketSlot.ts
 * ============================================================
 * Helper MURNI (tanpa dependensi server) untuk slot bagan knockout.
 * Aman diimport dari komponen Client.
 *
 * Slot yang belum terisi nama (sebelum fase grup selesai) disimpan
 * sebagai token di kolom player1Name / player2Name:
 *
 *   "@@A:1@@"  → "Peringkat 1 • Pool A"
 *   "@@B:2@@"  → "Peringkat 2 • Pool B"
 *
 * Saat fase grup selesai, token di-resolve menjadi nama asli
 * (lihat lib/bracketTemplate.ts → fillBracketFromPools).
 * ============================================================
 */

export type SlotToken = {
  poolCode: string;
  rank: number;
};

const TOKEN_RE = /^@@([A-Za-z0-9]+):(\d+)@@$/;

/** Format token slot: "@@A:1@@" (Pool A, Peringkat 1) */
export function formatSlotToken(poolCode: string, rank: number): string {
  return `@@${poolCode}:${rank}@@`;
}

/** Parse token menjadi { poolCode, rank }; null bila bukan token */
export function parseSlotToken(name: string | null | undefined): SlotToken | null {
  if (!name) return null;
  const m = TOKEN_RE.exec(name.trim());
  if (!m) return null;
  return { poolCode: m[1], rank: Number(m[2]) };
}

/** true bila nama berupa token slot yang belum terisi */
export function isSlotToken(name: string | null | undefined): boolean {
  return parseSlotToken(name) !== null;
}

/** Label ramah pengguna: "@@A:1@@" → "Juara Pool A" */
export function slotTokenToLabel(name: string | null | undefined): string | null {
  const t = parseSlotToken(name);
  if (!t) return null;
  if (t.rank === 1) return `Juara Pool ${t.poolCode}`;
  if (t.rank === 2) return `Runner-up Pool ${t.poolCode}`;
  return `Peringkat ${t.rank} • Pool ${t.poolCode}`;
}

/** Nama tampilan aman untuk bagan: label token / nama asli / Menunggu */
export function displayParticipantName(
  name: string | null | undefined
): string {
  return slotTokenToLabel(name) ?? name ?? 'Menunggu';
}