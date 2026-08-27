import { prisma } from '@/lib/prisma'
import { categoryKeyToLabel } from '@/lib/categoryLabel'
import { revalidateTag, cacheLife, cacheTag } from 'next/cache'
import type { Prisma } from '@prisma/client'

export type MatchType = 'pool' | 'knockout' | 'group'

export type UnifiedMatch = {
  id: number
  type: MatchType
  tournamentId: number
  tournamentName: string
  tournamentStatus: string
  category: string
  categoryLabel: string
  roundLabel: string
  player1: string
  player2: string
  score1: number | null
  score2: number | null
  winnerName: string | null
  status: string
  court: string | null
  startTime: Date | null
  refereeName: string | null
  matchOrder: number
}

export type MatchFilters = {
  tournamentId?: number
  category?: string
  status?: string
  matchType?: MatchType
  search?: string
}

// Cached read — short-lived profile since scores update live during a tournament.
export async function fetchAllMatches(filters: MatchFilters = {}): Promise<UnifiedMatch[]> {
  'use cache'
  cacheLife('matches')
  cacheTag('matches')

  const wantPool = !filters.matchType || filters.matchType === 'pool'
  const wantKnockout = !filters.matchType || filters.matchType === 'knockout'
  const wantGroup = !filters.matchType || filters.matchType === 'group'

  const poolWhere: Prisma.PoolMatchWhereInput = {
    ...(filters.status && { status: filters.status as any }),
    pool: {
      ...(filters.tournamentId && { tournamentId: filters.tournamentId }),
      ...(filters.category && { categoryKey: filters.category }),
    },
    ...(filters.search && {
      OR: [
        { member1: { memberName: { contains: filters.search } } },
        { member2: { memberName: { contains: filters.search } } },
      ],
    }),
  }

  const knockoutWhere: Prisma.KnockoutMatchWhereInput = {
    ...(filters.tournamentId && { tournamentId: filters.tournamentId }),
    ...(filters.category && { category: filters.category }),
    ...(filters.status && { status: filters.status as any }),
    ...(filters.search && {
      OR: [
        { player1Name: { contains: filters.search } },
        { player2Name: { contains: filters.search } },
      ],
    }),
  }

  const groupWhere: Prisma.GroupMatchWhereInput = {
    ...(filters.status && { status: filters.status as any }),
    group: {
      ...(filters.tournamentId && { tournamentId: filters.tournamentId }),
      ...(filters.category && { category: filters.category }),
    },
    ...(filters.search && {
      OR: [
        { player1Name: { contains: filters.search } },
        { player2Name: { contains: filters.search } },
      ],
    }),
  }

  const [poolMatches, knockoutMatches, groupMatches] = await Promise.all([
    wantPool
      ? prisma.poolMatch.findMany({
          where: poolWhere,
          include: {
            pool: { include: { tournament: true } },
            member1: true,
            member2: true,
          },
          orderBy: { matchOrder: 'asc' },
        })
      : Promise.resolve([]),
    wantKnockout
      ? prisma.knockoutMatch.findMany({
          where: knockoutWhere,
          include: { tournament: true },
          orderBy: { matchOrder: 'asc' },
        })
      : Promise.resolve([]),
    wantGroup
      ? prisma.groupMatch.findMany({
          where: groupWhere,
          include: { group: { include: { tournament: true } } },
        })
      : Promise.resolve([]),
  ])

  const unified: UnifiedMatch[] = []

  for (const m of poolMatches) {
    unified.push({
      id: m.id,
      type: 'pool',
      tournamentId: m.pool.tournamentId,
      tournamentName: m.pool.tournament.name,
      tournamentStatus: m.pool.tournament.status,
      category: m.pool.categoryKey,
      categoryLabel: categoryKeyToLabel(m.pool.categoryKey),
      roundLabel: `Pool ${m.pool.poolCode}`,
      player1: m.member1.memberName,
      player2: m.member2.memberName,
      score1: m.score1,
      score2: m.score2,
      winnerName: m.winnerName,
      status: m.status,
      court: m.court,
      startTime: m.startTime,
      refereeName: null,
      matchOrder: m.matchOrder,
    })
  }

  for (const m of knockoutMatches) {
    unified.push({
      id: m.id,
      type: 'knockout',
      tournamentId: m.tournamentId,
      tournamentName: m.tournament.name,
      tournamentStatus: m.tournament.status,
      category: m.category,
      categoryLabel: categoryKeyToLabel(m.category),
      roundLabel: m.roundText,
      player1: m.player1Name || 'TBD',
      player2: m.player2Name || 'TBD',
      score1: m.score1,
      score2: m.score2,
      winnerName: m.winnerName,
      status: m.status,
      court: m.court,
      startTime: m.startTime,
      refereeName: m.refereeName,
      matchOrder: m.matchOrder,
    })
  }

  for (const m of groupMatches) {
    unified.push({
      id: m.id,
      type: 'group',
      tournamentId: m.group.tournamentId,
      tournamentName: m.group.tournament.name,
      tournamentStatus: m.group.tournament.status,
      category: m.group.category,
      categoryLabel: categoryKeyToLabel(m.group.category),
      roundLabel: m.group.name,
      player1: m.player1Name,
      player2: m.player2Name,
      score1: m.score1,
      score2: m.score2,
      winnerName: m.winnerName,
      status: m.status,
      court: null,
      startTime: null,
      refereeName: m.refereeName,
      matchOrder: 0,
    })
  }

  unified.sort((a, b) => {
    if (a.tournamentId !== b.tournamentId) return a.tournamentId - b.tournamentId
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.matchOrder - b.matchOrder
  })

  return unified
}

