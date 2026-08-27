import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('Akses ditolak', 403, 'FORBIDDEN')
  }

  try {
    const { id } = await params
    const configId = parseInt(id)

    const existing = await prisma.paymentMethodConfig.findUnique({ where: { id: configId } })
    if (!existing) {
      return errorResponse('Metode pembayaran tidak ditemukan', 404, 'NOT_FOUND')
    }

    const updated = await prisma.paymentMethodConfig.update({
      where: { id: configId },
      data: { active: !existing.active },
    })

    return successResponse('Status berhasil diubah', updated)
  } catch {
    return errorResponse('Gagal mengubah status', 500, 'SERVER_ERROR')
  }
}
