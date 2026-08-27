'use client';

import React, { useState } from 'react';
import { categoryKeyToLabel } from '@/lib/categoryLabel'; 

type MatchItem = {
  id: number;
  type: 'POOL' | 'KNOCKOUT' | 'GROUP';
  groupOrPoolName: string;
  category: string;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  status: string;
  court?: string | null;
  startTime?: string | null;
  winner?: string | null;
};

type PoolStandingsItem = {
  poolName: string;
  category: string;
  members: Array<{
    name: string;
    played: number;
    wins: number;
    losses: number;
    pointDiff: number;
    rank?: number | null;
  }>;
};

type MemberLike = {
  player?: { fullName?: string | null } | null;
  team?: { name?: string | null } | null;
};

type PoolMemberLike = MemberLike & {
  played?: number;
  wins?: number;
  losses?: number;
  pointDiff?: number;
  rank?: number | null;
};

type LegacyMemberLike = {
  playerName?: string;
  played?: number;
  wins?: number;
  losses?: number;
  pointDiff?: number;
  rank?: number | null;
};

type PoolLike = {
  label?: string;
  categoryKey?: string;
  members?: PoolMemberLike[];
  matches?: Array<{
    id: number;
    score1?: number | null;
    score2?: number | null;
    status?: string;
    court?: string | null;
    startTime?: string | Date | null;
    winnerName?: string | null;
    member1?: MemberLike | null;
    member2?: MemberLike | null;
  }>;
};

type GroupLike = {
  name?: string;
  category?: string;
  members?: LegacyMemberLike[];
  matches?: Array<{
    id: number;
    score1?: number | null;
    score2?: number | null;
    status?: string;
    winnerName?: string | null;
    player1Name?: string | null;
    player2Name?: string | null;
  }>;
};

type KnockoutLike = {
  id: number;
  round?: number;
  category?: string;
  score1?: number | null;
  score2?: number | null;
  status?: string;
  court?: string | null;
  startTime?: string | Date | null;
  winnerName?: string | null;
  player1Name?: string | null;
  player2Name?: string | null;
};

type TournamentLike = {
  pools?: PoolLike[];
  groups?: GroupLike[];
  knockoutMatches?: KnockoutLike[];
};

// FUNGSI BARU: Smart formatter untuk merapikan nama kategori
// Jika categoryKeyToLabel tidak punya kamusnya, ini akan merapikan secara otomatis.
const getDisplayCategory = (cat: string) => {
  if (!cat) return 'Tanpa Kategori';
  
  // Coba pakai label dari lib/categoryLabel
  const mappedLabel = categoryKeyToLabel(cat);
  
  // Jika berhasil di-map dan hasilnya bukan undefined/kosong atau tidak sama persis dengan raw cat
  if (mappedLabel && mappedLabel !== cat) {
    return mappedLabel;
  }
  
  // Fallback: Rapikan manual (contoh: "double_mix" atau "DOUBLE_MIX" menjadi "Double Mix")
  return cat
    .replace(/[_]/g, ' ') // Ubah underscore jadi spasi
    .toLowerCase() // Jadikan huruf kecil semua
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Kapitalisasi awal kata
};

