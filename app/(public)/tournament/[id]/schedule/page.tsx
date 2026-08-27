import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ScheduleClient from "./ScheduleClient";
import LiveScorePoller from "@/components/LiveScorePoller";


export default async function PublicSchedulePage({
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
            include: {
              player: true,
              team: { include: { players: true } },
            },
          },
          matches: {
            include: {
              member1: { include: { player: true, team: { include: { players: true } } } },
              member2: { include: { player: true, team: { include: { players: true } } } },
            },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { id: "asc" },
      },
      groups: {
        include: {
          members: { orderBy: { seedOrder: "asc" } },
          matches: { orderBy: { id: "asc" } },
        },
        orderBy: { id: "asc" },
      },
      knockoutMatches: { orderBy: { id: "asc" } },
    },
  });

  if (!tournament) return notFound();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href={`/tournament/${tournamentId}`}
          className="text-primary-700 dark:text-primary-300 font-semibold text-sm hover:underline inline-block"
        >
          &larr; Kembali ke Detail Turnamen
        </Link>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100">
                📅 Jadwal & Klasemen — {tournament.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Jadwal tanding, nomor lapangan, dan update poin klasemen real-time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <LiveScorePoller />
              <Link
                href={`/tournament/${tournamentId}/bracket`}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                Lihat Bagan Gugur 🏆
              </Link>
            </div>
          </div>
        </div>

        <ScheduleClient tournament={tournament} />
      </div>
    </main>
  );
}
