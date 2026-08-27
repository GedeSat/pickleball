'use server'

import { MatchType, Gender } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { buildCategoryInfo, validateGenderForMatchType } from '@/lib/tournamentCategory'

export async function processTeamRegistration(prevState: unknown, formData: FormData) {
  let tournamentId: number = 0;
  try {
    tournamentId = parseInt(formData.get('tournamentId') as string)
    const matchType = formData.get('matchType') as MatchType
    const grade = formData.get('grade') as string
    
    // Parse players
    const player1IdStr = formData.get('player1Id') as string
    const player2IdStr = formData.get('player2Id') as string
    
    // Generate team name or use input
    const teamNameInput = formData.get('teamName') as string

    if (!tournamentId || !matchType || !grade || !player1IdStr) {
      return { error: 'Semua field wajib harus diisi' }
    }

    const player1Id = parseInt(player1IdStr)
    const p1 = await prisma.player.findUnique({ where: { id: player1Id } })
    if (!p1) return { error: 'Player 1 tidak ditemukan' }
    
    let p2 = null
    let teamName = teamNameInput || p1.fullName // Default untuk SINGLE
    
    if (matchType !== 'SINGLE') {
      if (!player2IdStr) {
        return { error: 'Player 2 wajib diisi untuk kategori Double/Mixed' }
      }
      const player2Id = parseInt(player2IdStr)
      if (player1Id === player2Id) {
        return { error: 'Player 1 dan Player 2 tidak boleh orang yang sama' }
      }
      p2 = await prisma.player.findUnique({ where: { id: player2Id } })
      if (!p2) return { error: 'Player 2 tidak ditemukan' }
      
      if (!teamNameInput) {
         teamName = `${p1.fullName} & ${p2.fullName}`
      }
    }

    // Gender validation
    const genders: Gender[] = [p1.gender]
    if (p2) genders.push(p2.gender)
    
    const validCheck = validateGenderForMatchType(matchType, genders)
    if (!validCheck.valid) {
      return { error: validCheck.message }
    }

    // Tentukan gender dominan
    const dominantGender: Gender | null = matchType === 'MIXED' ? null : genders[0]
    const categoryInfo = buildCategoryInfo(grade, dominantGender, matchType)

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
    if (!tournament) return { error: 'Turnamen tidak ditemukan' }

    // Satu transaksi: buat/update tim. Penempatan ke pool dilakukan
    // panitia setelah TM/pengundian via halaman kelola pool.
    await prisma.$transaction(async (tx) => {
      if (matchType !== 'SINGLE') {
        const team = await tx.team.create({
          data: {
            name: teamName,
            matchType,
            grade,
            categoryKey: categoryInfo.key,
            tournamentId,
          }
        })

        await tx.player.update({
          where: { id: p1.id },
          data: { grade, matchType, teamId: team.id }
        })
        if (p2) {
          await tx.player.update({
            where: { id: p2.id },
            data: { grade, matchType, teamId: team.id }
          })
        }
      } else {
        // SINGLE
        await tx.player.update({
          where: { id: p1.id },
          data: { grade, matchType }
        })
      }
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Let Next.js handle redirect throw
    }
    console.error('Registration Error:', error)
    return { error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.' }
  }

  revalidatePath(`/admin/tournaments/${tournamentId}`)
  redirect(`/admin/tournaments/${tournamentId}/edit`)
}