export default function ScheduleClient({ tournament }: { tournament: TournamentLike }) {
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'STANDINGS'>('SCHEDULE');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [poolFilter, setPoolFilter] = useState('ALL');

  // 1. Build match list
  const matches: MatchItem[] = [];

  if (tournament.pools) {
    for (const pool of tournament.pools) {
      for (const m of pool.matches ?? []) {
        const memberName = (x: MemberLike | null | undefined) =>
          x?.player?.fullName || x?.team?.name || null;
        matches.push({
          id: m.id,
          type: 'POOL',
          groupOrPoolName: pool.label ?? '',
          category: pool.categoryKey ?? '',
          player1: memberName(m.member1) || 'Menunggu',
          player2: memberName(m.member2) || 'Menunggu',
          score1: m.score1 ?? null,
          score2: m.score2 ?? null,
          status: m.status ?? 'SCHEDULED',
          court: m.court,
          startTime: m.startTime ? new Date(m.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null,
          winner: m.winnerName,
        });
      }
    }
  }

  if (tournament.groups) {
    for (const group of tournament.groups) {
      for (const m of group.matches ?? []) {
        matches.push({
          id: m.id,
          type: 'GROUP',
          groupOrPoolName: group.name ?? '',
          category: group.category ?? '',
          player1: m.player1Name || 'Menunggu',
          player2: m.player2Name || 'Menunggu',
          score1: m.score1 ?? null,
          score2: m.score2 ?? null,
          status: m.status ?? 'SCHEDULED',
          winner: m.winnerName,
        });
      }
    }
  }

  if (tournament.knockoutMatches) {
    for (const k of tournament.knockoutMatches) {
      matches.push({
        id: k.id,
        type: 'KNOCKOUT',
        groupOrPoolName: `Gugur Babak ${k.round ?? ''}`,
        category: k.category ?? '',
        player1: k.player1Name || 'Menunggu',
        player2: k.player2Name || 'Menunggu',
        score1: k.score1 ?? null,
        score2: k.score2 ?? null,
        status: k.status ?? 'SCHEDULED',
        court: k.court,
        startTime: k.startTime ? new Date(k.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null,
        winner: k.winnerName,
      });
    }
  }

  // 2. Build pool standings list
  const poolStandings: PoolStandingsItem[] = [];
  if (tournament.pools && tournament.pools.length > 0) {
    for (const pool of tournament.pools) {
      const members = (pool.members ?? []).map((m) => ({
        name: m.player?.fullName || m.team?.name || 'Pemain',
        played: m.played || 0,
        wins: m.wins || 0,
        losses: m.losses || 0,
        pointDiff: m.pointDiff || 0,
        rank: m.rank,
      })).sort((a, b) => (a.rank || 99) - (b.rank || 99));

      poolStandings.push({
        poolName: pool.label ?? '',
        category: pool.categoryKey ?? '',
        members,
      });
    }
  } else if (tournament.groups && tournament.groups.length > 0) {
    for (const group of tournament.groups) {
      const members = (group.members ?? []).map((m) => ({
        name: m.playerName + '',
        played: m.played || 0,
        wins: m.wins || 0,
        losses: m.losses || 0,
        pointDiff: m.pointDiff || 0,
        rank: m.rank,
      })).sort((a, b) => (a.rank || 99) - (b.rank || 99));

      poolStandings.push({
        poolName: group.name ?? '',
        category: group.category ?? '',
        members,
      });
    }
  }

  // 3. Extract unique categories & pools for dropdowns
  const uniqueCategories = Array.from(
    new Set([...matches.map((m) => m.category), ...poolStandings.map((p) => p.category)])
  ).filter((val) => val.trim() !== '');

  const uniquePools = Array.from(
    new Set([
      ...matches.filter(m => m.type !== 'KNOCKOUT').map((m) => m.groupOrPoolName),
      ...poolStandings.map((p) => p.poolName)
    ])
  ).filter((val) => val.trim() !== '');

  // 4. Filter data based on dropdowns & search
  const filteredMatches = matches.filter((m) => {
    const q = search.toLowerCase().trim();
    
    // Perbaikan Search: Sekarang menggunakan getDisplayCategory() juga agar lebih pintar
    const displayCat = getDisplayCategory(m.category).toLowerCase();
    
    const matchSearch =
      !q ||
      m.player1.toLowerCase().includes(q) ||
      m.player2.toLowerCase().includes(q) ||
      m.groupOrPoolName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      displayCat.includes(q);

    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    const matchPool = poolFilter === 'ALL' || m.groupOrPoolName === poolFilter;

    return matchSearch && matchStatus && matchCategory && matchPool;
  });

  const filteredStandings = poolStandings.filter((p) => {
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchPool = poolFilter === 'ALL' || p.poolName === poolFilter;
    return matchCategory && matchPool;
  });

  // 5. GROUPING DATA BY CATEGORY (Pengelompokan per kategori)
  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const cat = match.category || 'Tanpa Kategori';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(match);
    return acc;
  }, {} as Record<string, MatchItem[]>);

  const groupedStandings = filteredStandings.reduce((acc, pool) => {
    const cat = pool.category || 'Tanpa Kategori';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(pool);
    return acc;
  }, {} as Record<string, PoolStandingsItem[]>);

  return (
    <div className="space-y-6">
      {/* TABS & SEARCH HEADER */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl w-full xl:w-auto">
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all w-1/2 xl:w-auto ${
              activeTab === 'SCHEDULE'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            📅 Jadwal ({filteredMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('STANDINGS')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all w-1/2 xl:w-auto ${
              activeTab === 'STANDINGS'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            📊 Klasemen ({filteredStandings.length})
          </button>
        </div>

        {/* AREA FILTER */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {activeTab === 'SCHEDULE' && (
            <div className="relative w-full md:w-48">
              <input
                type="text"
                placeholder="Cari pemain/pool/kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>
          )}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary flex-1 md:flex-none"
          >
            <option value="ALL">Semua Kategori</option>
            {/* Pakai getDisplayCategory() agar double_mix tertangani dengan baik */}
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{getDisplayCategory(cat)}</option>
            ))}
          </select>

          <select
            value={poolFilter}
            onChange={(e) => setPoolFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary flex-1 md:flex-none"
          >
            <option value="ALL">Semua Pool</option>
            {uniquePools.map((poolName) => (
              <option key={poolName} value={poolName}>{poolName}</option>
            ))}
          </select>

          {activeTab === 'SCHEDULE' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary flex-1 md:flex-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="SCHEDULED">Mendatang</option>
              <option value="ONGOING">Sedang Tanding</option>
              <option value="DONE">Selesai</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB CONTENT 1: SCHEDULE */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-8">
          {Object.keys(groupedMatches).length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="text-4xl block mb-2">🏸</span>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Belum Ada Pertandingan Ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Jadwal pertandingan tidak ditemukan untuk filter ini.</p>
            </div>
          ) : (
            Object.keys(groupedMatches).map((category) => (
              <div key={category} className="space-y-4">
                {/* Header Kategori */}
                <div className="flex items-center gap-3 pb-2 border-b-2 border-primary-100">
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    {/* Header juga menggunakan getDisplayCategory() */}
                    Kategori: {getDisplayCategory(category)}
                  </h2>
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-bold ml-auto">
                    {groupedMatches[category].length} Pertandingan
                  </span>
                </div>

                {/* Grid Pertandingan per Kategori */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedMatches[category].map((m) => (
                    <div
                      key={`${m.type}-${m.id}`}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase line-clamp-1 ${
                          m.type === 'KNOCKOUT' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-primary-50 text-primary-700'
                        }`}>
                          {m.groupOrPoolName}
                        </span>
                        <span className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : m.status === 'ONGOING'
                            ? 'bg-amber-100 text-amber-700 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {m.status === 'DONE' ? 'Selesai ✓' : m.status === 'ONGOING' ? 'Sedang Main 🎾' : 'Terjadwal ⏳'}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-sm truncate flex-1 ${m.winner === m.player1 ? 'text-emerald-700' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m.player1}
                          </span>
                          <span className="font-black text-slate-900 dark:text-slate-100 ml-4 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">
                            {m.score1 !== null ? m.score1 : '-'}
                          </span>
                        </div>
                        <div className="border-t border-slate-200/60 dark:border-slate-600 my-1"></div>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-sm truncate flex-1 ${m.winner === m.player2 ? 'text-emerald-700' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m.player2}
                          </span>
                          <span className="font-black text-slate-900 dark:text-slate-100 ml-4 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">
                            {m.score2 !== null ? m.score2 : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>📍 {m.court ? `Lap. ${m.court}` : 'Lap. Belum Ada'}</span>
                        <span>🕒 {m.startTime || 'Waktu Belum Ada'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 2: STANDINGS */}
      {activeTab === 'STANDINGS' && (
        <div className="space-y-8">
          {Object.keys(groupedStandings).length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="text-4xl block mb-2">📊</span>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Belum Ada Klasemen Pool</p>
              <p className="text-xs text-slate-400 mt-1">Tidak ada klasemen yang sesuai dengan filter saat ini.</p>
            </div>
          ) : (
            Object.keys(groupedStandings).map((category) => (
              <div key={category} className="space-y-4">
                {/* Header Kategori untuk Klasemen */}
                <div className="flex items-center gap-3 pb-2 border-b-2 border-primary-100">
                  <span className="text-2xl">🏅</span>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    {/* Header Klasemen juga menggunakan getDisplayCategory() */}
                    Klasemen: {getDisplayCategory(category)}
                  </h2>
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-bold ml-auto">
                    {groupedStandings[category].length} Pool
                  </span>
                </div>

                {/* Grid Klasemen per Kategori */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {groupedStandings[category].map((pool, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-brand to-brand-2 px-5 py-3 text-[#ffffff] flex justify-between items-center">
                        <h3 className="font-bold text-base">{pool.poolName}</h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-700">
                              <th className="py-2.5 px-4 w-10">#</th>
                              <th className="py-2.5 px-4">Nama Peserta / Tim</th>
                              <th className="py-2.5 px-2 text-center w-12" title="Menang">M</th>
                              <th className="py-2.5 px-2 text-center w-12" title="Kalah">K</th>
                              <th className="py-2.5 px-3 text-center w-16" title="Selisih Poin">PD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {pool.members.map((m, i) => (
                              <tr key={i} className={m.rank === 1 ? 'bg-gold/20 font-semibold' : ''}>
                                <td className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400">
                                  {m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : m.rank || i + 1}
                                </td>
                                <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold">{m.name}</td>
                                <td className="py-3 px-2 text-center text-emerald-600 font-bold">{m.wins}</td>
                                <td className="py-3 px-2 text-center text-red-500 font-bold">{m.losses}</td>
                                <td className={`py-3 px-3 text-center font-bold ${m.pointDiff > 0 ? 'text-emerald-600' : m.pointDiff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {m.pointDiff > 0 ? `+${m.pointDiff}` : m.pointDiff}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}