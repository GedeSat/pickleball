// lib/paymentProof.ts
// Helper penyimpanan bukti pembayaran — dipakai form pendaftaran
// dan halaman "Cek Pembayaran" publik.

import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { detectImageFileType, imageFileExtension } from '@/lib/imageFile'

/**
 * Validasi & simpan file bukti pembayaran ke public/uploads/payments/.
 * Melempar Error berbahasa Indonesia jika tidak valid.
 * Mengembalikan URL publik file (mis. /uploads/payments/xxx.jpg).
 */
export async function savePaymentProofFile(file: File | null): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Upload bukti pembayaran wajib diisi")
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran bukti pembayaran maksimal 5MB")
  }

  // Validasi isi file (magic bytes), bukan hanya MIME type dari klien
  const buffer = Buffer.from(await file.arrayBuffer())
  const imageType = detectImageFileType(buffer)
  if (!imageType) {
    throw new Error("Bukti pembayaran harus berupa gambar (JPG/PNG/WebP)")
  }

  const filename = `${crypto.randomUUID()}${imageFileExtension(imageType)}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payments')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return `/uploads/payments/${filename}`
}
