'use client';

import { useMemo } from 'react';
import {
  buildPoolMatrix,
  type MatrixCell,
  type PoolMatrix,
  type PoolMatrixInput,
} from '@/lib/poolMatrix';
import { exportToExcelMulti } from '@/lib/exportUtils';
import type { PoolManagerPool } from './PoolManagerClient';

function exportPoolMatrixToExcel(pool: PoolMatrixInput, matrix: PoolMatrix) {
  const matrixHeaders = [
    'Peserta',
    ...matrix.members.map((m) => `${m.code} ${m.name}`),
  ];
  const matrixRows = matrix.members.map((row, i) => [
    `${row.code} ${row.name}`,
    ...matrix.members.map((_, j) => {
      const cell = matrix.cells[i][j];
      if (cell && cell.status === 'DONE' && cell.rowScore !== null && cell.colScore !== null) {
        return `${cell.rowScore}–${cell.colScore}`;
      }
      return '–';
    }),
  ]);

  // Dua tab: "Pool" (matrix) & "Klasemen"
  const standingsRows = matrix.standings.map((s) => [
    s.rank,
    s.code,
    s.name,
    s.wins,
    s.losses,
    s.pointDiff,
  ]);

  exportToExcelMulti(`Bagan_Pool_${matrix.poolCode}`, [
    { name: `Pool ${matrix.poolCode}`, headers: matrixHeaders, rows: matrixRows },
    {
      name: 'Klasemen',
      headers: ['Peringkat', 'Kode', 'Nama', 'Menang', 'Kalah', 'Selisih Poin'],
      rows: standingsRows,
    },
  ]);
}

function CodeChip({ code, className = '' }: { code: string; className?: string }) {
  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center rounded-md bg-slate-900 text-[#ffffff] dark:bg-brand-2 dark:text-[#ffffff] text-[10px] font-bold px-1.5 py-0.5 tabular-nums ${className}`}
    >
      {code}
    </span>
  );
}

function MemberName({ name }: { name: string }) {
  return (
    <span className="block min-w-0 max-w-36 truncate text-xs font-semibold text-slate-700">
      {name}
    </span>
  );
}

function MatrixCellView({ cell }: { cell: MatrixCell | null }) {
  if (!cell) {
    return (
      <td className="border border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-bold text-slate-500 select-none">
        –
      </td>
    );
  }
  if (cell.status === 'DONE' && cell.rowScore !== null && cell.colScore !== null) {
    return (
      <td
        className={`border border-slate-200 px-2 py-2 text-center font-mono text-sm font-bold tabular-nums select-none ${
          cell.rowWins
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-white text-slate-700'
        }`}
      >
        {cell.rowScore}–{cell.colScore}
      </td>
    );
  }
  return (
    <td className="border border-slate-200 bg-white px-2 py-2 text-center text-xs font-bold text-slate-500 select-none">
      –
    </td>
  );
}

