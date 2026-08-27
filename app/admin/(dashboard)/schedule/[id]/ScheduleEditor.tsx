"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSchedule } from "../action";
import type { ScheduleEntry } from "../action";
import { showSuccess, showError } from "@/lib/swal";

export type MatchRow = {
  type: "pool" | "knockout";
  id: number;
  court: string | null;
  startTime: string | null;
  score1: number | null;
  score2: number | null;
  status: string;
  player1Name: string | null;
  player2Name: string | null;
  groupName: string;
  category: string;
};

type EntryMap = Record<string, { court: string; startTime: string }>;

const toLocalInput = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Terjadwal ⏳",
  ONGOING: "Sedang Main 🎾",
  DONE: "Selesai ✓",
};

export default function ScheduleEditor({
  tournamentId,
  matches,
}: {
  tournamentId: number;
  matches: MatchRow[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<EntryMap>(() => {
    const map: EntryMap = {};
    for (const m of matches) {
      map[`${m.type}-${m.id}`] = {
        court: m.court ?? "",
        startTime: toLocalInput(m.startTime),
      };
    }
    return map;
  });
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const setEntry = (key: string, field: "court" | "startTime", value: string) => {
    setEntries((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        (m.player1Name ?? "").toLowerCase().includes(q) ||
        (m.player2Name ?? "").toLowerCase().includes(q) ||
        m.groupName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [matches, query]);

  const filledCount = Object.values(entries).filter(
    (e) => e.court.trim() !== "" || e.startTime !== ""
  ).length;

  const handleSave = async () => {
    const payload: ScheduleEntry[] = filtered.map((m) => {
      const e = entries[`${m.type}-${m.id}`];
      return {
        type: m.type,
        id: m.id,
        court: e?.court ?? "",
        startTime: e?.startTime ? new Date(e.startTime).toISOString() : null,
      };
    });

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("tournamentId", String(tournamentId));
      fd.append("entries", JSON.stringify(payload));
      await saveSchedule(fd);
      showSuccess("Jadwal pertandingan berhasil disimpan.");
      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal menyimpan jadwal."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Cari pemain / pool / kategori..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-72 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm text-slate-500 whitespace-nowrap">
            {filtered.length} match · {filledCount} terisi
          </span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-[#ffffff] font-bold rounded-xl transition-all active:scale-95"
        >
          {isSaving ? "Menyimpan..." : "💾 Simpan Semua"}
        </button>
      </div>

      {/* Daftar match */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
          <span className="text-4xl block mb-2">🏸</span>
          <p className="font-semibold text-slate-700">Tidak Ada Pertandingan</p>
          <p className="text-xs text-slate-400 mt-1">
            Match akan muncul setelah pool/knockout dibuat.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5 font-bold">Pool / Ronde</th>
                  <th className="py-4 px-5 font-bold">Pertandingan</th>
                  <th className="py-4 px-5 font-bold w-28">Lapangan</th>
                  <th className="py-4 px-5 font-bold w-56">Waktu</th>
                  <th className="py-4 px-5 font-bold w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => {
                  const key = `${m.type}-${m.id}`;
                  const entry = entries[key];
                  return (
                    <tr key={key} className="hover:bg-primary-50/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="inline-flex px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-[11px] font-extrabold uppercase whitespace-nowrap">
                          {m.groupName}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">{m.category}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800 whitespace-nowrap">
                          {m.player1Name || "Menunggu"}
                        </p>
                        <p className="text-slate-400 text-[11px]">vs</p>
                        <p className="font-semibold text-slate-800 whitespace-nowrap">
                          {m.player2Name || "Menunggu"}
                        </p>
                      </td>
                      <td className="py-3.5 px-5">
                        <input
                          type="text"
                          value={entry?.court ?? ""}
                          onChange={(e) => setEntry(key, "court", e.target.value)}
                          placeholder="mis. 1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-3.5 px-5">
                        <input
                          type="datetime-local"
                          value={entry?.startTime ?? ""}
                          onChange={(e) => setEntry(key, "startTime", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                            m.status === "DONE"
                              ? "bg-emerald-100 text-emerald-700"
                              : m.status === "ONGOING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {STATUS_LABEL[m.status] ?? m.status}
                        </span>
                        {m.score1 !== null && m.score2 !== null && (
                          <span className="block text-[11px] text-slate-400 mt-1">
                            {m.score1} : {m.score2}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}