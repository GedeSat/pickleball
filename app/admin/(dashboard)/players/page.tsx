import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PlayerTableClient, { PlayerRow, TournamentGroup } from "./PlayerTableClient";


export default async function PlayerListPage() {
  const players = await prisma.player.findMany({
    include: {
      team: { include: { players: true } },
      tournament: { select: { id: true, name: true, registrationFee: true, status: true } },
    },
    orderBy: { id: "desc" },
  });

  // Group rows by tournament
  const tournamentMap = new Map<number, { name: string; status: string; rows: PlayerRow[] }>();
  const seenTeams = new Set<number>();

  for (const p of players) {
    const tId = p.tournament.id;

    if (!tournamentMap.has(tId)) {
      tournamentMap.set(tId, {
        name: p.tournament.name,
        status: p.tournament.status,
        rows: [],
      });
    }

    const bucket = tournamentMap.get(tId)!;

    if (p.teamId && p.team) {
      if (seenTeams.has(p.teamId)) continue;
      seenTeams.add(p.teamId);
      const members = p.team.players;
      bucket.rows.push({
        key: `team-${p.teamId}`,
        name: p.team.name,
        members: members.map((m) => `${m.gender === 'MALE' ? '👦' : '👧'} ${m.fullName}`),
        grade: p.team.grade,
        gender: members[0]?.gender ?? null,
        matchType: p.team.matchType,
        school: [...new Set(members.map((m) => m.schoolName))].join(' • '),
        phone: [...new Set(members.map((m) => m.phoneNumber))].join(' • '),
        isTeam: true,
        memberIds: members.map((m) => m.id),
        teamId: p.team.id,
        registrationFee: p.tournament.registrationFee,
        paymentMethod: p.team.paymentMethod ?? null,
        paymentStatus: p.team.paymentStatus ?? null,
        paymentProof: p.team.paymentProof ?? null,
      });
    } else {
      bucket.rows.push({
        key: `player-${p.id}`,
        name: p.fullName,
        members: [],
        grade: p.grade,
        gender: p.gender,
        matchType: p.matchType,
        school: p.schoolName,
        phone: p.phoneNumber,
        isTeam: false,
        memberIds: [p.id],
        teamId: null,
        registrationFee: p.tournament.registrationFee,
        paymentMethod: p.paymentMethod ?? null,
        paymentStatus: p.paymentStatus ?? null,
        paymentProof: p.paymentProof ?? null,
      });
    }
  }

  const tournamentGroups: TournamentGroup[] = Array.from(tournamentMap.entries()).map(
    ([id, data]) => ({
      tournamentId: id,
      tournamentName: data.name,
      tournamentStatus: data.status,
      rows: data.rows,
    })
  );

  const totalPlayers = tournamentGroups.reduce((sum, g) => sum + g.rows.length, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-amber-500 rounded-2xl flex items-center justify-center text-[#ffffff] text-2xl shadow-lg shadow-primary-800/30">
            👥
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Pemain</h1>
            <p className="text-slate-500 text-sm mt-1">
              Kelola data {totalPlayers} peserta dari {tournamentGroups.length} turnamen.
            </p>
          </div>
        </div>

        <Link 
          href="/admin" 
          className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 font-semibold transition-all shadow-sm active:scale-95"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      <PlayerTableClient tournamentGroups={tournamentGroups} />
    </div>
  );
}
