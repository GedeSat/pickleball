import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ScheduleEditor from "./ScheduleEditor";
import ScheduleExportButtons from "./ScheduleExportButtons";


export default async function AdminScheduleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      pools: {
        include: {
          members: {
            include: { player: true, team: { include: { players: true } } },
          },
          matches: {
            select: {
              id: true,
              poolId: true,
              court: true,
              startTime: true,
              score1: true,
              score2: true,
              status: true,
              member1: {
                select: {
                  player: { select: { fullName: true } },
                  team: { select: { name: true } },
                },
              },
              member2: {
                select: {
                  player: { select: { fullName: true } },
                  team: { select: { name: true } },
                },
              },
            },
            orderBy: { matchOrder: "asc" },
          },
        },
        orderBy: { id: "asc" },
      },
      knockoutMatches: {
        select: {
          id: true,
          category: true,
          roundText: true,
          court: true,
          startTime: true,
          score1: true,
          score2: true,
          status: true,
          player1Name: true,
          player2Name: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!tournament) return notFound();

  // Nama peserta dari relasi member -> player/team (PoolMatch tidak menyimpan nama)
  const memberName = (m: {
    player: { fullName: string } | null;
    team: { name: string } | null;
  } | null): string | null => {
    if (!m) return null;
    return m.player?.fullName ?? m.team?.name ?? null;
  };

  const poolMatches = tournament.pools.flatMap((pool) =>
    pool.matches.map((m) => ({
      type: "pool" as const,
      id: m.id,
      court: m.court,
      startTime: m.startTime ? m.startTime.toISOString() : null,
      score1: m.score1,
      score2: m.score2,
      status: m.status,
      player1Name: memberName(m.member1),
      player2Name: memberName(m.member2),
      groupName: pool.label,
      category: pool.categoryKey,
    }))
  );

  const knockoutMatches = tournament.knockoutMatches.map((k) => ({
    type: "knockout" as const,
    id: k.id,
    court: k.court,
    startTime: k.startTime ? k.startTime.toISOString() : null,
    score1: k.score1,
    score2: k.score2,
    status: k.status,
    player1Name: k.player1Name,
    player2Name: k.player2Name,
    groupName: `Gugur ${k.roundText}`,
    category: k.category,
  }));

  const matches = [...poolMatches, ...knockoutMatches];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/schedule"
            className="text-sm text-primary-700 hover:underline font-semibold inline-block mb-2"
          >
            &larr; Kembali ke Daftar Turnamen
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            📅 Atur Jadwal — {tournament.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {matches.length} pertandingan (pool + gugur). Isi nomor lapangan & waktu,
            lalu klik Simpan.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ScheduleExportButtons tournamentName={tournament.name} matches={matches} />
          <a
            href={`/tournament/${tournamentId}/schedule`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2.5"
          >
            Lihat Halaman Publik ↗
          </a>
        </div>
      </div>

      <ScheduleEditor tournamentId={tournamentId} matches={matches} />
    </div>
  );
}
