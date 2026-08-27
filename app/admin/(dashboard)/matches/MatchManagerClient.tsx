'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/swal'

type SerializedMatch = {
  id: number
  type: 'pool' | 'knockout' | 'group'
  tournamentId: number
  tournamentName: string
  tournamentStatus: string
  category: string
  categoryLabel: string
  roundLabel: string
  player1: string
  player2: string
  score1: number | null
  score2: number | null
  winnerName: string | null
  status: string
  court: string | null
  startTime: string | null
  refereeName: string | null
  matchOrder: number
}

type Tournament = { id: number; name: string; status: string }
type Category = { key: string; label: string }

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-400', label: 'Terjadwal' },
  ONGOING: { bg: 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30', text: 'text-blue-700 dark:text-blue-400', label: 'Berlangsung' },
  DONE: { bg: 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Selesai' },
}

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  pool: { bg: 'bg-sky-50 dark:bg-sky-500/20 border-sky-200 dark:border-sky-500/30', text: 'text-sky-700 dark:text-sky-400' },
  knockout: { bg: 'bg-purple-50 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30', text: 'text-purple-700 dark:text-purple-400' },
  group: { bg: 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-400' },
}

const TYPE_LABELS: Record<string, string> = {
  pool: 'Pool',
  knockout: 'Gugur',
  group: 'Grup',
}

export default function MatchManagerClient({
  initialMatches,
  tournaments,
  allCategories,
}: {
  initialMatches: SerializedMatch[]
  tournaments: Tournament[]
  allCategories: Category[]
}) {
  const router = useRouter()
  const [matches] = useState<SerializedMatch[]>(initialMatches)
  const [filterTournament, setFilterTournament] = useState<number>(0)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [editMatch, setEditMatch] = useState<SerializedMatch | null>(null)
  const [editScore1, setEditScore1] = useState('')
  const [editScore2, setEditScore2] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editCourt, setEditCourt] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editReferee, setEditReferee] = useState('')
  const [saving, setSaving] = useState(false)

  const categories = useMemo(() => {
    if (!filterTournament) return allCategories
    const catSet = new Set(matches.filter((m) => m.tournamentId === filterTournament).map((m) => m.category))
    return allCategories.filter((c) => catSet.has(c.key))
  }, [filterTournament, allCategories, matches])

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filterTournament && m.tournamentId !== filterTournament) return false
      if (filterCategory && m.category !== filterCategory) return false
      if (filterStatus && m.status !== filterStatus) return false
      if (filterType && m.type !== filterType) return false
      if (search) {
        const q = search.toLowerCase()
        if (!m.player1.toLowerCase().includes(q) && !m.player2.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [matches, filterTournament, filterCategory, filterStatus, filterType, search])

  const stats = useMemo(() => {
    const total = filtered.length
    const scheduled = filtered.filter((m) => m.status === 'SCHEDULED').length
    const ongoing = filtered.filter((m) => m.status === 'ONGOING').length
    const done = filtered.filter((m) => m.status === 'DONE').length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, scheduled, ongoing, done, progress }
  }, [filtered])

  const openEdit = (match: SerializedMatch) => {
    setEditMatch(match)
    setEditScore1(match.score1?.toString() ?? '')
    setEditScore2(match.score2?.toString() ?? '')
    setEditStatus(match.status)
    setEditCourt(match.court ?? '')
    setEditStartTime(match.startTime ? match.startTime.slice(0, 16) : '')
    setEditReferee(match.refereeName ?? '')
  }

  const closeEdit = () => setEditMatch(null)

  const handleSave = async () => {
    if (!editMatch) return
    setSaving(true)
    try {
      if (editScore1 && editScore2) {
        const s1 = parseInt(editScore1)
        const s2 = parseInt(editScore2)
        if (isNaN(s1) || isNaN(s2) || s1 === s2) {
          showError('Skor harus angka dan tidak boleh seri')
          setSaving(false)
          return
        }
        const res = await fetch('/api/matches/update-score', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: editMatch.type, matchId: editMatch.id, score1: s1, score2: s2 }),
        })
        const data = await res.json()
        if (!data.success) {
          showError(data.message || 'Gagal update skor')
          setSaving(false)
          return
        }
      }

      if (editStatus !== editMatch.status) {
        await fetch('/api/matches/update-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: editMatch.type, matchId: editMatch.id, status: editStatus }),
        })
      }

      if ((editCourt || editStartTime) && editMatch.type !== 'group') {
        await fetch('/api/matches/update-schedule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: editMatch.type, matchId: editMatch.id, court: editCourt, startTime: editStartTime }),
        })
      }

      showSuccess('Pertandingan berhasil diperbarui')
      closeEdit()
      router.refresh()
    } catch {
      showError('Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const resetFilters = () => {
    setFilterTournament(0)
    setFilterCategory('')
    setFilterStatus('')
    setFilterType('')
    setSearch('')
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Pertandingan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola semua pertandingan dari seluruh turnamen dalam satu halaman.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Terjadwal</p>
          <p className="text-2xl font-black text-slate-600 dark:text-slate-400">{stats.scheduled}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Berlangsung</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.ongoing}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Selesai</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.done}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Progress</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{stats.progress}%</span>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filterTournament}
            onChange={(e) => { setFilterTournament(Number(e.target.value)); setFilterCategory('') }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={0}>Semua Turnamen</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Semua Tipe</option>
            <option value="pool">Pool</option>
            <option value="knockout">Gugur</option>
            <option value="group">Grup (Legacy)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Semua Status</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="ONGOING">Berlangsung</option>
            <option value="DONE">Selesai</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Cari nama pemain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-xs">🔍</span>
          </div>
          {(filterTournament || filterCategory || filterStatus || filterType || search) && (
            <button onClick={resetFilters} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4">Turnamen</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4 whitespace-nowrap">Pemain 1</th>
                <th className="py-3 px-4 text-center w-20">Skor</th>
                <th className="py-3 px-4 whitespace-nowrap">Pemain 2</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Lapangan</th>
                <th className="py-3 px-4">Jam</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((m, i) => {
                const ss = STATUS_STYLES[m.status] || STATUS_STYLES.SCHEDULED
                const ts = TYPE_STYLES[m.type] || TYPE_STYLES.pool
                const isWinner1 = m.status === 'DONE' && m.winnerName === m.player1
                const isWinner2 = m.status === 'DONE' && m.winnerName === m.player2

                return (
                  <tr key={`${m.type}-${m.id}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors">
                    <td className="py-3 px-4 text-slate-400 dark:text-slate-500 font-bold text-center text-sm">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title={m.tournamentName}>
                        {m.tournamentName}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{m.roundLabel}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 max-w-[120px] truncate" title={m.categoryLabel}>
                      {m.categoryLabel}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-extrabold ${ts.bg} ${ts.text}`}>
                        {TYPE_LABELS[m.type]}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm font-semibold ${isWinner1 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {m.player1}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.score1 !== null && m.score2 !== null ? (
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {m.score1} - {m.score2}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 text-sm font-semibold ${isWinner2 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {m.player2}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold ${ss.bg} ${ss.text}`}>
                        {ss.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {m.court || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(m.startTime)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openEdit(m)}
                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-lg text-xs transition-all"
                      >
                        ✏️ Atur
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              Tidak ada pertandingan ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editMatch && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeEdit}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Atur Pertandingan</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{editMatch.categoryLabel} · {editMatch.roundLabel}</p>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="flex-1 text-right font-bold text-slate-700 dark:text-slate-300">{editMatch.player1}</span>
              <span className="text-slate-400 dark:text-slate-500 font-bold">vs</span>
              <span className="flex-1 font-bold text-slate-700 dark:text-slate-300">{editMatch.player2}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Skor {editMatch.player1}</label>
                <input
                  type="number"
                  min={0}
                  value={editScore1}
                  onChange={(e) => setEditScore1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Skor {editMatch.player2}</label>
                <input
                  type="number"
                  min={0}
                  value={editScore2}
                  onChange={(e) => setEditScore2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="SCHEDULED">Terjadwal</option>
                  <option value="ONGOING">Berlangsung</option>
                  <option value="DONE">Selesai</option>
                </select>
              </div>
              {editMatch.type !== 'group' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Lapangan</label>
                    <input
                      type="text"
                      value={editCourt}
                      onChange={(e) => setEditCourt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="No. lapangan"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Jam Mulai</label>
                    <input
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Wasit</label>
                    <input
                      type="text"
                      value={editReferee}
                      onChange={(e) => setEditReferee(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nama wasit"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeEdit}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
