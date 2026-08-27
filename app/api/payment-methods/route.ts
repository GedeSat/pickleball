import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'


export async function GET() {
  const methods = await prisma.paymentMethodConfig.findMany({
    orderBy: { order: 'asc' },
  })
  return successResponse('Daftar metode pembayaran berhasil diambil', methods)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('Akses ditolak', 403, 'FORBIDDEN')
  }

  try {
    const formData = await request.formData()
    const method = formData.get('method') as string
    const label = formData.get('label') as string
    const imageFile = formData.get('image') as File | null

    if (!method || !label) {
      return errorResponse('Tipe metode dan label wajib diisi', 400, 'VALIDATION_ERROR')
    }

    let imageUrl: string | null = null
    if (imageFile && imageFile.size > 0) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
        return errorResponse('Gambar harus berupa JPG/PNG/WebP', 400, 'INVALID_IMAGE')
      }
      const ext = imageFile.type === 'image/png' ? '.png' : imageFile.type === 'image/webp' ? '.webp' : '.jpg'
      const filename = `payment-method-${Date.now()}${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-methods')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), Buffer.from(await imageFile.arrayBuffer()))
      imageUrl = `/uploads/payment-methods/${filename}`
    }

    const maxOrder = await prisma.paymentMethodConfig.aggregate({ _max: { order: true } })

    const created = await prisma.paymentMethodConfig.create({
      data: {
        method,
        label,
        image: imageUrl,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    })

    return successResponse('Metode pembayaran berhasil ditambahkan', created, 201)
  } catch {
    return errorResponse('Gagal menambahkan metode pembayaran', 500, 'SERVER_ERROR')
  }
}
