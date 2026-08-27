'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { href: '/admin/banners', icon: '🖼️', label: 'Banner Slider', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/tournaments', icon: '🏆', label: 'Turnamen' },
  { href: '/admin/matches', icon: '🎯', label: 'Pertandingan' },
  { href: '/admin/schedule', icon: '📅', label: 'Jadwal Pertandingan' },
  { href: '/admin/posts', icon: '📝', label: 'Berita & Artikel', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/players', icon: '🥎', label: 'Pemain terdaftar' },
  { href: '/admin/clubs', icon: '🛡️', label: 'Daftar Club', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/struktur', icon: '🌳', label: 'Struktur Organisasi', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/admin/wasit-log', icon: '🏁', label: 'Log Wasit' },
]

const SUPER_ADMIN_ITEMS = [
  { href: '/admin/bank-accounts', icon: '🏦', label: 'Rekening Bank' },
  { href: '/admin/payment-methods', icon: '💳', label: 'Metode Pembayaran' },
  { href: '/admin/admins', icon: '👥', label: 'Kelola Admin' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role as string) || 'ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const userName = session?.user?.name || 'Admin'
  const userInitial = userName.charAt(0).toUpperCase()

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const canAccess = (item: (typeof NAV_ITEMS)[number]) => {
    if (!item.roles) return true
    return item.roles.includes(role)
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <aside className="w-64 bg-brand text-white flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-brand-2">
          <span className="text-xl font-bold text-amber-400">Admin IPF</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.filter(canAccess).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item)
                  ? 'bg-brand-2 text-white font-medium'
                  : 'text-slate-400 hover:bg-brand-2 hover:text-white'
              }`}
            >
              <span className="w-5 text-center text-base leading-none shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            </Link>
          ))}
          {isSuperAdmin && (
            <>
              <div className="border-t border-brand-2 my-2" />
              {SUPER_ADMIN_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item)
                      ? 'bg-brand-2 text-white font-medium'
                      : 'text-slate-400 hover:bg-brand-2 hover:text-white'
                  }`}
                >
                  <span className="w-5 text-center text-base leading-none shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </>
          )}
          <a
            href="/wasit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-brand-2 hover:text-white transition-colors"
          >
            <span className="w-5 text-center text-base leading-none shrink-0">🔗</span>
            <span className="truncate">Buka Portal Wasit</span>
          </a>
        </nav>

        <div className="p-4 border-t border-brand-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-brand-2 text-slate-300 rounded-lg hover:text-white hover:bg-[#334155] transition-colors text-sm"
          >
            <span>&larr;</span> Lihat Website
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dashboard Panel</h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Halo, {userName}
            </span>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white">
              {userInitial}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
