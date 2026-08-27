import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Gender, MatchType } from '@prisma/client';
import { buildCategoryInfo } from '@/lib/tournamentCategory';
import { categoryKeyToLabel } from '@/lib/categoryLabel';
import PoolManagerClient, {
  PoolManagerCategory,
} from './PoolManagerClient';

function parseCategoryKey(key: string): {
  grade: string;
  gender: Gender | null;
  matchType: MatchType;
} {
  const parts = key.split('_');
  const grade = parts[0] ?? '';
  const matchType: MatchType =
    parts[2] === 'SINGLE' || parts[2] === 'DOUBLE' ? parts[2] : 'MIXED';
  const gender: Gender | null =
    parts[1] === 'MALE' || parts[1] === 'FEMALE' ? parts[1] : null;
  return { grade, gender, matchType };
}

export default async function PoolManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) notFound();

  const [pools, players, teams] = await Promise.all([
    prisma.pool.findMany({
      where: { tournamentId },
      include: {
        members: {
          include: { player: true, team: true },
          orderBy: { id: 'asc' },
        },
        matches: {
          include: { member1: true, member2: true },
          orderBy: { matchOrder: 'asc' },
        },
      },
      orderBy: [{ categoryKey: 'asc' }, { poolCode: 'asc' }],
    }),
    prisma.player.findMany({
      where: { tournamentId },
      include: { poolMembers: true },
      orderBy: { fullName: 'asc' },
    }),
    prisma.team.findMany({
      where: { tournamentId },
      include: { poolMembers: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Kumpulan kategori: dari pool, team, dan player SINGLE
  const categoryKeys = new Set<string>();
  for (const p of pools) categoryKeys.add(p.categoryKey);
  for (const t of teams) categoryKeys.add(t.categoryKey);
  for (const pl of players) {
    if (pl.teamId != null) continue;
    try {
      categoryKeys.add(buildCategoryInfo(pl.grade, pl.gender, pl.matchType).key);
    } catch {
      // abaikan player dengan kombinasi kategori tidak sah
    }
  }

  // Semua player/team yang sudah ditempatkan (untuk daftar "belum masuk")
  const assignedPlayerIds = new Set<number>();
  const assignedTeamIds = new Set<number>();
  for (const pool of pools) {
    for (const m of pool.members) {
      if (m.playerId) assignedPlayerIds.add(m.playerId);
      if (m.teamId) assignedTeamIds.add(m.teamId);
    }
  }

  const categories: PoolManagerCategory[] = [...categoryKeys]
    .filter((k) => k.trim() !== '')
    .sort()
    .map((categoryKey) => {
      const parts = parseCategoryKey(categoryKey);
      const catPools = pools
        .filter((p) => p.categoryKey === categoryKey)
        .map((p) => ({
          id: p.id,
          label: p.label,
          poolCode: p.poolCode,
          maxSize: p.maxSize,
          status: p.status,
          memberCount: p.members.length,
          members: [...p.members]
            .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
            .map((m) => ({
              id: m.id,
              memberName: m.memberName,
              playerId: m.playerId,
              teamId: m.teamId,
              rank: m.rank,
              played: m.played,
              wins: m.wins,
              losses: m.losses,
              pointsFor: m.pointsFor,
              pointsAgainst: m.pointsAgainst,
              pointDiff: m.pointDiff,
            })),
          matches: p.matches.map((m) => ({
            id: m.id,
            member1Id: m.member1.id,
            member2Id: m.member2.id,
            member1Name: m.member1.memberName,
            member2Name: m.member2.memberName,
            score1: m.score1,
            score2: m.score2,
            status: m.status,
            winnerId: m.winnerId,
            winnerName: m.winnerName,
          })),
        }));

      const unassigned: PoolManagerCategory['unassigned'] = [];
      for (const pl of players) {
        if (pl.teamId != null) continue;
        if (assignedPlayerIds.has(pl.id)) continue;
        let key = '';
        try {
          key = buildCategoryInfo(pl.grade, pl.gender, pl.matchType).key;
        } catch {
          continue;
        }
        if (key !== categoryKey) continue;
        unassigned.push({
          id: pl.id,
          type: 'PLAYER',
          name: pl.fullName,
          paymentStatus: pl.paymentStatus,
          paymentMethod: pl.paymentMethod,
        });
      }
      for (const t of teams) {
        if (assignedTeamIds.has(t.id)) continue;
        if (t.categoryKey !== categoryKey) continue;
        unassigned.push({
          id: t.id,
          type: 'TEAM',
          name: t.name,
          paymentStatus: t.paymentStatus,
          paymentMethod: t.paymentMethod,
        });
      }

      return {
        categoryKey,
        label: categoryKeyToLabel(categoryKey) || categoryKey,
        grade: parts.grade,
        gender: parts.gender,
        matchType: parts.matchType,
        pools: catPools,
        unassigned,
      };
    });

  // Statistik ringkas untuk scoreboard di header
  const totalPools = pools.length;
  const totalUnassigned = categories.reduce(
    (sum, c) => sum + c.unassigned.length,
    0
  );
  const totalPlaced = pools.reduce((sum, p) => sum + p.members.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb */}
      <Link
        href={`/admin/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <span aria-hidden className="text-base leading-none">←</span>
        Kembali ke Detail Turnamen
      </Link>

      {/* Hero: scoreboard header */}
      <div className="relative overflow-hidden rounded-3xl bg-brand text-[#ffffff] shadow-xl shadow-brand/20">
        {/* garis-garis lapangan sebagai motif dekoratif */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 39px, #FBBF24 39px, #FBBF24 40px)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold opacity-10 blur-3xl"
        />

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FBBF24] ring-1 ring-[rgba(255,255,255,0.1)]">
                Manajemen Pool
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {tournament.name}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.7)] sm:text-[15px]">
                Buat pool, tempatkan peserta setelah TM / pengundian, lalu
                generate pertandingan. Maksimal{' '}
                <span className="font-mono font-semibold text-[#FBBF24]">
                  {tournament.poolSize}
                </span>{' '}
                peserta per pool.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-2 to-brand text-2xl shadow-inner ring-1 ring-[rgba(255,255,255,0.1)]">
              🏓
            </div>
          </div>

          {/* Scoreboard stats */}
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Kategori', value: categories.length },
              { label: 'Pool Dibuat', value: totalPools },
              { label: 'Sudah Ditempatkan', value: totalPlaced },
              { label: 'Belum Ditempatkan', value: totalUnassigned },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-[rgba(255,255,255,0.06)] px-4 py-3 ring-1 ring-[rgba(255,255,255,0.1)] backdrop-blur-sm"
              >
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#ffffff]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Section label */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Kategori Turnamen
        </h2>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <PoolManagerClient
        tournament={{ id: tournament.id, name: tournament.name, poolSize: tournament.poolSize }}
        categories={categories}
      />
    </div>
  );
}