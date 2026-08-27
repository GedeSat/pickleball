import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";


const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  UPCOMING: "Akan Datang",
  ONGOING: "Berlangsung",
  COMPLETED: "Selesai",
  CANCELED: "Dibatalkan",
};

export default async function AdminSchedulePage() {
  const tournaments = await prisma.tournament.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      _count: { select: { pools: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
            📅
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Jadwal Pertandingan
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Atur nomor lapangan & waktu tanding. Pilih turnamen untuk mulai.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tournaments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 md:col-span-2">
            <span className="text-4xl block mb-2">🏸</span>
            <p className="font-semibold text-slate-700 dark:text-slate-300">Belum Ada Turnamen</p>
          </div>
        ) : (
          tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{t.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {new Date(t.startDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    —{" "}
                    {new Date(t.endDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 text-xs font-bold whitespace-nowrap">
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t._count.pools} pool terdaftar
                </span>
                <Link
                  href={`/admin/schedule/${t.id}`}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-[#ffffff] font-bold rounded-xl text-sm transition-all active:scale-95"
                >
                  Atur Jadwal →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
