import { Suspense } from 'react'
import Providers from '@/components/Providers'
import AdminShell from './AdminShell'

function AdminShellFallback() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 animate-pulse">
      <div className="w-64 shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:block" />
      <div className="flex-1 p-6 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="h-12 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700" />
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-16 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var dark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
              } catch(e) {}
            })();
          `,
        }}
      />
      {/* AdminShell memakai useSession/usePathname (data tidak di-cache),
          jadi wajib dibungkus Suspense agar rumah admin tidak memblokir render. */}
      <Suspense fallback={<AdminShellFallback />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </Providers>
  )
}
