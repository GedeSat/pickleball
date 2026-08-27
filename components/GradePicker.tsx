"use client";

import React, { useEffect, useState } from "react";
import {
  ALL_TOURNAMENT_GRADES,
  gradeToLabel,
  normalizeGradeInput,
} from "@/lib/tournamentGrades";

interface GradePickerProps {
  /** Nama hidden input wajib, berisi JSON array grade terpilih */
  fieldName?: string;
  /** Grade awal yang terpilih (mis. dari turnamen yang diedit) */
  defaultGrades?: string[];
  /** Grade preset yang ditampilkan sebagai checkbox */
  presets?: readonly string[];
  label?: string;
  hint?: string;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export default function GradePicker({
  fieldName = "grades",
  defaultGrades = [],
  presets = ALL_TOURNAMENT_GRADES,
  label = "Tingkat Pertandingan yang Tersedia",
  hint = "Pilih tingkat yang dibuka untuk pendaftaran, atau ketik tingkat lain bebas (misal: U12, U22). Pilihan ini yang muncul di form pendaftaran.",
}: GradePickerProps) {
  const defaultKey = defaultGrades.map(normalizeGradeInput).sort().join(",");
  const [selected, setSelected] = useState<string[]>(() =>
    dedupe(defaultGrades.map(normalizeGradeInput))
  );
  const [customValue, setCustomValue] = useState("");

  // Sinkronkan bila data turnamen baru tersedia (load async dari API)
  useEffect(() => {
    setSelected(dedupe(defaultGrades.map(normalizeGradeInput)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKey]);

  const toggle = (grade: string) => {
    setSelected((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const addCustom = (raw: string) => {
    const tokens = raw
      .split(/[\s,;]+/)
      .map(normalizeGradeInput)
      .filter(Boolean);
    if (tokens.length === 0) return;
    setSelected((prev) => dedupe([...prev, ...tokens]));
    setCustomValue("");
  };

  return (
    <div className="space-y-3 md:col-span-2 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
      <label className="text-sm font-medium text-slate-700 block">
        {label} *
      </label>
      <p className="text-xs text-slate-500">{hint}</p>

      {/* Checkbox preset */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
        {presets.map((grade) => {
          const normalized = normalizeGradeInput(grade);
          const checked = selected.includes(normalized);
          return (
            <label
              key={grade}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                checked
                  ? "bg-primary-50 border-primary text-primary-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-primary"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(normalized)}
                className="accent-primary w-4 h-4"
              />
              {gradeToLabel(grade)}
            </label>
          );
        })}
      </div>

      {/* Input grade custom / bebas */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom(customValue);
            }
          }}
          placeholder="Tingkat lain... contoh: U12, U22 (pisahkan dengan koma)"
          className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
        />
        <button
          type="button"
          onClick={() => addCustom(customValue)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-[#ffffff] rounded-lg text-sm font-medium transition-colors"
        >
          Tambah
        </button>
      </div>

      {/* Chip grade terpilih (termasuk custom) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((grade) => (
            <span
              key={grade}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-[#ffffff] text-xs font-semibold"
            >
              {gradeToLabel(grade)}
              <button
                type="button"
                onClick={() => toggle(grade)}
                aria-label={`Hapus ${grade}`}
                className="hover:text-amber-200 transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-amber-600">
          Pilih minimal satu tingkat, atau tambahkan tingkat kustom di atas.
        </p>
      )}

      <input type="hidden" name={fieldName} value={JSON.stringify(selected)} />
    </div>
  );
}