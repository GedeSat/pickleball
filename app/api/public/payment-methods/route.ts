import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/apiResponse'


export async function GET() {
  const methods = await prisma.paymentMethodConfig.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      method: true,
      label: true,
      image: true,
    },
  })
  return successResponse('Daftar metode pembayaran berhasil diambil', methods)
}
