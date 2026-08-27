'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, showDeleteConfirm } from '@/lib/swal'

type Admin = {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export default function AdminManagerClient({
  admins,
  currentUserId,
}: {
  admins: Admin[]
  currentUserId: number
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('ADMIN')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setEditingId(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('ADMIN')
    setShowForm(false)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (admin: Admin) => {
    setEditingId(admin.id)
    setFormName(admin.name || '')
    setFormEmail(admin.email)
    setFormPassword('')
    setFormRole(admin.role)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        const body: { name: string; email: string; password?: string; role: string } = {
          name: formName,
          email: formEmail,
          role: formRole,
        }
        if (formPassword) body.password = formPassword

        const res = await fetch(`/api/admins/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!data.success) {
          showError(data.message || 'Gagal memperbarui admin')
          return
        }
        showSuccess('Admin berhasil diperbarui')
      } else {
        const res = await fetch('/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            password: formPassword,
            role: formRole,
          }),
        })
        const data = await res.json()
        if (!data.success) {
          showError(data.message || 'Gagal menambahkan admin')
          return
        }
        showSuccess('Admin berhasil ditambahkan')
      }

      resetForm()
      router.refresh()
    } catch {
      showError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (admin: Admin) => {
    if (admin.id === currentUserId) {
      showError('Tidak bisa menghapus diri sendiri')
      return
    }

    const confirmed = await showDeleteConfirm(
      `Hapus admin "${admin.name || admin.email}"? Tindakan ini tidak bisa dibatalkan.`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admins/${admin.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        showError(data.message || 'Gagal menghapus admin')
        return
      }
      showSuccess('Admin berhasil dihapus')
      router.refresh()
    } catch {
      showError('Terjadi kesalahan')
    }
  }

  const formatDate = (d: Date) => {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Kelola Admin</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tambah, edit, atau hapus akun admin yang bisa mengakses panel.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
        >
          + Tambah Admin
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={resetForm}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {editingId ? 'Edit Admin' : 'Tambah Admin Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nama</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nama admin"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Password {editingId && '(kosongkan jika tidak ingin mengubah)'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required={!editingId}
                  minLength={8}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ADMIN">Admin (Akses Penuh)</option>
                  <option value="MATCH_ADMIN">Match Admin (Fokus Pertandingan)</option>
                </select>
                {formRole === 'MATCH_ADMIN' && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                    Hanya bisa akses: Turnamen, Pertandingan, Pemain, Jadwal, Log Wasit
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : editingId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
              <th className="py-4 px-6">No</th>
              <th className="py-4 px-6">Nama</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Dibuat</th>
              <th className="py-4 px-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {admins.map((admin, i) => (
              <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <td className="py-4 px-6 text-slate-400 dark:text-slate-500 font-bold text-sm">{i + 1}</td>
                <td className="py-4 px-6">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{admin.name || '-'}</div>
                </td>
                <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">{admin.email}</td>
                <td className="py-4 px-6">
                  {admin.role === 'SUPER_ADMIN' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-1">
                      ⭐ Super Admin
                    </span>
                  ) : admin.role === 'MATCH_ADMIN' ? (
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-1">
                      🎯 Match Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 text-xs font-bold whitespace-nowrap">
                      Admin
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">{formatDate(admin.createdAt)}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(admin)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-[#ffffff] font-bold rounded-lg text-xs transition-all"
                    >
                      ✏️ Edit
                    </button>
                    {admin.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(admin)}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-[#ffffff] font-bold rounded-lg text-xs transition-all"
                      >
                        🗑️ Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {admins.length === 0 && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
            Belum ada admin terdaftar.
          </div>
        )}
      </div>
    </div>
  )
}
