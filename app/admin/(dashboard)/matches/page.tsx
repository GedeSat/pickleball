import { fetchAllMatches, fetchTournaments, fetchCategories } from '@/lib/matchManager'
import MatchManagerClient from './MatchManagerClient'

export default async function MatchesPage() {
  const [matches, tournaments, allCategories] = await Promise.all([
    fetchAllMatches(),
    fetchTournaments(),
    fetchCategories(),
  ])

  const serialized = matches.map((m) => ({
    ...m,
    startTime: m.startTime ? m.startTime.toISOString() : null,
  }))

  return (
    <MatchManagerClient
      initialMatches={serialized}
      tournaments={tournaments}
      allCategories={allCategories}
    />
  )
}
