'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  showConfirm,
  showDeleteConfirm,
  showError,
  showSuccess,
  showWarning,
} from '@/lib/swal';
import {
  assignMemberAction,
  createPoolAction,
  generateMatchesAction,
  moveMemberAction,
  removeMemberAction,
  resetCategoryAction,
} from './actions';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import SearchInput from '@/components/SearchInput';
import { formatSlotToken } from '@/lib/bracketSlot';
import { buildPoolMatrix } from '@/lib/poolMatrix';
import { exportToExcelMulti } from '@/lib/exportUtils';
import PoolBracketMatrix from './PoolBracketMatrix';

export type PoolManagerMember = {
  id: number;
  type: 'PLAYER' | 'TEAM';
  name: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
};

export type PoolManagerMatch = {
  id: number;
  member1Id: number;
  member2Id: number;
  member1Name: string;
  member2Name: string;
  score1: number | null;
  score2: number | null;
  status: string;
  winnerId: number | null;
  winnerName: string | null;
};

export type PoolManagerPool = {
  id: number;
  label: string;
  poolCode: string;
  maxSize: number;
  status: string;
  memberCount: number;
  members: Array<{
    id: number;
    memberName: string;
    playerId: number | null;
    teamId: number | null;
    rank: number | null;
    played: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDiff: number;
  }>;
  matches: PoolManagerMatch[];
};

export type PoolManagerCategory = {
  categoryKey: string;
  label: string;
  grade: string;
  gender: string | null;
  matchType: string;
  pools: PoolManagerPool[];
  unassigned: PoolManagerMember[];
};

export type PoolManagerTournament = {
  id: number;
  name: string;
  poolSize: number;
};

function PaymentBadge({ member }: { member: PoolManagerMember }) {
  if (member.paymentStatus === 'PAID') {
    return <Badge color="emerald">✅ Lunas</Badge>;
  }
  if (member.paymentMethod === 'VENUE') {
    return <Badge color="amber">🏟️ Bayar di Tempat</Badge>;
  }
  return <Badge color="red">⏳ Belum Bayar</Badge>;
}

function sectionAnchor(key: string) {
  return `cat-${key}`;
}