// ============================================================
// TABEL MATRIX (presentational — dipakai inline maupun di modal)
// ============================================================
export function PoolMatrixTable({ pool }: { pool: PoolMatrixInput }) {
  const matrix: PoolMatrix = useMemo(
    () =>
      buildPoolMatrix({
        poolId: pool.id,
        poolCode: pool.poolCode,
        label: pool.label,
        members: pool.members,
        matches: pool.matches,
      }),
    [pool]
  );

  const doneCount = pool.matches.filter((m) => m.status === 'DONE').length;
  const champion = matrix.standings[0] ?? null;
  const runnerUp = matrix.standings[1] ?? null;

  return (
    <>
      {matrix.members.length < 2 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          Pool ini belum memiliki cukup peserta untuk bagan grup.
        </p>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => exportPoolMatrixToExcel(pool, matrix)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-[#ffffff] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              📥 Export Excel (Matrix + Klasemen)
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="border-collapse min-w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border border-slate-200 px-2 py-2 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Peserta
                  </span>
                </th>
                {matrix.members.map((col) => (
                  <th
                    key={col.id}
                    className="border border-slate-200 bg-slate-50 px-2 py-2 text-center align-bottom"
                  >
                    <div className="flex flex-col items-center gap-1 min-w-16">
                      <CodeChip code={col.code} />
                      <MemberName name={col.name} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.members.map((row, i) => (
                <tr key={row.id}>
                  <th className="sticky left-0 z-10 bg-white border border-slate-200 px-2 py-2 text-left">
                    <div className="flex items-center gap-1.5 min-w-24">
                      <CodeChip code={row.code} />
                      <MemberName name={row.name} />
                    </div>
                  </th>
                  {matrix.members.map((col, j) => (
                    <MatrixCellView
                      key={col.id}
                      cell={matrix.cells[i][j]}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {/* Keterangan highlight */}
      {matrix.members.length >= 2 && (
        <p className="mt-2 text-[11px] text-slate-400">
          <span className="inline-block w-3 h-3 rounded bg-emerald-100 ring-1 ring-emerald-200 align-[-1px] mr-1" />
          Sel hijau = pemain pada baris tersebut menang · skor dibaca
          &quot;baris–kolom&quot;
        </p>
      )}

      {/* Juara & Runner Up Grup */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
          🏆 Klasemen Grup
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <div
            className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
              champion
                ? 'bg-primary-50 ring-1 ring-amber-200'
                : 'bg-slate-50 ring-1 ring-slate-100'
            }`}
          >
            <span className="text-xl shrink-0">🥇</span>
            {champion ? (
              <>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary-800">
                    Juara Grup
                  </p>
                  <p className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                    <CodeChip code={champion.code} />
                    {champion.name}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-xs font-semibold text-slate-500 tabular-nums">
                  M {champion.wins}–{champion.losses} · ±
                  {champion.pointDiff > 0 ? '+' : ''}
                  {champion.pointDiff}
                </span>
              </>
            ) : (
              <p className="text-xs text-slate-400">—</p>
            )}
          </div>
          <div
            className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
              runnerUp
                ? 'bg-slate-100 ring-1 ring-slate-200'
                : 'bg-slate-50 ring-1 ring-slate-100'
            }`}
          >
            <span className="text-xl shrink-0">🥈</span>
            {runnerUp ? (
              <>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Runner Up Grup
                  </p>
                  <p className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                    <CodeChip code={runnerUp.code} />
                    {runnerUp.name}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-xs font-semibold text-slate-500 tabular-nums">
                  M {runnerUp.wins}–{runnerUp.losses} · ±
                  {runnerUp.pointDiff > 0 ? '+' : ''}
                  {runnerUp.pointDiff}
                </span>
              </>
            ) : (
              <p className="text-xs text-slate-400">—</p>
            )}
          </div>
        </div>
        {doneCount === 0 && matrix.members.length >= 2 && (
          <p className="mt-2 text-[11px] text-slate-400">
            Belum ada skor yang dimasukkan — peringkat dihitung dari
            pertandingan yang sudah selesai.
          </p>
        )}
      </div>
    </>
  );
}

// ============================================================
// MODAL BAGAN GRUP (dipakai dari Kelola Pool)
// ============================================================
export default function PoolBracketMatrix({
  pool,
  onClose,
}: {
  pool: PoolManagerPool;
  onClose: () => void;
}) {
  const input: PoolMatrixInput = useMemo(
    () => ({
      id: pool.id,
      poolCode: pool.poolCode,
      label: pool.label,
      members: pool.members.map((m) => ({ id: m.id, name: m.memberName })),
      matches: pool.matches.map((m) => ({
        id: m.id,
        member1Id: m.member1Id,
        member2Id: m.member2Id,
        score1: m.score1,
        score2: m.score2,
        winnerId: m.winnerId,
        status: m.status,
      })),
    }),
    [pool]
  );

  const doneCount = pool.matches.filter((m) => m.status === 'DONE').length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-auto">
        {/* Header teal + badge pool */}
        <div className="bg-brand-2 text-[#ffffff] px-5 py-4 rounded-t-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 inline-flex items-center rounded-lg bg-gold px-2.5 py-1 text-xs font-black uppercase tracking-wider text-brand">
              Pool {input.poolCode}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">
                {input.label}
              </h3>
              <p className="text-[11px] text-[rgba(255,255,255,0.7)] mt-0.5">
                {input.members.length} peserta · {doneCount} pertandingan
                selesai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup bagan"
            className="shrink-0 w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-[#ffffff] flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <PoolMatrixTable pool={input} />
        </div>
      </div>
    </div>
  );
}
