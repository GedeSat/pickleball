import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import KnockoutBracketRender from "@/app/admin/(dashboard)/tournaments/[id]/brackets/KnockoutBracketRender";
import { PoolMatrixTable } from "@/app/admin/(dashboard)/tournaments/[id]/pools/PoolBracketMatrix";
import { categoryKeyToLabel } from "@/lib/categoryLabel";
import LiveScorePoller from "@/components/LiveScorePoller";


type PublicPool = {
  id: number;
  label: string;
  poolCode: string;
  categoryKey: string;
  members: Array<{
    id: number;
    memberName: string;
    rank: number | null;
    played: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDiff: number;
  }>;
  matches: Array<{
    id: number;
    member1Id: number;
    member2Id: number;
    score1: number | null;
    score2: number | null;
    winnerId: number | null;
    status: string;
  }>;
};

const ALL_CATEGORY = "all";

export default async function PublicBracketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id } = await params;
  const { category: activeCategoryParam } = await searchParams;
  const tournamentId = Number(id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      groups: {
        include: {
          members: { orderBy: { seedOrder: "asc" } },
          matches: { orderBy: { id: "asc" } },
        },
        orderBy: { id: "asc" },
      },
      pools: {
        include: {
          members: { orderBy: { id: "asc" } },
          matches: { orderBy: { matchOrder: "asc" } },
        },
        orderBy: [{ categoryKey: "asc" }, { poolCode: "asc" }],
      },
      knockoutMatches: { orderBy: { id: "asc" } },
    },
  });

  if (!tournament) return notFound();

  const pools: PublicPool[] = tournament.pools.map((pool) => ({
    id: pool.id,
    label: pool.label,
    poolCode: pool.poolCode,
    categoryKey: pool.categoryKey,
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
      member1Id: m.member1Id,
      member2Id: m.member2Id,
      score1: m.score1,
      score2: m.score2,
      winnerId: m.winnerId,
      status: m.status,
    })),
  }));

  // Kategori sistem Pool (categoryKey) + kategori legacy (nama grup)
  const poolCategories = [
    ...new Set(pools.map((p) => p.categoryKey).filter((k) => k.trim() !== "")),
  ].sort();
  const legacyCategories = [
    ...new Set(
      tournament.groups
        .map((g) => g.category)
        .filter((c) => !poolCategories.includes(c))
    ),
  ] as string[];
  const allCategories = [...poolCategories, ...legacyCategories];

  const categoryLabel = (cat: string) => {
    if (poolCategories.includes(cat)) {
      return categoryKeyToLabel(cat) || cat;
    }
    const labels: Record<string, string> = {
      single: "🏓 Single",
      double: "🏓🏓 Double",
      double_mix: "🏓🏓 Mixed Double",
    };
    return labels[cat] || cat;
  };

  // Kategori aktif dari ?category=... — default tampilkan semua
  const activeCategory =
    activeCategoryParam && allCategories.includes(activeCategoryParam)
      ? activeCategoryParam
      : ALL_CATEGORY;

  const categories =
    activeCategory === ALL_CATEGORY
      ? allCategories
      : allCategories.filter((c) => c === activeCategory);

  if (allCategories.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link
            href={`/tournament/${tournamentId}`}
            className="text-primary-700 dark:text-primary-300 font-semibold text-sm hover:underline mb-6 inline-block"
          >
            &larr; Kembali ke Detail Turnamen
          </Link>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 mt-4">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Bagan Belum Tersedia
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Bagan pertandingan untuk turnamen ini belum disusun oleh panitia.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/tournament/${tournamentId}`}
          className="text-primary-700 dark:text-primary-300 font-semibold text-sm hover:underline mb-6 inline-block"
        >
          &larr; Kembali ke Detail Turnamen
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 mb-2">
              🏆 Bagan {tournament.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Fase Grup (Round-Robin) — Hasil &amp; Klasemen Terkini
            </p>
          </div>
          <LiveScorePoller />
        </div>

        {/* Tab filter kategori */}
        {allCategories.length > 1 && (
          <div className="sticky top-0 z-10 -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 py-3 bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-50/0 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/0">
            <Link
              href={`/tournament/${tournamentId}/bracket`}
              scroll={false}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition-colors ${
                activeCategory === ALL_CATEGORY
                  ? "border-primary bg-primary text-[#ffffff]"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary-700 dark:hover:text-primary-300"
              }`}
            >
              Semua Kategori
            </Link>
            {allCategories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <Link
                  key={cat}
                  href={`/tournament/${tournamentId}/bracket?category=${encodeURIComponent(
                    cat
                  )}`}
                  scroll={false}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-[#ffffff]"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary-700 dark:hover:text-primary-300"
                  }`}
                >
                  {categoryLabel(cat)}
                </Link>
              );
            })}
          </div>
        )}

        {categories.map((category) => {
          const isPool = poolCategories.includes(category);
          const categoryPools = pools.filter((p) => p.categoryKey === category);
          const categoryGroups = tournament.groups.filter(
            (g) => g.category === category
          );

          // Ranking gabungan pool (Top-2 per pool)
          const poolRanking = categoryPools
            .flatMap((p) =>
              p.members
                .filter((m) => m.rank != null && m.rank >= 1 && m.rank <= 2)
                .map((m) => ({ ...m, poolLabel: p.label }))
            )
            .sort((a, b) => {
              const ra = a.rank ?? 999;
              const rb = b.rank ?? 999;
              if (ra !== rb) return ra - rb;
              if (b.wins !== a.wins) return b.wins - a.wins;
              if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
              return b.pointsFor - a.pointsFor;
            });

          // Overall ranking legacy
          const allMembers = categoryGroups
            .flatMap((g) =>
              g.members
                .filter((m) => m.played > 0)
                .map((m) => ({ ...m, groupName: g.name }))
            )
            .sort((a, b) => {
              if (b.wins !== a.wins) return b.wins - a.wins;
              if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
              return b.pointsFor - a.pointsFor;
            });

          const categoryKnockouts = tournament.knockoutMatches.filter(
            (k) => k.category === category
          );

          return (
            <div key={category} className="mb-12">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <span className="px-4 py-1.5 bg-primary-100 dark:bg-primary-200/20 text-primary-800 dark:text-primary-100 rounded-full text-sm font-bold">
                  {categoryLabel(category)}
                </span>
              </h2>

              {/* Bagan Grup (matrix round-robin) — sistem Pool */}
              {isPool && categoryPools.length > 0 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                      📊 Bagan Grup (Round-Robin)
                    </h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {categoryPools.map((pool) => (
                      <div
                        key={pool.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col"
                      >
                        <div className="bg-gradient-to-r from-primary to-amber-500 px-5 py-3 flex items-center gap-3">
                          <span className="shrink-0 inline-flex items-center rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                            Pool {pool.poolCode}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-[#ffffff] truncate">
                              {pool.label}
                            </h3>
                            <p className="text-[#ffffff]/80 text-xs">
                              Bagan Grup — hasil round-robin per peserta
                            </p>
                          </div>
                        </div>
                        <div className="p-4 flex-1">
                          <PoolMatrixTable
                            pool={{
                              id: pool.id,
                              poolCode: pool.poolCode,
                              label: pool.label,
                              members: pool.members.map((m) => ({
                                id: m.id,
                                name: m.memberName,
                              })),
                              matches: pool.matches,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Groups (sistem legacy) */}
              {!isPool && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {categoryGroups.map((group) => {
                    const sortedMembers = [...group.members].sort(
                      (a, b) => (a.rank || 99) - (b.rank || 99)
                    );

                    return (
                      <div
                        key={group.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-primary to-amber-500 px-5 py-3">
                          <h3 className="text-base font-bold text-[#ffffff]">
                            {group.name}
                          </h3>
                          <p className="text-[#ffffff]/80 text-xs">
                            {group.members.length} pemain
                          </p>
                        </div>

                        {/* Standings Table */}
                        {sortedMembers.some((m) => m.played > 0) && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                  <th className="py-2.5 px-3 text-left font-bold">
                                    #
                                  </th>
                                  <th className="py-2.5 px-3 text-left font-bold">
                                    Pemain
                                  </th>
                                  <th className="py-2.5 px-2 text-center font-bold">
                                    M
                                  </th>
                                  <th className="py-2.5 px-2 text-center font-bold">
                                    K
                                  </th>
                                  <th className="py-2.5 px-2 text-center font-bold">
                                    PD
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {sortedMembers.map((member) => (
                                  <tr
                                    key={member.id}
                                    className={
                                      member.rank === 1 ? "bg-gold/20" : ""
                                    }
                                  >
                                    <td className="py-2.5 px-3 font-bold text-slate-400">
                                      {member.rank === 1 && "🥇"}
                                      {member.rank === 2 && "🥈"}
                                      {member.rank === 3 && "🥉"}
                                      {(member.rank || 0) > 3 && member.rank}
                                      {!member.rank && "-"}
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                      {member.playerName}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-bold text-emerald-600">
                                      {member.wins}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-bold text-red-500">
                                      {member.losses}
                                    </td>
                                    <td
                                      className={`py-2.5 px-2 text-center font-bold ${
                                        member.pointDiff > 0
                                          ? "text-emerald-600"
                                          : member.pointDiff < 0
                                          ? "text-red-500"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      {member.pointDiff > 0 ? "+" : ""}
                                      {member.pointDiff}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Match Results */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Hasil Pertandingan
                          </h4>
                          <div className="space-y-1.5">
                            {group.matches.map((match) => (
                              <div
                                key={match.id}
                                className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                                  match.status === "DONE"
                                    ? "bg-emerald-50"
                                    : "bg-slate-50 dark:bg-slate-700"
                                }`}
                              >
                                <span
                                  className={`font-medium truncate flex-1 ${
                                    match.winnerName === match.player1Name
                                      ? "text-emerald-700 font-bold"
                                      : "text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  {match.player1Name}
                                </span>
                                <span className="mx-2 font-bold text-slate-400 flex-shrink-0">
                                  {match.status === "DONE"
                                    ? `${match.score1} - ${match.score2}`
                                    : "vs"}
                                </span>
                                <span
                                  className={`font-medium truncate flex-1 text-right ${
                                    match.winnerName === match.player2Name
                                      ? "text-emerald-700 font-bold"
                                      : "text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  {match.player2Name}
                                </span>
                              </div>
                            ))}
                            {group.matches.length === 0 && (
                              <p className="text-slate-400 text-xs text-center py-2">
                                Belum ada pertandingan
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Overall Ranking (sistem Pool) */}
              {isPool && poolRanking.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-4">
                    <h3 className="text-base font-bold text-amber-950">
                      🏅 Ranking Keseluruhan — {categoryLabel(category)}
                    </h3>
                    <p className="text-amber-900 text-xs mt-0.5">
                      Juara &amp; runner-up tiap pool menjadi satu klasemen
                      peringkat.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <th className="py-3 px-4 text-left font-bold">
                            Rank
                          </th>
                          <th className="py-3 px-4 text-left font-bold">
                            Pemain
                          </th>
                          <th className="py-3 px-4 text-left font-bold">
                            Pool
                          </th>
                          <th className="py-3 px-3 text-center font-bold">
                            Main
                          </th>
                          <th className="py-3 px-3 text-center font-bold">M</th>
                          <th className="py-3 px-3 text-center font-bold">K</th>
                          <th className="py-3 px-3 text-center font-bold">
                            PF
                          </th>
                          <th className="py-3 px-3 text-center font-bold">
                            PA
                          </th>
                          <th className="py-3 px-3 text-center font-bold">
                            PD
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {poolRanking.map((member, idx) => (
                          <tr
                            key={member.id}
                            className={`${
                              idx === 0
                                ? "bg-gold/20"
                                : idx === 1
                                ? "bg-slate-50/50"
                                : idx === 2
                                ? "bg-amber-50/30"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-bold">
                              {idx === 0
                                ? "🥇"
                                : idx === 1
                                ? "🥈"
                                : idx === 2
                                ? "🥉"
                                : idx + 1}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {member.memberName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-primary-50 dark:bg-primary-200/10 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                                {member.poolLabel}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                              {member.played}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-600">
                              {member.wins}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-red-500">
                              {member.losses}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                              {member.pointsFor}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                              {member.pointsAgainst}
                            </td>
                            <td
                              className={`py-3 px-3 text-center font-bold ${
                                member.pointDiff > 0
                                  ? "text-emerald-600"
                                  : member.pointDiff < 0
                                  ? "text-red-500"
                                  : "text-slate-400"
                              }`}
                            >
                              {member.pointDiff > 0 ? "+" : ""}
                              {member.pointDiff}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Overall Ranking (sistem legacy) */}
              {!isPool && allMembers.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-4">
                    <h3 className="text-base font-bold text-[#ffffff]">
                      🏅 Ranking Keseluruhan — {categoryLabel(category)}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                          <th className="py-3 px-4 text-left font-bold">
                            Rank
                          </th>
                          <th className="py-3 px-4 text-left font-bold">
                            Pemain
                          </th>
                          <th className="py-3 px-4 text-left font-bold">
                            Grup
                          </th>
                          <th className="py-3 px-3 text-center font-bold">M</th>
                          <th className="py-3 px-3 text-center font-bold">K</th>
                          <th className="py-3 px-3 text-center font-bold">
                            PD
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {allMembers.map((member, idx) => (
                          <tr
                            key={member.id}
                            className={`${
                              idx === 0
                                ? "bg-gold/20"
                                : idx === 1
                                ? "bg-slate-50/50"
                                : idx === 2
                                ? "bg-amber-50/30"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-bold">
                              {idx === 0
                                ? "🥇"
                                : idx === 1
                                ? "🥈"
                                : idx === 2
                                ? "🥉"
                                : idx + 1}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {member.playerName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-primary-50 dark:bg-primary-200/10 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                                {member.groupName}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-600">
                              {member.wins}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-red-500">
                              {member.losses}
                            </td>
                            <td
                              className={`py-3 px-3 text-center font-bold ${
                                member.pointDiff > 0
                                  ? "text-emerald-600"
                                  : member.pointDiff < 0
                                  ? "text-red-500"
                                  : "text-slate-400"
                              }`}
                            >
                              {member.pointDiff > 0 ? "+" : ""}
                              {member.pointDiff}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Knockout Bracket */}
              {categoryKnockouts.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 mt-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      ⚔️ Fase Gugur
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Bagan dibuat otomatis dari juara &amp; runner-up tiap pool.
                    </p>
                  </div>
                  <div className="overflow-x-auto pb-8">
                    <div className="min-w-[800px] flex justify-start pl-4 py-8 relative">
                      <KnockoutBracketRender
                        matches={categoryKnockouts}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
