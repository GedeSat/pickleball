import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import bcrypt from 'bcryptjs'

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
    const userId = parseInt(id)
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email) {
      return errorResponse('Nama dan email wajib diisi', 400, 'VALIDATION_ERROR')
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return errorResponse('Admin tidak ditemukan', 404, 'NOT_FOUND')
    }

    if (email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken) {
        return errorResponse('Email sudah digunakan', 409, 'CONFLICT')
      }
    }

    const validRoles = ['ADMIN', 'MATCH_ADMIN']
    const updateData: { name: string; email: string; password?: string; role?: 'ADMIN' | 'MATCH_ADMIN' } = { name, email }
    if (password && password.length >= 8) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    if (validRoles.includes(role)) {
      updateData.role = role as 'ADMIN' | 'MATCH_ADMIN'
    }

    const admin = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return successResponse('Admin berhasil diperbarui', admin)
  } catch {
    return errorResponse('Gagal memperbarui admin', 500, 'SERVER_ERROR')
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
    const userId = parseInt(id)

    if (userId === Number(session.user.id)) {
      return errorResponse('Tidak bisa menghapus diri sendiri', 400, 'SELF_DELETE')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return errorResponse('Admin tidak ditemukan', 404, 'NOT_FOUND')
    }

    if (user.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({
        where: { role: 'SUPER_ADMIN' },
      })
      if (superAdminCount <= 1) {
        return errorResponse('Tidak bisa menghapus super admin terakhir', 400, 'LAST_SUPER_ADMIN')
      }
    }

    await prisma.user.delete({ where: { id: userId } })

    return successResponse('Admin berhasil dihapus')
  } catch {
    return errorResponse('Gagal menghapus admin', 500, 'SERVER_ERROR')
  }
}
