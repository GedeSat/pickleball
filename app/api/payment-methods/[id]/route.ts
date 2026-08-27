import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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
    const configId = parseInt(id)
    const formData = await request.formData()
    const label = formData.get('label') as string
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') as string

    const existing = await prisma.paymentMethodConfig.findUnique({ where: { id: configId } })
    if (!existing) {
      return errorResponse('Metode pembayaran tidak ditemukan', 404, 'NOT_FOUND')
    }

    const updateData: { label?: string; image?: string | null } = {}

    if (label !== undefined && label !== null) {
      updateData.label = label
    }

    if (removeImage === 'true') {
      updateData.image = null
    } else if (imageFile && imageFile.size > 0) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
        return errorResponse('Gambar harus berupa JPG/PNG/WebP', 400, 'INVALID_IMAGE')
      }
      const ext = imageFile.type === 'image/png' ? '.png' : imageFile.type === 'image/webp' ? '.webp' : '.jpg'
      const filename = `payment-method-${Date.now()}${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-methods')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), Buffer.from(await imageFile.arrayBuffer()))
      updateData.image = `/uploads/payment-methods/${filename}`
    }

    const updated = await prisma.paymentMethodConfig.update({
      where: { id: configId },
      data: updateData,
    })

    return successResponse('Metode pembayaran berhasil diperbarui', updated)
  } catch {
    return errorResponse('Gagal memperbarui metode pembayaran', 500, 'SERVER_ERROR')
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
    const configId = parseInt(id)

    const existing = await prisma.paymentMethodConfig.findUnique({ where: { id: configId } })
    if (!existing) {
      return errorResponse('Metode pembayaran tidak ditemukan', 404, 'NOT_FOUND')
    }

    await prisma.paymentMethodConfig.delete({ where: { id: configId } })

    return successResponse('Metode pembayaran berhasil dihapus')
  } catch {
    return errorResponse('Gagal menghapus metode pembayaran', 500, 'SERVER_ERROR')
  }
}
