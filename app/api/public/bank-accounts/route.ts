import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/apiResponse'


export async function GET() {
  const accounts = await prisma.bankAccount.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
    },
  })
  return successResponse('Daftar rekening bank berhasil diambil', accounts)
}
