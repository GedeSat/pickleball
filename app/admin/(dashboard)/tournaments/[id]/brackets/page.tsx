import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BracketClient from "./BracketClient";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: { include: { team: true }, orderBy: { seedOrder: "asc" } },
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

  // Kategori yang sudah memakai sistem Pool (group legacy disembunyikan)
  const [poolCategories, pools] = await Promise.all([
    prisma.pool.findMany({
      where: { tournamentId },
      select: { categoryKey: true },
      distinct: ["categoryKey"],
    }),
    prisma.pool.findMany({
      where: { tournamentId },
      include: {
        members: { orderBy: { id: "asc" } },
        matches: {
          include: { member1: true, member2: true },
          orderBy: { matchOrder: "asc" },
        },
      },
      orderBy: [{ categoryKey: "asc" }, { poolCode: "asc" }],
    }),
  ]);

  const initialPools = pools.map((pool) => ({
    id: pool.id,
    label: pool.label,
    poolCode: pool.poolCode,
    categoryKey: pool.categoryKey,
    status: pool.status,
    members: pool.members.map((m) => ({
      id: m.id,
      memberName: m.memberName,
      rank: m.rank,
      played: m.played,
      wins: m.wins,
      losses: m.losses,
      pointsFor: m.pointsFor,
      pointsAgainst: m.pointsAgainst,
      pointDiff: m.pointDiff,
    })),
    matches: pool.matches.map((m) => ({
      id: m.id,
      member1Id: m.member1.id,
      member2Id: m.member2.id,
      score1: m.score1,
      score2: m.score2,
      winnerId: m.winnerId,
      status: m.status,
    })),
  }));

  // Kelompokkan pemain ber-tim (MIXED/DOUBLE) jadi SATU entri per tim,
  // supaya di bagan tim tampil sebagai satu kesatuan (nama tim).
  const initialPlayers = [];
  const seenTeams = new Set<number>();

  for (const p of tournament.players) {
    if (p.teamId) {
      if (seenTeams.has(p.teamId)) continue;
      seenTeams.add(p.teamId);
      const members = tournament.players.filter((m) => m.teamId === p.teamId);
      initialPlayers.push({
        id: p.id,
        fullName: p.team?.name ?? members.map((m) => m.fullName).join(" & "),
        gender: members[0]?.gender ?? p.gender,
        grade: p.grade,
        matchType: p.matchType,
        seedOrder: p.seedOrder,
        isTeam: true,
        memberNames: members.map((m) => m.fullName),
      });
    } else {
      initialPlayers.push({
        id: p.id,
        fullName: p.fullName,
        gender: p.gender,
        grade: p.grade,
        matchType: p.matchType,
        seedOrder: p.seedOrder,
        isTeam: false,
        memberNames: [],
      });
    }
  }

  // Ambil kategori unik dari pemain (berdasarkan kombinasi grade+gender+matchType)
  const categories = [
    ...new Set(initialPlayers.map((p) => {
      if (p.matchType === 'MIXED') return `${p.grade}_MIXED`;
      return `${p.grade}_${p.gender}_${p.matchType}`;
    })),
  ] as string[];

  return (
    <BracketClient
      tournament={tournament}
      initialGroups={tournament.groups}
      initialPlayers={initialPlayers}
      initialKnockout={tournament.knockoutMatches}
      categories={categories}
      poolCategories={poolCategories.map((p) => p.categoryKey)}
      initialPools={initialPools}
    />
  );
}
