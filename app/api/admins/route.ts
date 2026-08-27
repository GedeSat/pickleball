import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('Akses ditolak', 403, 'FORBIDDEN')
  }

  const admins = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return successResponse('Daftar admin berhasil diambil', admins)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('Akses ditolak', 403, 'FORBIDDEN')
  }

  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return errorResponse('Nama, email, dan password wajib diisi', 400, 'VALIDATION_ERROR')
    }

    if (password.length < 8) {
      return errorResponse('Password minimal 8 karakter', 400, 'VALIDATION_ERROR')
    }

    const validRoles = ['ADMIN', 'MATCH_ADMIN']
    const userRole = validRoles.includes(role) ? role : 'ADMIN'

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return errorResponse('Email sudah digunakan', 409, 'CONFLICT')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole as 'ADMIN' | 'MATCH_ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return successResponse('Admin berhasil ditambahkan', admin, 201)
  } catch {
    return errorResponse('Gagal membuat admin', 500, 'SERVER_ERROR')
  }
}
