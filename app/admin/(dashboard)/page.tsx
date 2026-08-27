import React from "react";
import { prisma } from '@/lib/prisma';
import Link from "next/link";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';


// Tipe data gabungan untuk satu baris aktivitas
type ActivityItem = {
  id: number;
  type: "turnamen" | "pemain" | "berita" | "club";
  title: string;
  createdAt: Date;
};

// Ambil waktu relatif sederhana (mis. "5 menit lalu", "2 hari lalu")
function getRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Konfigurasi tampilan per jenis aktivitas
type ActivityConfig = {
  icon: string;
  label: string;
  bg: string;
  text: string;
};

const activityConfig: { [key in ActivityItem["type"]]: ActivityConfig } = {
  turnamen: { 
    icon: "🏆", 
    label: "Turnamen baru ditambahkan", 
    bg: "bg-white dark:bg-slate-800", 
    text: "text-slate-900 dark:text-slate-100" 
  },
  pemain: { 
    icon: "👥", 
    label: "Pemain baru terdaftar", 
    bg: "bg-white dark:bg-slate-800", 
    text: "text-slate-900 dark:text-slate-100" 
  },
  berita: { 
    icon: "📝", 
    label: "Berita baru dipublikasikan", 
    bg: "bg-white dark:bg-slate-800", 
    text: "text-slate-900 dark:text-slate-100" 
  },
  club: { 
    icon: "🛡️", 
    label: "Club afiliasi baru ditambahkan", 
    bg: "bg-white dark:bg-slate-800", 
    text: "text-slate-900 dark:text-slate-100" 
  },
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string) || 'ADMIN';
  const isMatchAdmin = role === 'MATCH_ADMIN';

  // Menarik data jumlah baris dari MySQL secara paralel agar loading lebih cepat
  // Asumsi: Kamu sudah membuat model di schema.prisma untuk tabel-tabel ini
  const [totalTurnamen, totalPemain, totalBerita, totalClub] = await Promise.all([
    prisma.tournament.count({ where: { deletedAt: null } }),   // Menghitung total turnamen
    prisma.player.count(),                         // Menghitung total pemain
    prisma.post.count(),                           // Menghitung total artikel/berita
    prisma.club.count()                            // Menghitung total club afiliasi
  ]);

  // Ambil 5 data terbaru dari masing-masing tabel, lalu gabungkan & urutkan
  const [recentTurnamen, recentPemain, recentBerita, recentClub] = await Promise.all([
    prisma.tournament.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.player.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, createdAt: true },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.club.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  // ============================================================
  // DATA PEMBAYARAN — SINGLE = 1 pembayaran per Player,
  // DOUBLE/MIXED = 1 pembayaran per Team. Gratis (fee 0) dikecualikan.
  // ============================================================
  const [paymentPlayers, paymentTeams, activeTournaments] = await Promise.all([
    prisma.player.findMany({
      where: { teamId: null },
      select: {
        paymentStatus: true,
        tournamentId: true,
        tournament: { select: { registrationFee: true } },
      },
    }),
    prisma.team.findMany({
      select: {
        paymentStatus: true,
        tournamentId: true,
        tournament: { select: { registrationFee: true } },
      },
    }),
    prisma.tournament.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  // Gabungkan unit pembayaran (player SINGLE + team) menjadi satu daftar
  const paymentUnits = [
    ...paymentPlayers.map((p) => ({
      tournamentId: p.tournamentId,
      fee: p.tournament.registrationFee,
      status: p.paymentStatus,
    })),
    ...paymentTeams.map((t) => ({
      tournamentId: t.tournamentId,
      fee: t.tournament.registrationFee,
      status: t.paymentStatus,
    })),
  ];

  // Akumulasi per turnamen: belum bayar & lunas + total nominal
  const perTournament = new Map<
    number,
    { unpaidCount: number; unpaidTotal: number; paidCount: number; paidTotal: number }
  >();

  for (const unit of paymentUnits) {
    if (unit.fee <= 0) continue; // Gratis tidak dihitung
    const agg = perTournament.get(unit.tournamentId) ?? {
      unpaidCount: 0,
      unpaidTotal: 0,
      paidCount: 0,
      paidTotal: 0,
    };
    if (unit.status === "PAID") {
      agg.paidCount += 1;
      agg.paidTotal += unit.fee;
    } else {
      agg.unpaidCount += 1;
      agg.unpaidTotal += unit.fee;
    }
    perTournament.set(unit.tournamentId, agg);
  }

  // Total keseluruhan
  let totalUnpaidCount = 0;
  let totalUnpaidNominal = 0;
  let totalPaidCount = 0;
  let totalPaidNominal = 0;
  for (const agg of perTournament.values()) {
    totalUnpaidCount += agg.unpaidCount;
    totalUnpaidNominal += agg.unpaidTotal;
    totalPaidCount += agg.paidCount;
    totalPaidNominal += agg.paidTotal;
  }

  // 5 turnamen dengan tunggakan terbesar
  const topTunggakan = [...perTournament.entries()]
    .filter(([, agg]) => agg.unpaidCount > 0)
    .map(([tournamentId, agg]) => ({
      name: activeTournaments.find((t) => t.id === tournamentId)?.name ?? `Turnamen #${tournamentId}`,
      ...agg,
    }))
    .sort((a, b) => b.unpaidTotal - a.unpaidTotal)
    .slice(0, 5);

  const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  const allActivities: ActivityItem[] = [
    ...recentTurnamen.map((t) => ({ id: t.id, type: "turnamen" as const, title: t.name, createdAt: t.createdAt })),
    ...recentPemain.map((p) => ({ id: p.id, type: "pemain" as const, title: p.fullName, createdAt: p.createdAt })),
    ...recentBerita.map((b) => ({ id: b.id, type: "berita" as const, title: b.title, createdAt: b.createdAt })),
    ...recentClub.map((c) => ({ id: c.id, type: "club" as const, title: c.name, createdAt: c.createdAt })),
  ];

  const activities = (isMatchAdmin
    ? allActivities.filter((a) => a.type === 'turnamen' || a.type === 'pemain')
    : allActivities
  )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Ringkasan Sistem</h1>

      {/* KOTAK STATISTIK (Cards) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isMatchAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6`}>
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-200/20 text-primary-700 dark:text-primary-200 rounded-xl flex items-center justify-center text-2xl">
            🏆
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Total Turnamen</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalTurnamen}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-200/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Pemain Terdaftar</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalPemain}</p>
          </div>
        </div>

        {!isMatchAdmin && (
          <>
            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-200/20 text-primary-700 dark:text-primary-200 rounded-xl flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Berita Aktif</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalBerita}</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-200/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-2xl">
                🛡️
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Club Afiliasi</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalClub}</p>
              </div>
            </div>
          </>
        )}

      </div>

      {/* BAGIAN RINGKASAN PEMBAYARAN — hanya untuk ADMIN/SUPER_ADMIN */}
      {!isMatchAdmin && (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Ringkasan Pembayaran</h2>
            <Link
              href="/admin/players"
              className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-primary-100 hover:underline"
            >
              Kelola Pembayaran →
            </Link>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Belum Bayar */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-2xl">
                  ⏳
                </div>
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold">Belum Bayar</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalUnpaidCount} pendaftaran</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">{rupiah.format(totalUnpaidNominal)}</p>
                </div>
              </div>

              {/* Sudah Lunas */}
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">Sudah Lunas</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalPaidCount} pendaftaran</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{rupiah.format(totalPaidNominal)}</p>
                </div>
              </div>
            </div>

            {/* Tunggakan per turnamen */}
            {topTunggakan.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Turnamen dengan tunggakan terbesar
                </p>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  {topTunggakan.map((t) => (
                    <li key={t.name} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 text-sm">
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{t.name}</span>
                      <span className="flex items-center gap-4 shrink-0">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{t.unpaidCount} orang</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{rupiah.format(t.unpaidTotal)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  * Berbayar (biaya &gt; 0). DOUBLE/MIXED dihitung 1x per tim.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BAGIAN TABEL AKTIVITAS TERBARU */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Aktivitas Terbaru</h2>
        </div>
        <div className="p-6">
          {activities.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">Belum ada aktivitas terbaru hari ini.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700/80">
              {activities.map((item) => {
                const config = activityConfig[item.type];
                return (
                  <li key={`${item.type}-${item.id}`} className="flex items-center gap-4 py-4">
                    <div
                      className={`w-10 h-10 shrink-0 ${config.bg} ${config.text} rounded-lg flex items-center justify-center text-lg`}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        <span className="font-medium">{config.label}:</span>{" "}
                        <span className="text-slate-600 dark:text-slate-400">{item.title}</span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {getRelativeTime(item.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
