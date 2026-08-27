import { successResponse, errorResponse } from '@/lib/apiResponse'
import { updateMatchSchedule } from '@/lib/matchManager'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { type, matchId, court, startTime } = body

    if (!type || !matchId) {
      return errorResponse('Data tidak lengkap', 400, 'VALIDATION_ERROR')
    }

    await updateMatchSchedule(type, matchId, court || '', startTime || '')

    return successResponse('Jadwal berhasil diupdate')
  } catch {
    return errorResponse('Gagal update jadwal', 500, 'SERVER_ERROR')
  }
}
