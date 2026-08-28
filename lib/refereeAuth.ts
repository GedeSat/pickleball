// ============================================================
// Server-only: verifikasi akses wasit terhadap sebuah turnamen.
// Dipakai oleh route login (/api/wasit/login) DAN oleh route
// update skor agar wasit selalu divalidasi ulang (refereeCode +
// tournamentId) sebelum menyimpan skor.
//
// PENTING: modul ini mengimpor prisma, JANGAN diimpor dari
// komponen client.
// ============================================================

import { prisma } from "@/lib/prisma";

export interface RefereeAccessOk {
  ok: true;
  tournament: {
    id: number;
    name: string;
    status: string;
  };
}

export interface RefereeAccessFail {
  ok: false;
  message: string;
  status?: number;
}

export type RefereeAccessResult = RefereeAccessOk | RefereeAccessFail;

// Verifikasi bahwa sebuah kode akses milik turnamen tertentu dan sedang aktif.
export async function verifyRefereeAccess(
  refereeCode: string,
  tournamentId: number
): Promise<RefereeAccessResult> {
  if (!refereeCode || !tournamentId) {
    return {
      ok: false,
      message: "Sesi wasit tidak valid. Silakan login ulang.",
      status: 401,
    };
  }

  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      refereeCode: refereeCode.trim(),
      deletedAt: null,
    },
    select: { id: true, name: true, status: true, isCodeActive: true },
  });

  if (!tournament) {
    return {
      ok: false,
      message: "Kode akses tidak valid untuk turnamen ini.",
      status: 403,
    };
  }

  if (!tournament.isCodeActive) {
    return {
      ok: false,
      message: "Kode akses wasit untuk turnamen ini sudah dinonaktifkan.",
      status: 403,
    };
  }

  return { ok: true, tournament };
}