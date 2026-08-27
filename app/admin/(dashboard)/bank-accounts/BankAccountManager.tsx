'use client'

import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

interface BankAccount {
  id: number
  bankName: string
  accountNumber: string
  accountName: string
  logo: string | null
  active: boolean
  order: number
}

const BANK_OPTIONS = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'CIMB Niaga',
  'Danamon',
  'BSI',
  'BTN',
  'Maybank',
  'OCBC NISP',
  'Permata',
  'BNI Syariah',
  'BRI Syariah',
  'Mandiri Syariah',
]

export default function BankAccountManager() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredBanks, setFilteredBanks] = useState<string[]>([])

  const [form, setForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
  })

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/bank-accounts')
      const data = await res.json()
      setAccounts(data.data ?? [])
    } catch {
      Swal.fire('Gagal', 'Gagal memuat data rekening bank', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const resetForm = () => {
    setForm({ bankName: '', accountNumber: '', accountName: '' })
    setEditId(null)
    setShowForm(false)
  }

  const openAdd = () => {
    setForm({ bankName: '', accountNumber: '', accountName: '' })
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (acc: BankAccount) => {
    setForm({
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      accountName: acc.accountName,
    })
    setEditId(acc.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.bankName || !form.accountNumber || !form.accountName) {
      Swal.fire('Peringatan', 'Semua field wajib diisi', 'warning')
      return
    }

    setSaving(true)
    try {
      const url = editId ? `/api/bank-accounts/${editId}` : '/api/bank-accounts'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (data.success) {
        Swal.fire('Berhasil', data.message, 'success')
        resetForm()
        fetchAccounts()
      } else {
        Swal.fire('Gagal', data.message || 'Terjadi kesalahan', 'error')
      }
    } catch {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan data', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, bankName: string) => {
    const result = await Swal.fire({
      title: 'Hapus Rekening?',
      text: `Rekening ${bankName} akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    })

    if (!result.isConfirmed) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        Swal.fire('Berhasil', data.message, 'success')
        fetchAccounts()
      } else {
        Swal.fire('Gagal', data.message || 'Terjadi kesalahan', 'error')
      }
    } catch {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const toggleActive = async (acc: BankAccount) => {
    try {
      await fetch(`/api/bank-accounts/${acc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !acc.active }),
      })
      fetchAccounts()
    } catch {
      Swal.fire('Gagal', 'Gagal mengubah status', 'error')
    }
  }

  const moveOrder = async (acc: BankAccount, direction: 'up' | 'down') => {
    const targetOrder = direction === 'up' ? acc.order - 1 : acc.order + 1
    if (targetOrder < 0) return

    const swapTarget = accounts.find((a) => a.order === targetOrder)
    if (!swapTarget) return

    try {
      await Promise.all([
        fetch(`/api/bank-accounts/${acc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: targetOrder }),
        }),
        fetch(`/api/bank-accounts/${swapTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: acc.order }),
        }),
      ])
      fetchAccounts()
    } catch {
      Swal.fire('Gagal', 'Gagal mengubah urutan', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rekening Bank</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola rekening bank untuk pembayaran turnamen.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          + Tambah Rekening
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              {editId ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm({ ...form, bankName: val })
                    if (val.length > 0) {
                      const filtered = BANK_OPTIONS.filter((b) =>
                        b.toLowerCase().includes(val.toLowerCase())
                      )
                      setFilteredBanks(filtered)
                      setShowSuggestions(filtered.length > 0)
                    } else {
                      setShowSuggestions(false)
                    }
                  }}
                  onFocus={() => {
                    if (form.bankName.length > 0) {
                      const filtered = BANK_OPTIONS.filter((b) =>
                        b.toLowerCase().includes(form.bankName.toLowerCase())
                      )
                      setFilteredBanks(filtered)
                      setShowSuggestions(filtered.length > 0)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                {showSuggestions && filteredBanks.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {filteredBanks.map((b) => (
                      <li key={b}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setForm({ ...form, bankName: b })
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 dark:hover:bg-primary-200/20 hover:text-primary-700 dark:hover:text-primary-300 text-slate-700 dark:text-slate-300"
                        >
                          {b}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="Masukkan nomor rekening"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Pemilik</label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  placeholder="Masukkan nama pemilik rekening"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {accounts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada rekening bank.</p>
            <button
              onClick={openAdd}
              className="mt-3 text-primary-600 font-semibold text-sm hover:underline"
            >
              + Tambah Rekening Sekarang
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Urutan</th>
                <th className="text-left px-4 py-3 font-semibold">Bank</th>
                <th className="text-left px-4 py-3 font-semibold">Nomor Rekening</th>
                <th className="text-left px-4 py-3 font-semibold">Nama Pemilik</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-center px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {accounts.map((acc, idx) => (
                <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveOrder(acc, 'up')}
                        disabled={idx === 0}
                        className="text-slate-400 dark:text-slate-500 hover:text-primary-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveOrder(acc, 'down')}
                        disabled={idx === accounts.length - 1}
                        className="text-slate-400 dark:text-slate-500 hover:text-primary-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{acc.bankName}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 tracking-wide">{acc.accountNumber}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{acc.accountName}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(acc)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        acc.active
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {acc.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(acc)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold text-xs"
                      >
                        Edit
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        onClick={() => handleDelete(acc.id, acc.bankName)}
                        disabled={deleting === acc.id}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold text-xs disabled:opacity-50"
                      >
                        {deleting === acc.id ? 'Hapus...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <strong>Catatan:</strong> Rekening bank yang berstatus <strong>Aktif</strong> akan ditampilkan di halaman publik turnamen sebagai metode pembayaran transfer.
      </div>
    </div>
  )
}
