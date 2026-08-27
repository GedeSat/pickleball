import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categoryKeyToLabel } from "@/lib/categoryLabel";


const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  UPCOMING: "bg-amber-100 text-amber-700",
  ONGOING: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-indigo-100 text-indigo-700",
  CANCELED: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  UPCOMING: "Akan Datang",
  ONGOING: "Berlangsung",
  COMPLETED: "Selesai",
  CANCELED: "Dibatalkan",
};

const POOL_STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  FULL: "Penuh",
  COMPLETED: "Selesai",
};

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Belum Bayar",
  PAID: "Lunas",
};

const PAYMENT_BADGE: Record<string, string> = {
  UNPAID: "bg-amber-100 text-amber-700 border border-amber-200",
  PAID: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function AdminTournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: {
        include: { team: true },
        orderBy: { createdAt: "desc" },
      },
      teams: {
        include: { players: true },
        orderBy: { createdAt: "desc" },
      },
      pools: {
        include: {
          _count: { select: { members: true, matches: true } },
          matches: { where: { status: "DONE" } },
        },
        orderBy: { id: "asc" },
      },
      _count: { select: { knockoutMatches: true } },
    },
  });

  if (!tournament) return notFound();

  const singlePlayers = tournament.players.filter((p) => !p.teamId);
  const totalPendaftar = singlePlayers.length + tournament.teams.length;

  const poolDoneCount = tournament.pools.reduce(
    (acc, p) => acc + p.matches.length,
    0
  );
  const poolMatchCount = tournament.pools.reduce(
    (acc, p) => acc + p._count.matches,
    0
  );

  const fee = tournament.registrationFee;
  let paidCount = 0;
  let paidTotal = 0;
  let unpaidCount = 0;
  let unpaidTotal = 0;

  if (fee > 0) {
    for (const p of singlePlayers) {
      if (p.paymentStatus === "PAID") {
        paidCount += 1;
        paidTotal += fee;
      } else {
        unpaidCount += 1;
        unpaidTotal += fee;
      }
    }
    for (const t of tournament.teams) {
      if (t.paymentStatus === "PAID") {
        paidCount += 1;
        paidTotal += fee;
      } else {
        unpaidCount += 1;
        unpaidTotal += fee;
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/admin/tournaments"
        className="text-sm font-semibold text-primary-700 hover:text-primary-900 hover:underline inline-block"
      >
        &larr; Kembali ke Daftar Turnamen
      </Link>

      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-r from-brand to-brand-2 text-[#ffffff]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight truncate">
                {tournament.name}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {new Date(tournament.startDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                —{" "}
                {new Date(tournament.endDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                STATUS_BADGE[tournament.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {STATUS_LABEL[tournament.status] ?? tournament.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              href={`/admin/tournaments/${tournamentId}/pools`}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#ffffff] rounded-lg text-sm font-bold transition-colors"
            >
              🏊 Kelola Pool
            </Link>
            <Link
              href={`/admin/tournaments/${tournamentId}/brackets`}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-lg text-sm font-bold transition-colors"
            >
              🌳 Kelola Bagan
            </Link>
            <Link
              href={`/admin/schedule/${tournamentId}`}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-brand rounded-lg text-sm font-bold transition-colors"
            >
              📅 Atur Jadwal
            </Link>
            <Link
              href={`/admin/tournaments/${tournamentId}/edit`}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
            >
              ✏️ Edit
            </Link>
          </div>
        </div>

        {/* INFO SINGKAT */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-t border-slate-200 text-center">
          <div className="p-5">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Lokasi</p>
            <p className="font-semibold text-slate-800 text-sm truncate">
              {tournament.location}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Biaya Daftar</p>
            <p className="font-semibold text-slate-800 text-sm">
              {fee === 0 ? "Gratis" : rupiah.format(fee)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Maks. Peserta</p>
            <p className="font-semibold text-slate-800 text-sm">
              {tournament.maxParticipants} Tim
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Ukuran Pool</p>
            <p className="font-semibold text-slate-800 text-sm">
              {tournament.poolSize} member
            </p>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">👥 Total Pendaftar</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{totalPendaftar}</p>
          <p className="text-xs text-slate-400 mt-1">
            {singlePlayers.length} single • {tournament.teams.length} tim
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">🏊 Pool</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {tournament.pools.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {poolMatchCount} pertandingan total
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">⚔️ Fase Gugur</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {tournament._count.knockoutMatches}
          </p>
          <p className="text-xs text-slate-400 mt-1">pertandingan gugur</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-500 font-medium">✅ Pool Selesai</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{poolDoneCount}</p>
          <p className="text-xs text-slate-400 mt-1">dari {poolMatchCount} tanding</p>
        </div>
      </div>

      {/* RINGKASAN PEMBAYARAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">💰 Ringkasan Pembayaran</h2>
          <Link
            href="/admin/players"
            className="text-sm font-semibold text-primary-700 hover:text-primary-900 hover:underline"
          >
            Kelola Pembayaran →
          </Link>
        </div>
        <div className="p-6">
          {fee === 0 ? (
            <p className="text-sm text-slate-500">
              Turnamen ini gratis — tidak ada pembayaran yang perlu dikonfirmasi.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-sm font-semibold text-amber-700">⏳ Belum Bayar</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {unpaidCount} pendaftaran
                </p>
                <p className="text-sm font-medium text-amber-700">
                  {rupiah.format(unpaidTotal)}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <p className="text-sm font-semibold text-emerald-700">✓ Sudah Lunas</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {paidCount} pendaftaran
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  {rupiah.format(paidTotal)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DAFTAR POOL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">🏊 Daftar Pool</h2>
          <Link
            href={`/admin/tournaments/${tournamentId}/pools`}
            className="text-sm font-semibold text-primary-700 hover:text-primary-900 hover:underline"
          >
            Kelola Pool →
          </Link>
        </div>
        {tournament.pools.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            Belum ada pool. Buat pool di halaman kelola pool.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-4 font-semibold">Pool</th>
                  <th className="p-4 font-semibold">Kategori</th>
                  <th className="p-4 font-semibold text-center">Member</th>
                  <th className="p-4 font-semibold text-center">Tanding</th>
                  <th className="p-4 font-semibold text-center">Selesai</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tournament.pools.map((pool) => (
                  <tr key={pool.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">
                      {pool.label}
                    </td>
                    <td className="p-4 text-slate-600">
                      {categoryKeyToLabel(pool.categoryKey) ?? pool.categoryKey}
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-700">
                      {pool._count.members}
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      {pool._count.matches}
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      {pool.matches.length}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          pool.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : pool.status === "FULL"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {POOL_STATUS_LABEL[pool.status] ?? pool.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PENDAFTAR TERBARU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">📋 Pendaftar Terbaru</h2>
          <Link
            href="/admin/players"
            className="text-sm font-semibold text-primary-700 hover:text-primary-900 hover:underline"
          >
            Semua Pemain →
          </Link>
        </div>
        {totalPendaftar === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            Belum ada pendaftar untuk turnamen ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Kategori</th>
                  <th className="p-4 font-semibold">Tingkat</th>
                  <th className="p-4 font-semibold">Tipe</th>
                  <th className="p-4 font-semibold">Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {singlePlayers.slice(0, 10).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-900">
                      {p.fullName}
                    </td>
                    <td className="p-4 text-slate-600">
                      {p.gender === "MALE" ? "Putra" : "Putri"}
                    </td>
                    <td className="p-4 text-slate-600">{p.grade}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700">
                        Single
                      </span>
                    </td>
                    <td className="p-4">
                      {fee === 0 ? (
                        <span className="text-xs text-emerald-600 font-semibold">
                          Gratis
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            PAYMENT_BADGE[p.paymentStatus ?? "UNPAID"]
                          }`}
                        >
                          {PAYMENT_LABEL[p.paymentStatus ?? "UNPAID"]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {tournament.teams.slice(0, 10).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-900">{t.name}</td>
                    <td className="p-4 text-slate-600">
                      {t.matchType === "MIXED"
                        ? "Campuran"
                        : t.matchType === "DOUBLE"
                        ? "Ganda"
                        : "-"}
                    </td>
                    <td className="p-4 text-slate-600">{t.grade}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700">
                        {t.matchType === "MIXED" ? "Mix" : "Double"}
                      </span>
                    </td>
                    <td className="p-4">
                      {fee === 0 ? (
                        <span className="text-xs text-emerald-600 font-semibold">
                          Gratis
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            PAYMENT_BADGE[t.paymentStatus ?? "UNPAID"]
                          }`}
                        >
                          {PAYMENT_LABEL[t.paymentStatus ?? "UNPAID"]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
