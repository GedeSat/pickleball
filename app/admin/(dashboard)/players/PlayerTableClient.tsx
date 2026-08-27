'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import PaymentActions from './PaymentActions';
import { exportToExcel, exportToPdf, type ExportRow } from '@/lib/exportUtils';
import { bulkConfirmPayment, bulkResetPayment, bulkDeletePlayers } from './action';
import { showConfirm, showSuccess, showError } from '@/lib/swal';

function CategoryBadge({ grade, gender, matchType }: { grade: string; gender: string | null; matchType: string }) {
  const genderLabel = gender === 'MALE' ? 'Putra' : gender === 'FEMALE' ? 'Putri' : '';
  const matchLabel = matchType === 'SINGLE' ? 'Single' : matchType === 'DOUBLE' ? 'Double' : 'Mixed';
  const label = matchType === 'MIXED' ? `${grade} Mixed` : `${grade} ${genderLabel} ${matchLabel}`;

  const styleMap: Record<string, string> = {
    SINGLE: "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/30 shadow-xs",
    DOUBLE: "bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-200/80 dark:border-sky-500/30 shadow-xs",
    MIXED:  "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200/80 dark:border-purple-500/30 shadow-xs",
  };
  const styleClass = styleMap[matchType] || "bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600";

  return (
    <span className={`px-3 py-1 border rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap inline-flex items-center gap-1.5 ${styleClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
}

function paymentMethodLabel(method: string | null): string | null {
  if (!method) return null;
  const map: Record<string, string> = {
    TRANSFER: 'Transfer Bank',
    QRIS: 'QRIS',
    EWALLET: 'E-Wallet',
    VENUE: 'Bayar di Venue',
  };
  return map[method] || method;
}

export type PlayerRow = {
  key: string;
  name: string;
  members: string[];
  grade: string;
  gender: string | null;
  matchType: string;
  school: string;
  phone: string;
  isTeam: boolean;
  memberIds: number[];
  teamId: number | null;
  registrationFee: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  paymentProof: string | null;
};

export type TournamentGroup = {
  tournamentId: number;
  tournamentName: string;
  tournamentStatus: string;
  rows: PlayerRow[];
};

const statusStyleMap: Record<string, { bg: string; text: string; label: string }> = {
  UPCOMING: { bg: 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', label: 'Buka Pendaftaran' },
  ONGOING: { bg: 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Sedang Berlangsung' },
  COMPLETED: { bg: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-400', label: 'Selesai' },
  CANCELED: { bg: 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30', text: 'text-red-600 dark:text-red-400', label: 'Dibatalkan' },
  DRAFT: { bg: 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', label: 'Draft' },
};

const EXPORT_HEADERS = [
  'No',
  'Nama / Tim',
  'Anggota Tim',
  'Grade',
  'Gender',
  'Match Type',
  'Instansi / Klub',
  'No. WhatsApp',
  'Biaya Pendaftaran',
  'Metode Pembayaran',
  'Status Pembayaran',
];

function buildPlayerExport(rows: PlayerRow[]): ExportRow[] {
  return rows.map((row, i) => {
    const cleanMembers = row.members.map((m) => m.replace(/^[👦👧]\s*/, '')).join('; ');
    return [
      i + 1,
      row.name,
      cleanMembers,
      row.grade,
      row.gender || '',
      row.matchType,
      row.school || '',
      row.phone || '',
      row.registrationFee,
      paymentMethodLabel(row.paymentMethod) || '',
      row.registrationFee === 0 ? 'Gratis' : row.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Bayar',
    ];
  });
}

function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

export default function PlayerTableClient({ tournamentGroups }: { tournamentGroups: TournamentGroup[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [collapsedTournaments, setCollapsedTournaments] = useState<Set<number>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleCollapse = (id: number) => {
    setCollapsedTournaments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterRows = (rows: PlayerRow[]) => {
    return rows.filter((row) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.school.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.grade.toLowerCase().includes(q) ||
        row.members.some((m) => m.toLowerCase().includes(q));

      const matchTypeFilter =
        filterType === 'ALL' || row.matchType === filterType;

      const matchPaymentFilter =
        filterPayment === 'ALL' ||
        (filterPayment === 'FREE' && row.registrationFee === 0) ||
        (filterPayment === 'PAID' && row.registrationFee > 0 && row.paymentStatus === 'PAID') ||
        (filterPayment === 'UNPAID' && row.registrationFee > 0 && row.paymentStatus !== 'PAID');

      return matchSearch && matchTypeFilter && matchPaymentFilter;
    });
  };

  // Metrics
  const totalAllRows = tournamentGroups.reduce((sum, g) => sum + g.rows.length, 0);
  const totalPaid = tournamentGroups.reduce((sum, g) => sum + g.rows.filter(r => r.paymentStatus === 'PAID').length, 0);
  const totalUnpaid = tournamentGroups.reduce((sum, g) => sum + g.rows.filter(r => r.registrationFee > 0 && r.paymentStatus !== 'PAID').length, 0);

  const resetFilters = () => {
    setSearch('');
    setFilterType('ALL');
    setFilterPayment('ALL');
  };

  // Selection helpers
  const allFilteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    const all: PlayerRow[] = [];
    tournamentGroups.forEach((g) => {
      g.rows.forEach((row) => {
        const matchSearch =
          !q ||
          row.name.toLowerCase().includes(q) ||
          row.school.toLowerCase().includes(q) ||
          row.phone.toLowerCase().includes(q) ||
          row.grade.toLowerCase().includes(q) ||
          row.members.some((m) => m.toLowerCase().includes(q));
        const matchTypeFilter = filterType === 'ALL' || row.matchType === filterType;
        const matchPaymentFilter =
          filterPayment === 'ALL' ||
          (filterPayment === 'FREE' && row.registrationFee === 0) ||
          (filterPayment === 'PAID' && row.registrationFee > 0 && row.paymentStatus === 'PAID') ||
          (filterPayment === 'UNPAID' && row.registrationFee > 0 && row.paymentStatus !== 'PAID');
        if (matchSearch && matchTypeFilter && matchPaymentFilter) all.push(row);
      });
    });
    return all;
  }, [tournamentGroups, search, filterType, filterPayment]);

  const allSelectableKeys = useMemo(() => allFilteredRows.map((r) => r.key), [allFilteredRows]);
  const allSelected = allSelectableKeys.length > 0 && allSelectableKeys.every((k) => selectedKeys.has(k));
  const someSelected = allSelectableKeys.some((k) => selectedKeys.has(k)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(allSelectableKeys));
    }
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getSelectedItems = (): { id: number; type: 'player' | 'team' }[] => {
    const items: { id: number; type: 'player' | 'team' }[] = [];
    allFilteredRows.forEach((row) => {
      if (selectedKeys.has(row.key)) {
        if (row.isTeam) {
          items.push({ id: row.teamId!, type: 'team' });
        } else {
          items.push({ id: row.memberIds[0], type: 'player' });
        }
      }
    });
    return items;
  };

  const selectedUnpaidCount = useMemo(() => {
    return allFilteredRows.filter(
      (r) => selectedKeys.has(r.key) && r.registrationFee > 0 && r.paymentStatus !== 'PAID'
    ).length;
  }, [allFilteredRows, selectedKeys]);

  const selectedPaidCount = useMemo(() => {
    return allFilteredRows.filter(
      (r) => selectedKeys.has(r.key) && r.registrationFee > 0 && r.paymentStatus === 'PAID'
    ).length;
  }, [allFilteredRows, selectedKeys]);

  const handleBulkConfirm = async () => {
    const confirmed = await showConfirm(
      `Konfirmasi pembayaran ${selectedUnpaidCount} item yang dipilih sebagai LUNAS?`,
      'Bulk Konfirmasi Pembayaran',
      'Ya, Konfirmasi'
    );
    if (!confirmed) return;
    setBulkLoading(true);
    try {
      const items = getSelectedItems().filter((item) => {
        const row = allFilteredRows.find((r) => selectedKeys.has(r.key) && ((r.isTeam && item.type === 'team' && item.id === r.teamId) || (!r.isTeam && item.type === 'player' && item.id === r.memberIds[0])));
        return row && row.registrationFee > 0 && row.paymentStatus !== 'PAID';
      });
      await bulkConfirmPayment(items);
      setSelectedKeys(new Set());
      showSuccess(`${items.length} pembayaran berhasil dikonfirmasi.`);
      router.refresh();
    } catch {
      showError('Gagal mengkonfirmasi pembayaran secara massal.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReset = async () => {
    const confirmed = await showConfirm(
      `Batalkan konfirmasi ${selectedPaidCount} pembayaran yang dipilih? Status akan kembali ke Belum Bayar.`,
      'Bulk Batalkan Konfirmasi',
      'Ya, Batalkan'
    );
    if (!confirmed) return;
    setBulkLoading(true);
    try {
      const items = getSelectedItems().filter((item) => {
        const row = allFilteredRows.find((r) => selectedKeys.has(r.key) && ((r.isTeam && item.type === 'team' && item.id === r.teamId) || (!r.isTeam && item.type === 'player' && item.id === r.memberIds[0])));
        return row && row.registrationFee > 0 && row.paymentStatus === 'PAID';
      });
      await bulkResetPayment(items);
      setSelectedKeys(new Set());
      showSuccess(`${items.length} konfirmasi pembayaran dibatalkan.`);
      router.refresh();
    } catch {
      showError('Gagal membatalkan konfirmasi secara massal.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      `Hapus ${selectedKeys.size} item yang dipilih? Data yang dihapus tidak bisa dikembalikan.`,
      'Bulk Hapus Peserta',
      'Ya, Hapus'
    );
    if (!confirmed) return;
    setBulkLoading(true);
    try {
      const items = getSelectedItems();
      await bulkDeletePlayers(items);
      setSelectedKeys(new Set());
      showSuccess(`${items.length} peserta berhasil dihapus.`);
      router.refresh();
    } catch {
      showError('Gagal menghapus peserta secara massal.');
    } finally {
      setBulkLoading(false);
    }
  };

  const getFilteredAll = (): PlayerRow[] => {
    const all: PlayerRow[] = [];
    tournamentGroups.forEach((g) => {
      all.push(...filterRows(g.rows));
    });
    return all;
  };

  const handleExportAllExcel = () => {
    const allFiltered = getFilteredAll();
    const rows = buildPlayerExport(allFiltered);
    exportToExcel(
      `Daftar_Peserta_Pickleball_${dateStamp()}`,
      'Peserta',
      EXPORT_HEADERS,
      rows
    );
  };

  const handleExportAllPdf = () => {
    const allFiltered = getFilteredAll();
    const rows = buildPlayerExport(allFiltered);
    exportToPdf(
      `Daftar_Peserta_Pickleball_${dateStamp()}`,
      'Daftar Peserta Pickleball',
      `Total ${allFiltered.length} peserta · di-export ${dateStamp()}`,
      EXPORT_HEADERS,
      rows
    );
  };

  const handleExportTournamentExcel = (group: TournamentGroup) => {
    const rows = buildPlayerExport(filterRows(group.rows));
    exportToExcel(
      `Peserta_${group.tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStamp()}`,
      'Peserta',
      EXPORT_HEADERS,
      rows
    );
  };

  const handleExportTournamentPdf = (group: TournamentGroup) => {
    const rows = buildPlayerExport(filterRows(group.rows));
    exportToPdf(
      `Peserta_${group.tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStamp()}`,
      `Daftar Peserta — ${group.tournamentName}`,
      `${filterRows(group.rows).length} peserta · di-export ${dateStamp()}`,
      EXPORT_HEADERS,
      rows
    );
  };

  return (
    <div className="space-y-8">
      {/* METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-200/10 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xl font-bold">
            🏆
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Turnamen</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{tournamentGroups.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-200/10 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xl font-bold">
            👥
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Peserta</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalAllRows}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
            ✓
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sudah Lunas</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalPaid}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
            ⏳
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Belum Bayar</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalUnpaid}</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Cari nama pemain, instansi, No HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <span className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-sm">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-xs bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300 rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="MIXED">Mixed</option>
          </select>

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status Bayar</option>
            <option value="PAID">Lunas</option>
            <option value="UNPAID">Belum Bayar</option>
            <option value="FREE">Gratis</option>
          </select>

          {(search || filterType !== 'ALL' || filterPayment !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-600"
            >
              Reset Filter
            </button>
          )}

          <button
            onClick={handleExportAllExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-[#ffffff] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Export semua peserta (sesuai filter) ke Excel"
          >
            <span>📥 Export Excel</span>
          </button>
          <button
            onClick={handleExportAllPdf}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Export semua peserta (sesuai filter) ke PDF"
          >
            <span>📄 Export PDF</span>
          </button>
        </div>
      </div>

      {/* PER-TOURNAMENT SECTIONS */}
      {tournamentGroups.map((group) => {
        const filteredRows = filterRows(group.rows);
        if (filteredRows.length === 0 && (search || filterType !== 'ALL' || filterPayment !== 'ALL')) return null;

        const isCollapsed = collapsedTournaments.has(group.tournamentId);
        const paidCount = group.rows.filter((r) => r.paymentStatus === 'PAID').length;
        const unpaidCount = group.rows.filter((r) => r.registrationFee > 0 && r.paymentStatus !== 'PAID').length;
        const statusMeta = statusStyleMap[group.tournamentStatus] || { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', label: group.tournamentStatus };

        return (
          <div
            key={group.tournamentId}
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-md shadow-slate-200/30 overflow-hidden transition-all"
          >
            {/* Tournament Header */}
            <div className="w-full px-6 py-5 flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-brand via-brand-2 to-brand text-[#ffffff] gap-4">
              <div
                onClick={() => toggleCollapse(group.tournamentId)}
                className="flex items-center gap-4 cursor-pointer flex-1"
              >
                <div className="w-12 h-12 bg-[rgba(255,255,255,0.1)] backdrop-blur-md rounded-2xl flex items-center justify-center text-[#ffffff] text-xl shadow-inner border border-[rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                  🎾
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-[#ffffff] hover:text-amber-400 transition-colors">
                    {group.tournamentName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusMeta.bg} ${statusMeta.text}`}>
                      {statusMeta.label}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold bg-[rgba(255,255,255,0.1)] px-2.5 py-0.5 rounded-full">
                      👥 {group.rows.length} Peserta
                    </span>
                    {paidCount > 0 && (
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                        ✓ {paidCount} Lunas
                      </span>
                    )}
                    {unpaidCount > 0 && (
                      <span className="text-xs text-amber-300 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800">
                        ⏳ {unpaidCount} Belum Bayar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between md:justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportTournamentExcel(group);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1"
                >
                  📥 Excel
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportTournamentPdf(group);
                  }}
                  className="px-3.5 py-1.5 bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)] text-[#ffffff] rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1"
                >
                  📄 PDF
                </button>

                <button
                  type="button"
                  onClick={() => toggleCollapse(group.tournamentId)}
                  className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.2)] transition-colors"
                >
                  <svg className={`w-4 h-4 text-[#ffffff] transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Player Table */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                {filteredRows.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                        <th className="py-4 px-4 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected; }}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </th>
                        <th className="py-4 px-6 w-14 text-center">No</th>
                        <th className="py-4 px-6 whitespace-nowrap">Nama Lengkap / Tim</th>
                        <th className="py-4 px-6 w-40">Kategori</th>
                        <th className="py-4 px-6">Instansi / Klub</th>
                        <th className="py-4 px-6 whitespace-nowrap">No. WhatsApp</th>
                        <th className="py-4 px-6">Pembayaran</th>
                        <th className="py-4 px-6 text-center w-40">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredRows.map((row, index) => (
                        <tr
                          key={row.key}
                          className={`hover:bg-primary-50/40 dark:hover:bg-primary-500/10 transition-colors duration-150 group ${selectedKeys.has(row.key) ? 'bg-primary-50/60 dark:bg-primary-500/10' : ''}`}
                        >
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedKeys.has(row.key)}
                              onChange={() => toggleSelect(row.key)}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-6 text-slate-400 dark:text-slate-500 font-bold text-center text-sm">
                            {index + 1}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                              {row.name}
                            </div>
                            {row.members.length > 0 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                {row.members.map((m, i) => (
                                  <span key={i} className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <CategoryBadge grade={row.grade} gender={row.gender} matchType={row.matchType} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm">
                              <span className="text-slate-400 dark:text-slate-500">🏫</span>
                              {row.school || '-'}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                            {row.phone}
                          </td>

                          {/* Kolom Pembayaran */}
                          <td className="py-4 px-6">
                            {row.registrationFee > 0 ? (
                              row.paymentStatus === 'PAID' ? (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-1">
                                    <span>✓</span> Lunas
                                  </span>
                                  {paymentMethodLabel(row.paymentMethod) && (
                                    <span className="text-[11px] font-semibold text-slate-400">
                                      {paymentMethodLabel(row.paymentMethod)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-1.5">
                                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-1">
                                    <span>⏳</span> Belum Bayar
                                  </span>
                                  {paymentMethodLabel(row.paymentMethod) && (
                                    <span className="text-[11px] font-semibold text-slate-400">
                                      {paymentMethodLabel(row.paymentMethod)}
                                    </span>
                                  )}
                                  {row.paymentProof && (
                                    <button
                                      type="button"
                                      onClick={() => setModalImage(row.paymentProof)}
                                      className="text-xs text-primary-700 hover:text-primary-900 hover:underline font-extrabold flex items-center gap-1"
                                    >
                                      🖼️ Preview Bukti
                                    </button>
                                  )}
                                  <PaymentActions
                                    type={row.isTeam ? 'team' : 'player'}
                                    id={row.isTeam ? row.teamId! : row.memberIds[0]}
                                    status={row.paymentStatus}
                                  />
                                </div>
                              )
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 text-xs font-bold whitespace-nowrap">
                                Gratis
                              </span>
                            )}
                          </td>

                          {/* Tombol Aksi (Edit & Delete) */}
                          <td className="py-4 px-6">
                            {row.isTeam ? (
                              <div className="flex flex-col items-end gap-1.5">
                                {row.memberIds.map((id, i) => (
                                  <Link
                                    key={id}
                                    href={`/admin/players/${id}`}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-[#ffffff] font-bold rounded-xl text-xs transition-all shadow-xs"
                                  >
                                    ✏️ Pemain {i + 1}
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <div className="flex justify-center items-center gap-2">
                                <Link
                                  href={`/admin/players/${row.memberIds[0]}`}
                                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-[#ffffff] font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-xs"
                                >
                                  ✏️ Edit
                                </Link>
                                <DeleteButton playerId={row.memberIds[0]} />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center mb-3 text-2xl">
                      📭
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Belum Ada Pemain</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      Belum ada peserta yang mendaftar untuk turnamen ini.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {tournamentGroups.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 py-24 text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center mb-4 mx-auto text-4xl">
            📭
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Belum Ada Pemain</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Tabel ini masih kosong. Pemain yang mendaftar melalui halaman publik akan otomatis muncul di sini.
          </p>
        </div>
      )}

      {/* MODAL PREVIEW BUKTI PEMBAYARAN */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden max-w-lg w-full p-6 space-y-4 shadow-2xl relative border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Preview Bukti Transfer</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Verifikasi keaslian foto sebelum konfirmasi lunas.</p>
              </div>
              <button
                onClick={() => setModalImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 flex justify-center p-2">
              <img
                src={modalImage}
                alt="Bukti Pembayaran"
                className="max-w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setModalImage(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
              <a
                href={modalImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5"
              >
                <span>Buka Ukuran Penuh</span> ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTION BAR */}
      {selectedKeys.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-[#ffffff] rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-700 px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-bold text-slate-300 whitespace-nowrap">
            <span className="text-[#ffffff] font-black">{selectedKeys.size}</span> dipilih
          </span>
          <div className="w-px h-8 bg-slate-700" />
          {selectedUnpaidCount > 0 && (
            <button
              onClick={handleBulkConfirm}
              disabled={bulkLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-[#ffffff] rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              ✓ Konfirmasi ({selectedUnpaidCount})
            </button>
          )}
          {selectedPaidCount > 0 && (
            <button
              onClick={handleBulkReset}
              disabled={bulkLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-[#ffffff] rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              ↺ Batal ({selectedPaidCount})
            </button>
          )}
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-[#ffffff] rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            🗑️ Hapus
          </button>
          <div className="w-px h-8 bg-slate-700" />
          <button
            onClick={() => setSelectedKeys(new Set())}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            ✕ Batal
          </button>
        </div>
      )}
    </div>
  );
}