export default function PoolManagerClient({
  tournament,
  categories,
}: {
  tournament: PoolManagerTournament;
  categories: PoolManagerCategory[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async (
    fn: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string
  ): Promise<boolean> => {
    if (pending) return false;
    setPending(true);
    try {
      const res = await fn();
      if (res.success) {
        showSuccess(successMsg);
        router.refresh();
        return true;
      } else {
        showError(res.error ?? 'Terjadi kesalahan');
        return false;
      }
    } catch (e) {
      console.error(e);
      showError('Terjadi kesalahan');
      return false;
    } finally {
      setPending(false);
    }
  };

  const ALL_KEY = '__ALL__';

  const [selectedKey, setSelectedKey] = useState<string>(ALL_KEY);

  const selectedCategory =
    selectedKey === ALL_KEY
      ? null
      : categories.find((c) => c.categoryKey === selectedKey) ?? null;

  const totalUnassigned = categories.reduce(
    (sum, c) => sum + c.unassigned.length,
    0
  );

  if (categories.length === 0) {
    return (
      <EmptyState
        icon="🏸"
        title="Belum Ada Peserta"
        description="Kategori akan muncul setelah ada peserta yang mendaftar turnamen ini."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab kategori — pilih satu kategori, atau lihat semua sekaligus */}
      {categories.length > 1 && (
        <div className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto px-1 py-2 bg-gradient-to-b from-white via-white/95 to-white/0">
          <button
            type="button"
            onClick={() => setSelectedKey(ALL_KEY)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              selectedKey === ALL_KEY
                ? 'border-slate-900 bg-slate-900 text-[#ffffff]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-900/30 hover:text-slate-900'
            }`}
          >
            Semua Kategori
            {totalUnassigned > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-brand">
                {totalUnassigned}
              </span>
            )}
          </button>
          <div className="w-px shrink-0 bg-slate-200" />
          {categories.map((cat) => {
            const isActive = cat.categoryKey === selectedKey;
            return (
              <button
                key={cat.categoryKey}
                type="button"
                onClick={() => setSelectedKey(cat.categoryKey)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-[#ffffff]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-900/30 hover:text-slate-900'
                }`}
              >
                {cat.label}
                {cat.unassigned.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-brand">
                    {cat.unassigned.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-5">
        {(selectedCategory ? [selectedCategory] : categories).map((cat) => (
          <CategorySection
            key={cat.categoryKey}
            cat={cat}
            pending={pending}
            onAssign={(member, poolId) =>
              run(
                () =>
                  assignMemberAction(
                    tournament.id,
                    cat.categoryKey,
                    member.type,
                    member.id,
                    poolId
                  ),
                `${member.name} dimasukkan ke pool!`
              )
            }
            onMove={(memberId, newPoolId) =>
              run(
                () => moveMemberAction(memberId, newPoolId),
                'Peserta dipindahkan!'
              )
            }
            onRemove={(memberId) =>
              run(
                () => removeMemberAction(memberId),
                'Peserta dikeluarkan dari pool.'
              )
            }
            onCreate={() =>
              run(
                () => createPoolAction(tournament.id, cat.categoryKey),
                'Pool baru berhasil dibuat!'
              )
            }
            onGenerate={() =>
              run(
                () => generateMatchesAction(tournament.id, cat.categoryKey),
                'Pertandingan berhasil digenerate!'
              )
            }
            onGenerateBracket={() =>
              run(
                async () => {
                  const firstPoolId = cat.pools[0]?.id;
                  if (!firstPoolId) {
                    return { success: false, error: 'Belum ada pool untuk kategori ini' };
                  }
                  const res = await fetch(
                    `/api/tournaments/${tournament.id}/pools/${firstPoolId}/bracket`,
                    { method: 'POST' }
                  );
                  const data = await res.json().catch(() => ({}));
                  return {
                    success: data.success === true,
                    error: data.error ?? 'Gagal generate bracket',
                  };
                },
                'Bagan gugur berhasil dibuat dari pool!'
              )
            }
            onBuildBracket={(slots) =>
              run(
                async () => {
                  const firstPoolId = cat.pools[0]?.id;
                  if (!firstPoolId) {
                    return { success: false, error: 'Belum ada pool untuk kategori ini' };
                  }
                  const res = await fetch(
                    `/api/tournaments/${tournament.id}/pools/${firstPoolId}/bracket`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ template: true, slots }),
                    }
                  );
                  const data = await res.json().catch(() => ({}));
                  return {
                    success: data.success === true,
                    error: data.error ?? 'Gagal membuat template bagan',
                  };
                },
                'Template bagan berhasil dibuat! Slot peringkat tampil di Bagan.'
              )
            }
            onFillBracket={() =>
              run(
                async () => {
                  const firstPoolId = cat.pools[0]?.id;
                  if (!firstPoolId) {
                    return { success: false, error: 'Belum ada pool untuk kategori ini' };
                  }
                  const res = await fetch(
                    `/api/tournaments/${tournament.id}/pools/${firstPoolId}/bracket`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ fill: true }),
                    }
                  );
                  const data = await res.json().catch(() => ({}));
                  return {
                    success: data.success === true,
                    error: data.error ?? 'Gagal mengisi otomatis',
                  };
                },
                'Slot bagan berhasil diisi dari peringkat pool!'
              )
            }
            onReset={() =>
              run(
                () => resetCategoryAction(tournament.id, cat.categoryKey),
                'Pool kategori berhasil di-reset.'
              )
            }
            onScore={(pool, matchId, score1, score2) =>
              run(
                async () => {
                  const res = await fetch(
                    `/api/tournaments/${tournament.id}/pools/${pool.id}/matches`,
                    {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ matchId, score1, score2 }),
                    }
                  );
                  const data = await res.json().catch(() => ({}));
                  return {
                    success: data.success === true,
                    error: data.error ?? 'Gagal menyimpan skor',
                  };
                },
                'Skor berhasil diupdate 📝'
              )
            }
            onResetScore={(pool, match) =>
              run(
                async () => {
                  const res = await fetch(
                    `/api/tournaments/${tournament.id}/pools/${pool.id}/matches`,
                    {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ matchId: match.id, reset: true }),
                    }
                  );
                  const data = await res.json().catch(() => ({}));
                  return {
                    success: data.success === true,
                    error: data.error ?? 'Gagal reset skor',
                  };
                },
                'Skor berhasil direset 🔄'
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Bagian satu kategori: header aksi + search + pool + daftar belum masuk
// ----------------------------------------------------------------
function CategorySection({
  cat,
  pending,
  onAssign,
  onMove,
  onRemove,
  onCreate,
  onGenerate,
  onGenerateBracket,
  onBuildBracket,
  onFillBracket,
  onReset,
  onScore,
  onResetScore,
}: {
  cat: PoolManagerCategory;
  pending: boolean;
  onAssign: (member: PoolManagerMember, poolId: number) => void;
  onMove: (memberId: number, newPoolId: number) => void;
  onRemove: (memberId: number) => void;
  onCreate: () => void;
  onGenerate: () => void;
  onGenerateBracket: () => void;
  onBuildBracket: (slots: string[]) => void;
  onFillBracket: () => void;
  onReset: () => void;
  onScore: (
    pool: PoolManagerPool,
    matchId: number,
    score1: number,
    score2: number
  ) => Promise<boolean>;
  onResetScore: (
    pool: PoolManagerPool,
    match: PoolManagerMatch
  ) => Promise<boolean>;
}) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  // State modal "Atur Bagan" (template slot peringkat)
  const [bracketOpen, setBracketOpen] = useState(false);
  const [topN, setTopN] = useState(2);
  const [slots, setSlots] = useState<Array<{ poolCode: string; rank: number } | null>>([]);

  // Susun slot mengikuti PERINGKAT yang sudah tergenerate setelah bagan grup:
  // ambil top-N per pool sesuai rank asli yang terhitung (rank 1, 2, ...).
  // Pool yang belum punya rank (fase grup belum selesai) otomatis di-skip,
  // lalu pad dengan BYE sampai kelipatan 2.
  const buildDefaultSlots = (n: number) => {
    const hasAnyRank = cat.pools.some((p) =>
      p.members.some((m) => m.rank != null && m.rank >= 1)
    );
    const s: Array<{ poolCode: string; rank: number } | null> = [];

    if (hasAnyRank) {
      // Ikuti peringkat yang sudah tergenerate per pool
      for (let r = 1; r <= n; r++) {
        for (const p of cat.pools) {
          const hasRank = p.members.some((m) => m.rank === r);
          if (hasRank) s.push({ poolCode: p.poolCode, rank: r });
        }
      }
    } else {
      // Fase grup belum selesai: default peringkat 1..n tiap pool
      for (let r = 1; r <= n; r++) {
        for (const p of cat.pools) {
          s.push({ poolCode: p.poolCode, rank: r });
        }
      }
    }

    let size = 2;
    while (size < s.length) size *= 2;
    while (s.length < size) s.push(null);
    return s;
  };

  const openBracketModal = () => {
    setTopN(2);
    setSlots(buildDefaultSlots(2));
    setBracketOpen(true);
  };

  // Label babak sederhana (Final → Semifinal → Perempatfinal → Babak N)
  const roundLabel = (round: number) => {
    const matchesInRound = slots.length / Math.pow(2, round + 1);
    if (matchesInRound === 1) return 'Final';
    if (matchesInRound === 2) return 'Semifinal';
    if (matchesInRound === 4) return 'Perempatfinal';
    return `Babak ${round + 1}`;
  };

  const totalRounds = Math.max(1, Math.log2(Math.max(2, slots.length)));

  // Apakah peringkat pool sudah terhitung (setelah bagan grup selesai)?
  const hasAnyRank = cat.pools.some((p) =>
    p.members.some((m) => m.rank != null && m.rank >= 1)
  );

  // Ringkasan ramah dari sebuah slot: "@@A:1@@" → "Juara Pool A"
  const slotSummary = (s: { poolCode: string; rank: number } | null) => {
    if (!s) return 'BYE — langsung lolos';
    const pool = cat.pools.find((p) => p.poolCode === s.poolCode);
    const name = pool?.label ?? `Pool ${s.poolCode}`;
    if (s.rank === 1) return `Juara ${name}`;
    if (s.rank === 2) return `Runner-up ${name}`;
    return `Peringkat ${s.rank} — ${name}`;
  };

  // Jumlah peringkat yang TERSEDIA di pool tsb (rank yang sudah terhitung).
  // Belum ada rank (fase grup belum selesai) → fallback 12 seperti sebelumnya.
  const maxRankFor = (poolCode: string) => {
    const pool = cat.pools.find((p) => p.poolCode === poolCode);
    if (!pool) return 12;
    const ranks = pool.members
      .map((m) => m.rank)
      .filter((r): r is number => r != null && r >= 1);
    return ranks.length > 0 ? Math.max(...ranks) : 12;
  };

  // Editor satu slot peserta di dalam bagan (dropdown Pool + Peringkat)
  const renderSlotEditor = (
    idx: number,
    slot: { poolCode: string; rank: number } | null
  ) => {
    const bye = slot === null;
    const currentPool = bye ? '' : slot.poolCode;
    return (
      <div
        title={slotSummary(slot)}
        className={`px-2.5 py-2 flex items-center gap-1.5 border-b border-slate-100 last:border-b-0 ${
          bye ? 'bg-amber-50/60' : 'bg-white'
        }`}
      >
        <select
          value={currentPool}
          onChange={(e) => {
            const code = e.target.value;
            setSlots((prev) =>
              prev.map((s, i) => {
                if (i !== idx) return s;
                if (!code) return null;
                // Clamp rank agar sesuai jumlah peringkat pool baru
                const maxRank = maxRankFor(code);
                const rank = Math.min(s?.rank ?? 1, maxRank);
                return { poolCode: code, rank };
              })
            );
          }}
          className="flex-1 min-w-0 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none bg-white"
        >
          <option value="">— BYE —</option>
          {cat.pools.map((p) => (
            <option key={p.id} value={p.poolCode}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={bye ? 1 : slot.rank}
          disabled={bye}
          onChange={(e) => {
            const rank = Number(e.target.value);
            setSlots((prev) =>
              prev.map((s, i) => (i === idx && s ? { ...s, rank } : s))
            );
          }}
          className="w-[118px] shrink-0 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none bg-white disabled:opacity-40"
        >
          {Array.from(
            { length: maxRankFor(bye ? '' : slot.poolCode) },
            (_, i) => i + 1
          ).map((r) => (
            <option key={r} value={r}>
              {r === 1
                ? '1 · Juara'
                : r === 2
                ? '2 · Runner-up'
                : `Peringkat ${r}`}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const saveBracket = () => {
    const realSlots = slots.filter((s): s is { poolCode: string; rank: number } => s !== null);
    if (realSlots.length < 2) {
      showWarning('Minimal 2 slot harus terisi untuk membuat bagan.');
      return;
    }
    const tokens = slots.map((s) =>
      s ? formatSlotToken(s.poolCode, s.rank) : 'BYE'
    );
    setBracketOpen(false);
    onBuildBracket(tokens);
  };

  const handleFillBracket = async () => {
    if (cat.pools.length === 0) {
      showWarning('Buat pool dulu sebelum mengisi bagan.');
      return;
    }
    const ok = await showConfirm(
      'Isi otomatis slot bagan dari peringkat pool yang sudah dihitung? Slot yang masih bertoken akan diganti nama peserta sesuai peringkatnya.',
      'Isi Otomatis 🔄',
      'Ya, Isi',
      'Batal'
    );
    if (!ok) return;
    onFillBracket();
  };

  const filteredUnassigned = cat.unassigned.filter((m) =>
    m.name.toLowerCase().includes(q)
  );
  const filteredPools = cat.pools.map((pool) => ({
    ...pool,
    members: pool.members.filter((m) => m.memberName.toLowerCase().includes(q)),
  }));

  const handleGenerate = async () => {
    if (cat.pools.length === 0) {
      showWarning('Buat pool dulu sebelum generate pertandingan.');
      return;
    }
    const ok = await showConfirm(
      'Generate pertandingan round-robin untuk semua pool kategori ini? Match lama akan di-reset.',
      'Generate Pertandingan 🎾',
      'Ya, Generate',
      'Batal'
    );
    if (!ok) return;
    onGenerate();
  };

  const handleReset = async () => {
    const ok = await showDeleteConfirm(
      `Semua pool di kategori "${cat.label}" (beserta anggota & pertandingannya) akan dihapus. Lanjutkan?`,
      'Reset Pool Kategori 🗑️'
    );
    if (!ok) return;
    onReset();
  };

  const handleGenerateBracket = async () => {
    if (cat.pools.length === 0) {
      showWarning('Buat pool dulu sebelum generate bracket.');
      return;
    }
    const ok = await showConfirm(
      'Buat bagan gugur dari juara & runner-up (peringkat 1-2) semua pool kategori ini? Bagan lama akan diganti.',
      'Buat Bagan Gugur 🏆',
      'Ya, Generate',
      'Batal'
    );
    if (!ok) return;
    onGenerateBracket();
  };

  // Export bagan SEMUA pool kategori ini — tab "Pool" (matrix) & tab "Klasemen"
  const handleExportAllPoolsExcel = () => {
    if (cat.pools.length === 0) return;

    const poolRows: (string | number)[][] = [];
    const standingsRows: (string | number)[][] = [];
    const sortedPools = cat.pools
      .slice()
      .sort((a, b) =>
        a.poolCode.localeCompare(b.poolCode, 'en', { numeric: true })
      );

    sortedPools.forEach((pool) => {
      const matrix = buildPoolMatrix({
        poolId: pool.id,
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
      });

      poolRows.push([]);
      poolRows.push([`POOL ${matrix.poolCode} — ${pool.label}`]);
      poolRows.push(['Peserta', ...matrix.members.map((m) => `${m.code} ${m.name}`)]);
      matrix.members.forEach((row, i) => {
        poolRows.push([
          `${row.code} ${row.name}`,
          ...matrix.members.map((_, j) => {
            const cell = matrix.cells[i][j];
            if (
              cell &&
              cell.status === 'DONE' &&
              cell.rowScore !== null &&
              cell.colScore !== null
            ) {
              return `${cell.rowScore}–${cell.colScore}`;
            }
            return '–';
          }),
        ]);
      });

      standingsRows.push([]);
      standingsRows.push([`POOL ${matrix.poolCode} — ${pool.label}`]);
      standingsRows.push(['Peringkat', 'Kode', 'Nama', 'Menang', 'Kalah', 'Selisih Poin']);
      matrix.standings.forEach((s) =>
        standingsRows.push([s.rank, s.code, s.name, s.wins, s.losses, s.pointDiff])
      );
    });

    const safeLabel = cat.label.replace(/[^a-zA-Z0-9]/g, '_');
    exportToExcelMulti(`Bagan_${safeLabel}`, [
      { name: 'Pool', headers: [], rows: poolRows.slice(1) },
      { name: 'Klasemen', headers: [], rows: standingsRows.slice(1) },
    ]);
  };

  return (
    <section
      id={sectionAnchor(cat.categoryKey)}
      className="scroll-mt-16 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header Kategori */}
      <div className="bg-gradient-to-r from-brand to-brand-2 text-[#ffffff]">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-black text-lg uppercase tracking-wide">
              {cat.label}
            </h2>
            <p className="text-xs text-[rgba(255,255,255,0.7)] mt-0.5">
              {cat.unassigned.length} peserta belum masuk pool · {cat.pools.length}{' '}
              pool
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
          <button
            onClick={onCreate}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg bg-gold hover:bg-amber-500 disabled:opacity-50 text-brand text-xs font-bold transition-colors"
          >
            ➕ Buat Pool
          </button>
            <button
              onClick={handleGenerate}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] disabled:opacity-50 text-[#ffffff] text-xs font-bold transition-colors ring-1 ring-[rgba(255,255,255,0.15)]"
            >
              🎾 Generate Pertandingan
            </button>
            <button
              onClick={handleGenerateBracket}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] disabled:opacity-50 text-[#ffffff] text-xs font-bold transition-colors ring-1 ring-[rgba(255,255,255,0.15)]"
            >
              ⚡ Buat Bagan Gugur
            </button>
            <button
              onClick={openBracketModal}
              disabled={pending || cat.pools.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] disabled:opacity-50 text-[#ffffff] text-xs font-bold transition-colors ring-1 ring-[rgba(255,255,255,0.15)]"
            >
              🗂️ Atur Bagan Gugur
            </button>
            <button
              onClick={handleFillBracket}
              disabled={pending || cat.pools.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] disabled:opacity-50 text-[#ffffff] text-xs font-bold transition-colors ring-1 ring-[rgba(255,255,255,0.15)]"
            >
              🔁 Isi Otomatis
            </button>
            <button
              onClick={handleExportAllPoolsExcel}
              disabled={pending || cat.pools.length === 0}
              title="Export bagan semua pool (A, B, C, …) kategori ini dalam satu file Excel"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-50 text-[#ffffff] text-xs font-bold transition-colors"
            >
              📥 Export Bagan
            </button>
            <button
              onClick={handleReset}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.8)] hover:bg-[#EF4444] disabled:opacity-50 text-[#ffffff] text-xs font-bold transition-colors"
            >
              🗑️ Reset Pool
            </button>
          </div>
      </div>

      {/* Search per kategori */}
          <div className="px-5 py-3 border-b border-slate-100">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nama peserta di kategori ini..."
              containerClassName="relative w-full md:w-72"
              resultCount={filteredUnassigned.length}
            />
          </div>

          {cat.pools.length === 0 ? (
            <EmptyState
              dashed
              icon="📦"
              title="Belum Ada Pool"
              description={
                <>
                  Klik <strong>&quot;Buat Pool&quot;</strong> untuk membuat Pool
                  A, lalu tempatkan peserta di bawah.
                </>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {filteredPools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  cat={cat}
                  pool={pool}
                  pending={pending}
                  hasQuery={!!q}
                  onMove={(memberId, newPoolId) => onMove(memberId, newPoolId)}
                  onRemove={(memberId) => onRemove(memberId)}
                  onScore={(matchId, score1, score2) =>
                    onScore(pool, matchId, score1, score2)
                  }
                  onResetScore={(match) => onResetScore(pool, match)}
                />
              ))}
            </div>
          )}

          {/* Peserta belum masuk pool */}
          <div className="border-t border-slate-100">
            <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">
                📋 Peserta Belum Masuk Pool ({filteredUnassigned.length})
              </h3>
              {filteredUnassigned.length > 0 && cat.pools.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Pilih pool lalu klik Masuk
                </span>
              )}
            </div>
            {filteredUnassigned.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">
                {q
                  ? 'Tidak ada peserta yang cocok dengan pencarian.'
                  : 'Semua peserta sudah masuk pool. ✅'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredUnassigned.map((member) => (
                  <UnassignedRow
                    key={`${member.type}-${member.id}`}
                    member={member}
                    pools={cat.pools}
                    pending={pending}
                    onAssign={(poolId) => onAssign(member, poolId)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Modal: Atur Bagan Gugur (template slot peringkat) */}
          {bracketOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      🗂️ Atur Bagan Gugur — {cat.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Klik kotak di Babak 1 untuk memilih pool &amp; peringkat
                      pengisinya. Saat fase grup selesai, nama peserta masuk
                      otomatis.
                    </p>
                  </div>
                  <button
                    onClick={() => setBracketOpen(false)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Panduan cara pakai */}
                <div className="px-6 pt-5">
                  <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-xs text-sky-900">
                    💡 Klik kotak di <b>Babak 1</b>, pilih <b>Pool</b> &amp;{" "}
                    <b>Peringkat</b> (mis. &quot;Pool A&quot; · &quot;1 ·
                    Juara&quot;). Slot &quot;— BYE —&quot; = kosong (peserta
                    langsung lolos). Pemenang otomatis maju ke babak berikutnya.
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-sm font-semibold text-slate-700">
                      Peserta yang lolos dari tiap pool:
                    </label>
                    <select
                      value={topN}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setTopN(n);
                        setSlots(buildDefaultSlots(n));
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none"
                    >
                      <option value={1}>1 (Juara saja)</option>
                      <option value={2}>2 (Juara &amp; Runner-up)</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                    <button
                      onClick={() => setSlots(buildDefaultSlots(topN))}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      🔄 Susun Otomatis
                    </button>
                    <span className="text-xs text-slate-400">
                      {slots.length} posisi · {totalRounds} babak
                    </span>
                    {hasAnyRank && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold">
                        ✓ Mengikuti peringkat pool yang sudah dihitung
                      </span>
                    )}
                  </div>

                  {cat.pools.length === 0 ? (
                    <p className="text-sm text-amber-600">
                      Buat pool dulu sebelum mengatur bagan.
                    </p>
                  ) : (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3">
                        🏟️ Bagan (edit langsung di Babak 1)
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          pemenang otomatis maju ke babak berikutnya
                        </span>
                      </h4>
                      <div className="overflow-x-auto pb-2">
                        <div className="flex items-start gap-3 min-w-[720px]">
                          {Array.from({ length: totalRounds }, (_, r) => {
                            const matchesInRound =
                              slots.length / Math.pow(2, r + 1);
                            return (
                              <div
                                key={r}
                                className={`flex-1 ${
                                  r === 0 ? 'min-w-[300px]' : 'min-w-[150px]'
                                }`}
                              >
                                <div className="text-center text-xs font-extrabold uppercase tracking-wider text-brand-2 mb-3 bg-slate-100 rounded-lg py-1.5">
                                  {roundLabel(r)}
                                </div>
                                <div className="space-y-3">
                                  {Array.from(
                                    { length: matchesInRound },
                                    (_, m) =>
                                      r === 0 ? (
                                        <div
                                          key={m}
                                          className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
                                        >
                                          {renderSlotEditor(m * 2, slots[m * 2])}
                                          {renderSlotEditor(
                                            m * 2 + 1,
                                            slots[m * 2 + 1]
                                          )}
                                        </div>
                                      ) : (
                                        <div
                                          key={m}
                                          className="border border-dashed border-slate-200 rounded-lg overflow-hidden"
                                        >
                                          <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100">
                                            Pemenang {m * 2 + 1}
                                          </div>
                                          <div className="px-3 py-2 text-xs text-slate-400">
                                            Pemenang {m * 2 + 2}
                                          </div>
                                        </div>
                                      )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={() => setBracketOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveBracket}
                    disabled={pending || cat.pools.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-[#ffffff] text-sm font-bold hover:bg-primary hover:text-[#ffffff] disabled:opacity-50 transition-colors"
                  >
                    💾 Simpan Bagan
                  </button>
                </div>
              </div>
            </div>
          )}
    </section>
  );
}

// ----------------------------------------------------------------
// Kartu pool: daftar anggota + pertandingan (skor) + pindah/keluar
// ----------------------------------------------------------------
function PoolCard({
  cat,
  pool,
  pending,
  hasQuery,
  onMove,
  onRemove,
  onScore,
  onResetScore,
}: {
  cat: PoolManagerCategory;
  pool: PoolManagerPool;
  pending: boolean;
  hasQuery: boolean;
  onMove: (memberId: number, newPoolId: number) => void;
  onRemove: (memberId: number) => void;
  onScore: (
    matchId: number,
    score1: number,
    score2: number
  ) => Promise<boolean>;
  onResetScore: (match: PoolManagerMatch) => Promise<boolean>;
}) {
  const otherPools = cat.pools.filter((p) => p.id !== pool.id);

  // State modal input skor
  const [scoreTarget, setScoreTarget] = useState<PoolManagerMatch | null>(null);
  const [tempScore1, setTempScore1] = useState('');
  const [tempScore2, setTempScore2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State modal bagan grup (matrix round-robin)
  const [matrixOpen, setMatrixOpen] = useState(false);

  const openScoreModal = (m: PoolManagerMatch) => {
    setScoreTarget(m);
    setTempScore1('');
    setTempScore2('');
  };

  const submitScore = async () => {
    if (!scoreTarget) return;
    if (tempScore1 === '' || tempScore2 === '') return;
    const s1 = Number(tempScore1);
    const s2 = Number(tempScore2);
    if (s1 === s2) {
      showWarning('Skor tidak boleh seri dalam sistem pool ⚠️');
      return;
    }
    setSubmitting(true);
    try {
      const ok = await onScore(scoreTarget.id, s1, s2);
      if (ok) {
        setScoreTarget(null);
        setTempScore1('');
        setTempScore2('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetScore = async (m: PoolManagerMatch) => {
    const ok = await showConfirm(
      `Reset skor "${m.member1Name} vs ${m.member2Name}"? Peringkat pool akan dihitung ulang.`,
      'Reset Skor 🔄',
      'Ya, Reset',
      'Batal'
    );
    if (!ok) return;
    await onResetScore(m);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2">
        <h4 className="font-bold text-sm text-slate-900 truncate">
          {pool.label}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setMatrixOpen(true)}
            disabled={pending || pool.members.length < 2}
            title="Lihat bagan grup (matrix round-robin)"
            className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-[#ffffff] hover:bg-primary hover:text-[#ffffff] disabled:opacity-50 transition-colors"
          >
            📊 Bagan
          </button>
          <Badge
            color={
              pool.status === 'FULL'
                ? 'emerald'
                : pool.status === 'COMPLETED'
                ? 'slate'
                : 'indigo'
            }
          >
            {pool.memberCount}/{pool.maxSize}
          </Badge>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 flex-1">
        {pool.members.length === 0 ? (
          <li className="px-4 py-3 text-xs text-slate-400">
            {hasQuery
              ? 'Tidak ada anggota yang cocok dengan pencarian.'
              : 'Belum ada anggota. Tambahkan dari daftar peserta di bawah.'}
          </li>
        ) : (
          pool.members.map((m) => (
            <li
              key={m.id}
              className="px-4 py-2 flex items-center gap-2 text-sm"
            >
              <span
                title={m.rank ? `Peringkat ${m.rank}` : 'Belum ada peringkat'}
                className={`shrink-0 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                  m.rank === 1
                    ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                    : m.rank === 2
                    ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-300'
                    : m.rank === 3
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    : m.rank
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-50 text-slate-300'
                }`}
              >
                {m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : m.rank ?? '–'}
              </span>
              <span className="flex-1 font-semibold text-slate-800 truncate">
                {m.memberName}
              </span>
              {m.played > 0 && (
                <span className="shrink-0 text-[10px] font-semibold text-slate-400 tabular-nums">
                  M:{m.played} · S:{m.wins}-{m.losses} · ±{m.pointDiff > 0 ? '+' : ''}
                  {m.pointDiff}
                </span>
              )}
              {otherPools.length > 0 && (
                <select
                  value=""
                  disabled={pending}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    e.target.value = '';
                    if (v) onMove(m.id, v);
                  }}
                  className="shrink-0 text-[11px] font-bold px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
                >
                  <option value="">Pindah...</option>
                  {otherPools.map((p) => (
                    <option key={p.id} value={p.id}>
                      → {p.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => onRemove(m.id)}
                disabled={pending}
                title="Keluarkan dari pool"
                className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Keluar
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Daftar pertandingan pool */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          🎾 Pertandingan ({pool.matches.length})
        </h5>
        {pool.matches.length === 0 ? (
          <p className="text-xs text-slate-400">
            Klik &quot;🎾 Generate Pertandingan&quot; di atas untuk membuat
            jadwal round-robin.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {pool.matches.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 text-xs bg-white rounded-lg border border-slate-200 px-2.5 py-1.5"
              >
                <span
                  className={`flex-1 min-w-0 truncate font-semibold ${
                    m.status === 'DONE' &&
                    m.winnerName === m.member1Name
                      ? 'text-slate-900'
                      : 'text-slate-700'
                  }`}
                >
                  {m.member1Name}
                </span>
                {m.status === 'DONE' ? (
                  <>
                    <span className="shrink-0 font-mono font-bold text-slate-900">
                      {m.score1} – {m.score2}
                    </span>
                    <span
                      className={`flex-1 min-w-0 truncate font-semibold text-right ${
                        m.winnerName === m.member2Name
                          ? 'text-slate-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {m.member2Name}
                    </span>
                    <Badge color="emerald">Selesai</Badge>
                    <button
                      onClick={() => handleResetScore(m)}
                      disabled={pending}
                      title="Reset skor"
                      className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                    >
                      🔄 Reset
                    </button>
                  </>
                ) : (
                  <>
                    <span className="shrink-0 text-[10px] font-bold text-slate-400">
                      VS
                    </span>
                    <span className="flex-1 min-w-0 truncate font-semibold text-right text-slate-700">
                      {m.member2Name}
                    </span>
                    <button
                      onClick={() => openScoreModal(m)}
                      disabled={pending}
                      className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-[#ffffff] hover:bg-primary hover:text-[#ffffff] disabled:opacity-50 transition-colors"
                    >
                      🏓 Input Skor
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal input skor */}
      {scoreTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 my-auto">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                🏓 Input Skor — {pool.label}
              </h3>
              <button
                onClick={() => setScoreTarget(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-right">
                  <input
                    type="number"
                    min={0}
                    value={tempScore1}
                    onChange={(e) => setTempScore1(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-2xl font-black text-slate-900 border-2 border-slate-200 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-900 tabular-nums"
                  />
                  <p className="mt-1.5 text-xs font-semibold text-slate-600 truncate">
                    {scoreTarget.member1Name}
                  </p>
                </div>
                <span className="text-sm font-black text-slate-300">VS</span>
                <div>
                  <input
                    type="number"
                    min={0}
                    value={tempScore2}
                    onChange={(e) => setTempScore2(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-2xl font-black text-slate-900 border-2 border-slate-200 rounded-xl px-3 py-3 focus:outline-none focus:border-slate-900 tabular-nums"
                  />
                  <p className="mt-1.5 text-xs font-semibold text-slate-600 truncate">
                    {scoreTarget.member2Name}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Skor tidak boleh seri. Setelah disimpan, peringkat pool
                dihitung ulang dan slot bagan otomatis terisi.
              </p>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setScoreTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitScore}
                disabled={
                  submitting ||
                  tempScore1 === '' ||
                  tempScore2 === '' ||
                  (tempScore1 !== '' &&
                    tempScore2 !== '' &&
                    Number(tempScore1) === Number(tempScore2))
                }
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-[#ffffff] text-sm font-bold hover:bg-primary hover:text-[#ffffff] disabled:opacity-50 transition-colors"
              >
                💾 Simpan Skor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal bagan grup (matrix round-robin) */}
      {matrixOpen && (
        <PoolBracketMatrix pool={pool} onClose={() => setMatrixOpen(false)} />
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Baris peserta yang belum masuk pool
// ----------------------------------------------------------------
function UnassignedRow({
  member,
  pools,
  pending,
  onAssign,
}: {
  member: PoolManagerMember;
  pools: PoolManagerPool[];
  pending: boolean;
  onAssign: (poolId: number) => void;
}) {
  const [poolId, setPoolId] = useState<number>(pools[0]?.id ?? 0);
  const selectedPool = pools.find((p) => p.id === poolId);
  const isFull = selectedPool
    ? selectedPool.memberCount >= selectedPool.maxSize
    : false;

  return (
    <li className="px-5 py-2.5 flex items-center gap-2 text-sm">
      <Badge color={member.type === 'TEAM' ? 'purple' : 'sky'}>
        {member.type === 'TEAM' ? 'TIM' : 'SINGLE'}
      </Badge>
      <span className="flex-1 font-semibold text-slate-800 truncate">
        {member.name}
      </span>
      <PaymentBadge member={member} />
      {pools.length > 0 ? (
        <>
          <select
            value={poolId}
            onChange={(e) => setPoolId(Number(e.target.value))}
            disabled={pending}
            className="shrink-0 text-[11px] font-bold px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
          >
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.memberCount >= p.maxSize ? ' (Penuh)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => poolId && onAssign(poolId)}
            disabled={pending || !poolId || isFull}
            className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-[#ffffff] hover:bg-primary hover:text-[#ffffff] disabled:opacity-50 transition-colors"
          >
            {isFull ? 'Pool Penuh' : 'Masuk'}
          </button>
        </>
      ) : (
        <span className="text-[11px] text-slate-400">
          Buat pool dulu di atas
        </span>
      )}
    </li>
  );
}