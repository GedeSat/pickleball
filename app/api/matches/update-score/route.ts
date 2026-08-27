import { successResponse, errorResponse } from '@/lib/apiResponse'
import { updatePoolMatchScore, updateKnockoutMatchScore, updateGroupMatchScore } from '@/lib/matchManager'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { type, matchId, score1, score2 } = body

    if (!type || !matchId || score1 === undefined || score2 === undefined) {
      return errorResponse('Data tidak lengkap', 400, 'VALIDATION_ERROR')
    }

    if (score1 === score2) {
      return errorResponse('Skor tidak boleh seri', 400, 'DRAW_NOT_ALLOWED')
    }

    if (type === 'pool') {
      await updatePoolMatchScore(matchId, score1, score2)
    } else if (type === 'knockout') {
      await updateKnockoutMatchScore(matchId, score1, score2)
    } else if (type === 'group') {
      await updateGroupMatchScore(matchId, score1, score2)
    } else {
      return errorResponse('Tipe match tidak valid', 400, 'INVALID_TYPE')
    }

    return successResponse('Skor berhasil diupdate')
  } catch {
    return errorResponse('Gagal update skor', 500, 'SERVER_ERROR')
  }
}
