import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('Akses ditolak', 403, 'FORBIDDEN')
  }

  try {
    const { id } = await params
    const accountId = parseInt(id)
    const body = await request.json()
    const { bankName, accountNumber, accountName, logo, active, order } = body

    const existing = await prisma.bankAccount.findUnique({ where: { id: accountId } })
    if (!existing) {
      return errorResponse('Rekening bank tidak ditemukan', 404, 'NOT_FOUND')
    }

    const updateData: {
      bankName?: string
      accountNumber?: string
      accountName?: string
      logo?: string | null
      active?: boolean
      order?: number
    } = {}

    if (bankName !== undefined) updateData.bankName = bankName
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber
    if (accountName !== undefined) updateData.accountName = accountName
    if (logo !== undefined) updateData.logo = logo || null
    if (active !== undefined) updateData.active = active
    if (order !== undefined) updateData.order = order

    const account = await prisma.bankAccount.update({
      where: { id: accountId },
      data: updateData,
    })

    return successResponse('Rekening bank berhasil diperbarui', account)
  } catch {
    return errorResponse('Gagal memperbarui rekening bank', 500, 'SERVER_ERROR')
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('Akses ditolak', 403, 'FORBIDDEN')
  }

  try {
    const { id } = await params
    const accountId = parseInt(id)

    const existing = await prisma.bankAccount.findUnique({ where: { id: accountId } })
    if (!existing) {
      return errorResponse('Rekening bank tidak ditemukan', 404, 'NOT_FOUND')
    }

    await prisma.bankAccount.delete({ where: { id: accountId } })

    return successResponse('Rekening bank berhasil dihapus')
  } catch {
    return errorResponse('Gagal menghapus rekening bank', 500, 'SERVER_ERROR')
  }
}
