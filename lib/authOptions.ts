import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 1000
const attempts = new Map<string, { count: number; firstAt: number }>()

function getClientIp(req?: { headers?: { get?: (name: string) => string | null } }): string {
  const fwd = req?.headers?.get?.('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const realIp = req?.headers?.get?.('x-real-ip')
  return realIp || 'unknown'
}

function pruneExpired() {
  const now = Date.now()
  if (attempts.size > 1000) {
    for (const [key, record] of attempts) {
      if (now - record.firstAt > WINDOW_MS) attempts.delete(key)
    }
  }
}

function isRateLimited(key: string): boolean {
  pruneExpired()
  const now = Date.now()
  const record = attempts.get(key)
  if (!record || now - record.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now })
    return false
  }
  record.count += 1
  return record.count > MAX_ATTEMPTS
}

function resetAttempts(key: string) {
  attempts.delete(key)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials, req) {
        const ipKey = `ip:${getClientIp(req)}`
        const emailKey = `email:${credentials?.email}`

        if (isRateLimited(ipKey) || isRateLimited(emailKey)) {
          throw new Error('Terlalu banyak percobaan login. Coba lagi dalam 60 detik.')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials!.email },
        })

        if (!user) {
          throw new Error('User tidak ditemukan')
        }

        const isValid = await bcrypt.compare(credentials!.password, user.password)

        if (!isValid) {
          throw new Error('Password salah')
        }

        resetAttempts(ipKey)
        resetAttempts(emailKey)

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/admin/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}
