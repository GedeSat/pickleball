import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminManagerClient from './AdminManagerClient'

export default async function AdminsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin')
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

  return (
    <AdminManagerClient
      admins={admins}
      currentUserId={Number(session.user.id)}
    />
  )
}
