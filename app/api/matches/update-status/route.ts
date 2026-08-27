import { successResponse, errorResponse } from '@/lib/apiResponse'
import { updateMatchStatus } from '@/lib/matchManager'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { type, matchId, status } = body

    if (!type || !matchId || !status) {
      return errorResponse('Data tidak lengkap', 400, 'VALIDATION_ERROR')
    }

    if (!['SCHEDULED', 'ONGOING', 'DONE'].includes(status)) {
      return errorResponse('Status tidak valid', 400, 'INVALID_STATUS')
    }

    await updateMatchStatus(type, matchId, status)

    return successResponse('Status berhasil diupdate')
  } catch {
    return errorResponse('Gagal update status', 500, 'SERVER_ERROR')
  }
}
