"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showDeleteConfirm, showConfirm, showSuccess, showError } from "@/lib/swal";

type Tournament = {
  id: number;
  name: string;
  location: string;
  category: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  refereeCode: string | null;
  isCodeActive: boolean;
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELED", label: "Canceled" },
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
  UPCOMING: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
  ONGOING: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  COMPLETED: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
  CANCELED: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
};

// Hanya turnamen dengan status ini yang bisa diarsipkan
const ARCHIVABLE_STATUSES = ["COMPLETED", "CANCELED"];

export default function TournamentTable({
  tournaments,
  archivedTournaments = [],
}: {
  tournaments: Tournament[];
  archivedTournaments?: Tournament[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"aktif" | "arsip">("aktif");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currentList = tab === "aktif" ? tournaments : archivedTournaments;

  const categories = useMemo(() => {
    const values = tournaments
      .concat(archivedTournaments)
      .map((t) => t.category)
      .filter((c): c is string => !!c);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "id"));
  }, [tournaments, archivedTournaments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return currentList.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        t.name.toLowerCase().includes(query) ||
        t.location.toLowerCase().includes(query) ||
        (t.category ?? "").toLowerCase().includes(query)
      );
    });
  }, [currentList, search, statusFilter, categoryFilter]);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("id-ID");

  async function handleArchive(t: Tournament) {
    const confirmed = await showDeleteConfirm(
      `Turnamen "${t.name}" akan diarsipkan. Data pertandingan tetap tersimpan sebagai history dan bisa dipulihkan kapan saja.`,
      "Yakin Arsipkan? 🗃️"
    );
    if (!confirmed) return;

    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/tournaments/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`Turnamen "${t.name}" berhasil diarsipkan.`, "Diarsipkan 🗃️");
        router.refresh();
      } else {
        showError(data.message || "Gagal mengarsipkan turnamen.");
      }
    } catch {
      showError("Terjadi kesalahan jaringan.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRestore(t: Tournament) {
    const confirmed = await showConfirm(
      `Turnamen "${t.name}" akan kembali ke daftar aktif.`,
      "Pulihkan Turnamen? ♻️",
      "Ya, Pulihkan"
    );
    if (!confirmed) return;

    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/tournaments/${t.id}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`Turnamen "${t.name}" berhasil dipulihkan.`, "Dipulihkan ♻️");
        router.refresh();
      } else {
        showError(data.message || "Gagal memulihkan turnamen.");
      }
    } catch {
      showError("Terjadi kesalahan jaringan.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePermanentDelete(t: Tournament) {
    const firstConfirm = await showDeleteConfirm(
      `Turnamen CANCELED "${t.name}" akan dihapus PERMANEN beserta semua data pertandingannya.`,
      "Yakin Hapus Permanen? 🗑️"
    );
    if (!firstConfirm) return;

    const secondConfirm = await showConfirm(
      "Ini langkah terakhir: data yang dihapus TIDAK BISA dikembalikan. Lanjutkan?",
      "Konfirmasi Terakhir ⚠️",
      "Ya, Hapus Permanen"
    );
    if (!secondConfirm) return;

    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/tournaments/${t.id}?permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`Turnamen "${t.name}" dihapus permanen.`, "Terhapus 🗑️");
        router.refresh();
      } else {
        showError(data.message || "Gagal menghapus turnamen.");
      }
    } catch {
      showError("Terjadi kesalahan jaringan.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Tab Aktif / Arsip */}
      <div className="flex gap-1 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30">
        <button
          type="button"
          onClick={() => setTab("aktif")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "aktif"
              ? "bg-white dark:bg-slate-800 text-primary-800 dark:text-primary-300 shadow-sm border border-slate-200 dark:border-slate-600"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Aktif ({tournaments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("arsip")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "arsip"
              ? "bg-white dark:bg-slate-800 text-primary-800 dark:text-primary-300 shadow-sm border border-slate-200 dark:border-slate-600"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Arsip ({archivedTournaments.length})
        </button>
      </div>

      {/* Toolbar Filter */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama turnamen, lokasi, atau kategori..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none transition-all"
          >
            <option value="ALL">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none transition-all"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Hasil */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        {filtered.length} dari {currentList.length} turnamen ditemukan
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm">
              <th className="p-4 font-semibold">Nama Turnamen</th>
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 font-semibold">Tanggal</th>
              <th className="p-4 font-semibold">Lokasi</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  {currentList.length === 0
                    ? tab === "aktif"
                      ? "Belum ada turnamen. Silakan tambah turnamen baru!"
                      : "Belum ada turnamen yang diarsipkan."
                    : "Tidak ada turnamen yang cocok dengan pencarian/filter saat ini."}
                </td>
              </tr>
            ) : (
              filtered.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tournament.name}
                      {tournament.refereeCode && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${
                            tournament.isCodeActive
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 ring-slate-200 dark:ring-slate-600"
                          }`}
                        >
                          Wasit {tournament.isCodeActive ? "● Aktif" : "○ Nonaktif"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {tournament.category ? (
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-200/10 text-primary-700 dark:text-primary-300 whitespace-nowrap">
                        {tournament.category}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{tournament.location}</td>
                  <td className="p-4">
                    {tab === "arsip" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        🗃️ Diarsipkan
                      </span>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_BADGE[tournament.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {tournament.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {tab === "arsip" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRestore(tournament)}
                          disabled={deletingId === tournament.id}
                          className="inline-block px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingId === tournament.id ? "..." : "♻️ Pulihkan"}
                        </button>
                        {tournament.status === "CANCELED" && (
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(tournament)}
                            disabled={deletingId === tournament.id}
                            className="inline-block px-3 py-1.5 bg-danger text-[#ffffff] hover:bg-danger-hover rounded-md font-medium transition-colors disabled:opacity-50"
                            title="Hapus permanen beserta semua data (khusus CANCELED)"
                          >
                            {deletingId === tournament.id ? "..." : "🗑️ Hapus Permanen"}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/admin/tournaments/${tournament.id}/brackets`}
                          className="inline-block px-3 py-1.5 bg-primary-50 dark:bg-primary-200/10 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-200/20 rounded-md font-medium transition-colors"
                          title="Kelola Bagan Pertandingan"
                        >
                          🌳 Bagan
                        </Link>
                        <Link
                          href={`/admin/tournaments/${tournament.id}/pools`}
                          className="inline-block px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md font-medium transition-colors"
                          title="Kelola Pool & Penempatan Peserta"
                        >
                          🏊 Pool
                        </Link>
                        <Link
                          href={`/admin/tournaments/${tournament.id}/edit`}
                          className="inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md font-medium transition-colors"
                        >
                          Edit
                        </Link>
                        {ARCHIVABLE_STATUSES.includes(tournament.status) && (
                          <button
                            type="button"
                            onClick={() => handleArchive(tournament)}
                            disabled={deletingId === tournament.id}
                            className="inline-block px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md font-medium transition-colors disabled:opacity-50"
                            title="Arsipkan turnamen (soft delete)"
                          >
                            {deletingId === tournament.id ? "..." : "🗑️ Hapus"}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}