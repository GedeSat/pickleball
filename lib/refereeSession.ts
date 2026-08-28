// ============================================================
// SESSION WASIT — utils untuk membaca/menyimpan sesi login wasit
// di localStorage. Dipakai oleh halaman login (app/wasit) dan
// portal wasit (app/wasit/portal).
//
// Struktur sesi:
// {
//   refereeName: string,   // Nama wasit
//   refereeCode: string,   // Kode akses turnamen (1 kode per turnamen)
//   tournamentId: string,  // ID turnamen yang berhasil login
//   loginAt: string        // Timestamp ISO kapan login
// }
// ============================================================

export const WASIT_SESSION_KEY = "wasit-session";

export interface RefereeSession {
  refereeName: string;
  refereeCode: string;
  tournamentId: string;
  loginAt: string;
}

// Simpan sesi login wasit ke localStorage
export function saveRefereeSession(session: RefereeSession): void {
  localStorage.setItem(WASIT_SESSION_KEY, JSON.stringify(session));
}

// Baca sesi wasit dari localStorage — kembalikan null jika tidak ada / tidak valid
export function getRefereeSession(): RefereeSession | null {
  try {
    const raw = localStorage.getItem(WASIT_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RefereeSession>;
    if (!parsed.refereeName || !parsed.refereeCode || !parsed.tournamentId) {
      return null;
    }

    return {
      refereeName: String(parsed.refereeName),
      refereeCode: String(parsed.refereeCode),
      tournamentId: String(parsed.tournamentId),
      loginAt: parsed.loginAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Hapus sesi wasit (logout / ganti wasit)
export function clearRefereeSession(): void {
  localStorage.removeItem(WASIT_SESSION_KEY);
}