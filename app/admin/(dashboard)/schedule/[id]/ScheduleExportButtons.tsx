"use client";

import { exportToExcel, exportToPdf, type ExportRow } from "@/lib/exportUtils";

export type ScheduleExportMatch = {
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

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Jadwal",
  ONGOING: "Berlangsung",
  DONE: "Selesai",
};

const HEADERS = [
  "No",
  "Jenis",
  "Grup",
  "Kategori",
  "Peserta 1",
  "Peserta 2",
  "Skor",
  "Lapangan",
  "Waktu",
  "Status",
];

function buildRows(matches: ScheduleExportMatch[]): ExportRow[] {
  return matches.map((m, i) => [
    i + 1,
    m.type === "pool" ? "Pool" : "Knockout",
    m.groupName,
    m.category,
    m.player1Name || "—",
    m.player2Name || "—",
    m.status === "DONE" && m.score1 !== null && m.score2 !== null
      ? `${m.score1}–${m.score2}`
      : "",
    m.court || "",
    m.startTime
      ? new Date(m.startTime).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    STATUS_LABEL[m.status] || m.status,
  ]);
}

export default function ScheduleExportButtons({
  tournamentName,
  matches,
}: {
  tournamentName: string;
  matches: ScheduleExportMatch[];
}) {
  const rows = buildRows(matches);
  const safeName = tournamentName.replace(/[^a-zA-Z0-9]/g, "_");

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() =>
          exportToExcel(`Jadwal_${safeName}`, "Jadwal", HEADERS, rows)
        }
        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-[#ffffff] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
        title="Export jadwal ke Excel"
      >
        📥 Export Excel
      </button>
      <button
        type="button"
        onClick={() =>
          exportToPdf(
            `Jadwal_${safeName}`,
            `Jadwal Pertandingan — ${tournamentName}`,
            `${matches.length} pertandingan (pool + gugur)`,
            HEADERS,
            rows
          )
        }
        className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
        title="Export jadwal ke PDF"
      >
        📄 Export PDF
      </button>
    </div>
  );
}