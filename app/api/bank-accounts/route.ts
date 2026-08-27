import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET() {
  const accounts = await prisma.bankAccount.findMany({
    orderBy: { order: 'asc' },
  })
  return successResponse('Daftar rekening bank berhasil diambil', accounts)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('Akses ditolak', 403, 'FORBIDDEN')
  }

  try {
    const body = await request.json()
    const { bankName, accountNumber, accountName, logo } = body

    if (!bankName || !accountNumber || !accountName) {
      return errorResponse('Nama bank, nomor rekening, dan nama pemilik wajib diisi', 400, 'VALIDATION_ERROR')
    }

    const maxOrder = await prisma.bankAccount.aggregate({ _max: { order: true } })

    const account = await prisma.bankAccount.create({
      data: {
        bankName,
        accountNumber,
        accountName,
        logo: logo || null,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    })

    return successResponse('Rekening bank berhasil ditambahkan', account, 201)
  } catch {
    return errorResponse('Gagal menambahkan rekening bank', 500, 'SERVER_ERROR')
  }
}