// Reference data — changes rarely, cached longer.
export async function fetchTournaments() {
  'use cache'
  cacheLife('reference')
  cacheTag('tournaments')

  return prisma.tournament.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, status: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function fetchCategories(tournamentId?: number) {
  'use cache'
  cacheLife('reference')
  cacheTag('categories')

  const where = tournamentId ? { tournamentId } : {}
  const pools = await prisma.pool.findMany({
    where,
    select: { categoryKey: true },
    distinct: ['categoryKey'],
  })
  const knockouts = await prisma.knockoutMatch.findMany({
    where: tournamentId ? { tournamentId } : undefined,
    select: { category: true },
    distinct: ['category'],
  })
  const groups = await prisma.tournamentGroup.findMany({
    where: tournamentId ? { tournamentId } : undefined,
    select: { category: true },
    distinct: ['category'],
  })

  const cats = new Set<string>()
  pools.forEach((p) => cats.add(p.categoryKey))
  knockouts.forEach((k) => cats.add(k.category))
  groups.forEach((g) => cats.add(g.category))

  return Array.from(cats).map((c) => ({ key: c, label: categoryKeyToLabel(c) }))
}

export async function updatePoolMatchScore(
  matchId: number,
  score1: number,
  score2: number
) {
  const match = await prisma.poolMatch.findUnique({ where: { id: matchId } })
  if (!match) throw new Error('Match not found')

  const winnerId = score1 > score2 ? match.member1Id : match.member2Id
  const member1 = await prisma.poolMember.findUnique({ where: { id: match.member1Id } })
  const member2 = await prisma.poolMember.findUnique({ where: { id: match.member2Id } })
  const winnerName = score1 > score2 ? member1?.memberName : member2?.memberName

  await prisma.poolMatch.update({
    where: { id: matchId },
    data: { score1, score2, winnerId, winnerName: winnerName || null, status: 'DONE' },
  })

  await recalcPoolStandings(match.poolId)
  revalidateTag('matches', 'matches')
}

export async function updateKnockoutMatchScore(
  matchId: number,
  score1: number,
  score2: number
) {
  const match = await prisma.knockoutMatch.findUnique({ where: { id: matchId } })
  if (!match) throw new Error('Match not found')

  const winnerName = score1 > score2 ? match.player1Name : match.player2Name

  await prisma.knockoutMatch.update({
    where: { id: matchId },
    data: { score1, score2, winnerName, status: 'DONE' },
  })

  if (match.nextMatchId && winnerName) {
    const nextMatch = await prisma.knockoutMatch.findUnique({ where: { id: match.nextMatchId } })
    if (nextMatch) {
      const field = !nextMatch.player1Name ? 'player1Name' : 'player2Name'
      await prisma.knockoutMatch.update({
        where: { id: match.nextMatchId },
        data: { [field]: winnerName },
      })
    }
  }

  revalidateTag('matches', 'matches')
}

export async function updateGroupMatchScore(
  matchId: number,
  score1: number,
  score2: number
) {
  const match = await prisma.groupMatch.findUnique({ where: { id: matchId } })
  if (!match) throw new Error('Match not found')

  const winnerName = score1 > score2 ? match.player1Name : match.player2Name

  await prisma.groupMatch.update({
    where: { id: matchId },
    data: { score1, score2, winnerName, status: 'DONE' },
  })

  revalidateTag('matches', 'matches')
}

async function recalcPoolStandings(poolId: number) {
  const matches = await prisma.poolMatch.findMany({
    where: { poolId, status: 'DONE' },
  })
  const members = await prisma.poolMember.findMany({ where: { poolId } })

  const stats = new Map<number, { played: number; wins: number; losses: number; pf: number; pa: number }>()
  for (const m of members) {
    stats.set(m.id, { played: 0, wins: 0, losses: 0, pf: 0, pa: 0 })
  }

  for (const match of matches) {
    const s1 = stats.get(match.member1Id)
    const s2 = stats.get(match.member2Id)
    if (!s1 || !s2) continue

    s1.played++
    s2.played++
    s1.pf += match.score1 ?? 0
    s1.pa += match.score2 ?? 0
    s2.pf += match.score2 ?? 0
    s2.pa += match.score1 ?? 0

    if (match.winnerId === match.member1Id) {
      s1.wins++
      s2.losses++
    } else if (match.winnerId === match.member2Id) {
      s2.wins++
      s1.losses++
    }
  }

  const ranked = members
    .map((m) => {
      const s = stats.get(m.id)!
      return { id: m.id, ...s, pointDiff: s.pf - s.pa }
    })
    .sort((a, b) => b.wins - a.wins || b.pointDiff - a.pointDiff)

  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i]
    await prisma.poolMember.update({
      where: { id: r.id },
      data: {
        played: r.played,
        wins: r.wins,
        losses: r.losses,
        pointsFor: r.pf,
        pointsAgainst: r.pa,
        pointDiff: r.pointDiff,
        rank: i + 1,
      },
    })
  }
}

export async function updateMatchStatus(
  type: MatchType,
  matchId: number,
  status: string
) {
  if (type === 'pool') {
    await prisma.poolMatch.update({ where: { id: matchId }, data: { status: status as 'SCHEDULED' | 'ONGOING' | 'DONE' } })
  } else if (type === 'knockout') {
    await prisma.knockoutMatch.update({ where: { id: matchId }, data: { status: status as 'SCHEDULED' | 'ONGOING' | 'DONE' } })
  } else {
    await prisma.groupMatch.update({ where: { id: matchId }, data: { status: status as 'SCHEDULED' | 'ONGOING' | 'DONE' } })
  }
  revalidateTag('matches', 'matches')
}

export async function updateMatchSchedule(
  type: MatchType,
  matchId: number,
  court: string,
  startTime: string
) {
  const date = startTime ? new Date(startTime) : null
  if (type === 'pool') {
    await prisma.poolMatch.update({ where: { id: matchId }, data: { court, startTime: date } })
  } else if (type === 'knockout') {
    await prisma.knockoutMatch.update({ where: { id: matchId }, data: { court, startTime: date } })
  }
  revalidateTag('matches', 'matches')
}