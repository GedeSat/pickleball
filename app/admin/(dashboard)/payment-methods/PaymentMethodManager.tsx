'use client'

import React, { useEffect, useState, useRef } from 'react'
import Swal from 'sweetalert2'

interface PaymentMethod {
  id: number
  method: string
  label: string
  image: string | null
  active: boolean
  order: number
}

const METHOD_TYPES = [
  { value: 'TRANSFER', label: 'Transfer Bank', icon: '🏦', needsImage: false },
  { value: 'QRIS', label: 'QRIS', icon: '📱', needsImage: true },
  { value: 'EWALLET', label: 'E-Wallet', icon: '💳', needsImage: true },
  { value: 'VENUE', label: 'Bayar di Tempat', icon: '🏟️', needsImage: false },
]

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    method: '',
    label: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const fetchMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods')
      const data = await res.json()
      setMethods(data.data ?? [])
    } catch {
      Swal.fire('Gagal', 'Gagal memuat data metode pembayaran', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMethods()
  }, [])

  const resetForm = () => {
    setForm({ method: '', label: '' })
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    setEditId(null)
    setShowForm(false)
  }

  const openAdd = () => {
    setForm({ method: '', label: '' })
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (m: PaymentMethod) => {
    setForm({ method: m.method, label: m.label })
    setImageFile(null)
    setImagePreview(m.image)
    setRemoveImage(false)
    setEditId(m.id)
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      Swal.fire('Peringatan', 'Gambar harus JPG/PNG/WebP', 'warning')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Peringatan', 'Ukuran gambar maksimal 5MB', 'warning')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  const removeImagePreview = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectedMethodConfig = METHOD_TYPES.find((m) => m.value === form.method)

  const handleSubmit = async () => {
    if (!form.method || !form.label) {
      Swal.fire('Peringatan', 'Semua field wajib diisi', 'warning')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('method', form.method)
      fd.append('label', form.label)
      if (imageFile) fd.append('image', imageFile)
      if (removeImage) fd.append('removeImage', 'true')

      const url = editId ? `/api/payment-methods/${editId}` : '/api/payment-methods'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: fd })
      const data = await res.json()

      if (data.success) {
        Swal.fire('Berhasil', data.message, 'success')
        resetForm()
        fetchMethods()
      } else {
        Swal.fire('Gagal', data.message || 'Terjadi kesalahan', 'error')
      }
    } catch {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan data', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, label: string) => {
    const result = await Swal.fire({
      title: 'Hapus Metode?',
      text: `Metode "${label}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    })

    if (!result.isConfirmed) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        Swal.fire('Berhasil', data.message, 'success')
        fetchMethods()
      } else {
        Swal.fire('Gagal', data.message || 'Terjadi kesalahan', 'error')
      }
    } catch {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const toggleActive = async (m: PaymentMethod) => {
    try {
      await fetch(`/api/payment-methods/${m.id}/toggle`, { method: 'PUT' })
      fetchMethods()
    } catch {
      Swal.fire('Gagal', 'Gagal mengubah status', 'error')
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Metode Pembayaran</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Atur metode pembayaran yang tersedia untuk pendaftaran turnamen.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          + Tambah Metode
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              {editId ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipe Metode</label>
                <select
                  value={form.method}
                  disabled={!!editId}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm({ ...form, method: val })
                  }}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Pilih Tipe</option>
                  {METHOD_TYPES.map((m) => (
                    <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label Tampilan</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Contoh: Transfer BCA, Transfer Mandiri, QRIS Panitia, GoPay"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              {selectedMethodConfig?.needsImage && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {form.method === 'QRIS' ? 'Gambar QRIS' : 'Gambar E-Wallet'}
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="w-full text-sm p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-primary-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-semibold file:text-sm file:cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-40 h-40 object-contain rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={removeImagePreview}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {form.method === 'QRIS'
                      ? 'Upload gambar QRIS agar pemain bisa scan saat pembayaran.'
                      : 'Upload gambar kode QR / nomor E-Wallet agar pemain bisa bayar.'}
                  </p>
                </div>
              )}
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

      {/* Daftar Metode */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {methods.map((m) => {
          const cfg = METHOD_TYPES.find((t) => t.value === m.method)
          return (
            <div
              key={m.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden transition-all ${
                m.active ? 'border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700 opacity-60'
              }`}
            >
              {m.image && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 flex items-center justify-center h-40">
                  <img src={m.image} alt={m.label} className="max-h-32 max-w-full object-contain" />
                </div>
              )}
              {!m.image && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 flex items-center justify-center h-40">
                  <span className="text-5xl">{cfg?.icon ?? '💰'}</span>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{m.label}</h3>
                  <button
                    onClick={() => toggleActive(m)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      m.active
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {m.active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.method}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex-1 text-primary-600 hover:text-primary-800 border border-primary-200 dark:border-primary-200/30 hover:bg-primary-50 dark:hover:bg-primary-200/20 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id, m.label)}
                    disabled={deleting === m.id}
                    className="flex-1 text-rose-600 hover:text-rose-800 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 py-1.5 rounded-lg font-semibold text-xs disabled:opacity-50 transition-colors"
                  >
                    {deleting === m.id ? '...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {methods.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada metode pembayaran.</p>
            <button
              onClick={openAdd}
              className="mt-3 text-primary-600 font-semibold text-sm hover:underline"
            >
              + Tambah Metode Sekarang
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <strong>Catatan:</strong> Metode yang berstatus <strong>Aktif</strong> akan tampil di form pendaftaran turnamen. Untuk QRIS dan E-Wallet, upload gambar barcode/QR agar pemain bisa langsung scan.
      </div>
    </div>
  )
}
