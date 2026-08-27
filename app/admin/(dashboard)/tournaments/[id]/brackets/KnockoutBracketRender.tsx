"use client";

import React, { useState } from "react";
import { showWarning, showInfo, showConfirm } from "@/lib/swal";
import dynamic from "next/dynamic";
import { KnockoutMatch } from "./BracketClient"; // Will add type export soon
import { displayParticipantName, slotTokenToLabel } from "@/lib/bracketSlot";

// Gunakan dynamic import karena lib ini sering error kalau di render di server
const SingleEliminationBracket = dynamic(
  // @ts-ignore
  () => import("@g-loot/react-tournament-brackets").then((mod) => mod.SingleEliminationBracket),
  { ssr: false }
);

const Match = dynamic(
  // @ts-ignore
  () => import("@g-loot/react-tournament-brackets").then((mod) => mod.Match),
  { ssr: false }
);

interface Props {
  matches: any[];
  onUpdateScore?: (matchId: number, score1: string, score2: string) => void;
  onResetMatch?: (matchId: number) => void;
  onEditName?: (matchId: number, pNum: 1 | 2, currentName: string) => void;
}

export default function KnockoutBracketRender({ matches, onUpdateScore, onResetMatch, onEditName }: Props) {
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [tempScore1, setTempScore1] = useState("");
  const [tempScore2, setTempScore2] = useState("");

  // Map db matches to g-loot bracket format
  const mappedMatches = matches.map((m) => {
    return {
      id: m.id,
      name: m.roundText,
      nextMatchId: m.nextMatchId,
      tournamentRoundText: m.roundText,
      state: m.status === "DONE" ? "DONE" : "SCHEDULED",
      originalMatch: m, // simpan data aslinya
      participants: [
        {
          id: `p1-${m.id}`,
          resultText: m.score1 !== null ? String(m.score1) : null,
          isWinner: (m.status === "DONE" && m.winnerName === m.player1Name) ? ("true" as any) : undefined,
          status: null,
          name: displayParticipantName(m.player1Name),
        },
        {
          id: `p2-${m.id}`,
          resultText: m.score2 !== null ? String(m.score2) : null,
          isWinner: (m.status === "DONE" && m.winnerName === m.player2Name) ? ("true" as any) : undefined,
          status: null,
          name: displayParticipantName(m.player2Name),
        },
      ],
    };
  });

  const handleMatchClick = (params: any) => {
    // Kalau no-op (seperti di halaman publik read-only), hentikan interaksi
    if (!onResetMatch || !onUpdateScore) return;

    // Library me-return parameter dalam format { match: {...} } atau sekadar {...}
    const clickedMatch = params?.match || params;
    if (!clickedMatch || !clickedMatch.id) return;

    // Library sering kali membuang properti custom (originalMatch), cari manual pakai ID
    const match = mappedMatches.find((m) => String(m.id) === String(clickedMatch.id));
    if (!match) return;

    if (match.state === "DONE") {
       showConfirm(
         `Skor saat ini ${match.originalMatch.score1} - ${match.originalMatch.score2}. Reset pertandingan ini?`,
         'Reset Pertandingan?',
         'Ya, Reset!'
       ).then((confirmed) => {
         if (confirmed) onResetMatch?.(match.id);
       });
       return;
    }
    
    // Boleh isi skor kalau kedua pemain sudah jelas (bukan Menunggu/null/slot token)
    const p1Unset = !match.originalMatch.player1Name || slotTokenToLabel(match.originalMatch.player1Name) !== null;
    const p2Unset = !match.originalMatch.player2Name || slotTokenToLabel(match.originalMatch.player2Name) !== null;
    if (p1Unset || p2Unset) {
        showWarning("Peserta belum lengkap. Nama akan terisi otomatis setelah fase grup selesai.");
        return;
    }

    // Jika salah satu BYE, ini anomali (karena sistem otomatis mengisi kemenangan bye), 
    // tapi kalau terjadi, cegah edit skor
    if (match.originalMatch.player1Name === "BYE" || match.originalMatch.player2Name === "BYE") {
        showInfo("Peserta ini mendapat BYE (langsung lolos).", "Info Pertandingan");
        return;
    }

    setActiveMatch(match);
    setTempScore1("");
    setTempScore2("");
  };

const handleEditName = (matchId: number, pNum: 1|2, name: string) => {
    if (onEditName) {
        onEditName(matchId, pNum, name === "Menunggu" ? "" : name);
    }
};

 // 1. Definisikan komponen sebagai 'any' di sini untuk mematikan pengecekan TS di JSX
  const BracketComponent = SingleEliminationBracket as any;

  return (
    <div className="bracket-wrapper w-full">
      {/* 2. Panggil BracketComponent, bukan SingleEliminationBracket */}
      <BracketComponent
        matches={mappedMatches}
        matchComponent={({ hovered, topHovered, bottomHovered, ...props }: any) => {
           // Bersihkan SEMUA properti hover agar atribut boolean ini tidak bocor ke elemen DOM TheMatch
           return <Match {...props} />
        }}
        svgWrapper={({ children, hovered, bracketWidth, bracketHeight, startAt, ...props }: any) => (
          <div {...props}>
            {children}
          </div>
        )}
        onMatchClick={handleMatchClick}
        onPartyClick={(party: any) => {
           if (!onEditName) return;

           // Library sering kali menghilangkan properti custom seperti originalMatch,
           // jadi kita cari manual dari state mappedMatches berdasarkan party.id (yang unik)
           const foundMatch = mappedMatches.find(m => m.participants.some(p => p.id === party.id));
           if (foundMatch) {
               const isP1 = foundMatch.participants[0].id === party.id ? 1 : 2;
               onEditName(foundMatch.id, isP1, party.name);
           }
        }}
      />
      {/* Input Score Modal for Knockout */}
      {activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">
              Input Skor Pertandingan
            </h3>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex-1 text-center">
                <p className="font-bold text-slate-800 mb-3 text-sm">
                  {activeMatch.originalMatch.player1Name}
                </p>
                <input
                  type="number"
                  min="0"
                  value={tempScore1}
                  onChange={(e) => setTempScore1(e.target.value)}
                  className="w-20 h-16 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary block mx-auto"
                />
              </div>
              <span className="text-2xl font-bold text-slate-300 mt-6">VS</span>
              <div className="flex-1 text-center">
                <p className="font-bold text-slate-800 mb-3 text-sm">
                  {activeMatch.originalMatch.player2Name}
                </p>
                <input
                  type="number"
                  min="0"
                  value={tempScore2}
                  onChange={(e) => setTempScore2(e.target.value)}
                  className="w-20 h-16 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary block mx-auto"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveMatch(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                   onUpdateScore?.(activeMatch.id, tempScore1, tempScore2);
                   setActiveMatch(null);
                }}
                disabled={tempScore1 === "" || tempScore2 === "" || tempScore1 === tempScore2}
                className="flex-1 px-4 py-3 bg-primary text-[#ffffff] rounded-xl font-semibold hover:bg-primary-hover disabled:opacity-40 transition-all shadow-sm"
              >
                Simpan
              </button>
            </div>
            {tempScore1 !== "" && tempScore2 !== "" && tempScore1 === tempScore2 && (
               <p className="text-red-500 text-xs text-center mt-3">Skor tidak boleh seri di babak gugur.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
