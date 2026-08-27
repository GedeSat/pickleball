'use client'

import Swal from 'sweetalert2'

// ============================================================
// 🎨 SweetAlert2 Utility Helpers
// Mempermudah penggunaan SweetAlert2 di seluruh project
// ============================================================

/**
 * Tampilkan alert sukses dengan animasi menarik
 */
export function showSuccess(message: string, title: string = 'Berhasil! 🎉') {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'Oke',
    confirmButtonColor: '#4f46e5',
    timer: 3000,
    timerProgressBar: true,
    showClass: {
      popup: 'swal2-show',
    },
    customClass: {
      popup: 'swal-rounded',
      confirmButton: 'swal-btn',
    },
  })
}

/**
 * Tampilkan alert error
 */
export function showError(message: string, title: string = 'Oops! ❌') {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Mengerti',
    confirmButtonColor: '#dc2626',
    customClass: {
      popup: 'swal-rounded',
      confirmButton: 'swal-btn',
    },
  })
}

/**
 * Tampilkan alert warning / informasi
 */
export function showWarning(message: string, title: string = 'Perhatian ⚠️') {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'Oke',
    confirmButtonColor: '#f59e0b',
    customClass: {
      popup: 'swal-rounded',
      confirmButton: 'swal-btn',
    },
  })
}

/**
 * Tampilkan alert informasi
 */
export function showInfo(message: string, title: string = 'Info ℹ️') {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'Oke',
    confirmButtonColor: '#4f46e5',
    customClass: {
      popup: 'swal-rounded',
      confirmButton: 'swal-btn',
    },
  })
}

/**
 * Tampilkan dialog konfirmasi (pengganti window.confirm)
 * Mengembalikan Promise<boolean> — true jika user klik "Ya"
 */
export async function showConfirm(
  message: string,
  title: string = 'Konfirmasi',
  confirmText: string = 'Ya, Lanjutkan',
  cancelText: string = 'Batal'
): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#94a3b8',
    reverseButtons: true,
    customClass: {
      popup: 'swal-rounded',
      confirmButton: 'swal-btn',
      cancelButton: 'swal-btn',
    },
  })
  return result.isConfirmed
}

/**
 * Tampilkan dialog konfirmasi hapus (warna merah)
 */
export async function showDeleteConfirm(
  message: string = 'Data yang dihapus tidak bisa dikembalikan.',
  title: string = 'Yakin Hapus? 🗑️'
): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#94a3b8',
    reverseButtons: true,
    customClass: {
      popup: 'swal-rounded',
      confirmButton: 'swal-btn',
      cancelButton: 'swal-btn',
    },
  })
  return result.isConfirmed
}
