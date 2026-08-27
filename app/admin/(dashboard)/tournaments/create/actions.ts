'use server'

import { TournamentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { writeFile } from 'fs/promises' // Modul untuk menyimpan file
import path from 'path'
import { parseGradeOptionsPayload } from '@/lib/tournamentGrades'

export async function createTournament(formData: FormData) {
  const name = formData.get('name') as string
  const category = formData.get('category') as string // Ambil kategori
  const location = formData.get('location') as string
  const description = formData.get('description') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const registrationFee = formData.get('registrationFee') as string
  const maxParticipants = formData.get('maxParticipants') as string
  const status = formData.get('status') as TournamentStatus

  // --- PROSES UPLOAD GAMBAR ---
  const imageFile = formData.get('image') as File
  let imagePath = null // Default kosong

  // Jika admin memasukkan file gambar (ukurannya > 0)
  if (imageFile && imageFile.size > 0) {
    // Ubah file menjadi buffer (format yang bisa dibaca Node.js)
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    
    // Buat nama file unik (gabungan timestamp + nama asli, spasi diganti underscore)
    const filename = Date.now() + '-' + imageFile.name.replaceAll(' ', '_')
    
    // Tentukan lokasi penyimpanan (folder public/uploads)
    const filepath = path.join(process.cwd(), 'public/uploads', filename)
    
    // Simpan file ke folder fisik
    await writeFile(filepath, buffer)
    
    // Simpan path-nya untuk dimasukkan ke database MySQL
    imagePath = `/uploads/${filename}`
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  // Tingkat (grade) yang dipilih admin untuk turnamen ini
  const selectedGrades = parseGradeOptionsPayload(formData.getAll('grades') as string[])

  await prisma.tournament.create({
    data: {
      name,
      slug,
      category, // Simpan kategori
      image: imagePath, // Simpan path gambar ("/uploads/namafile.jpg")
      location,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationFee: parseInt(registrationFee) || 0,
      maxParticipants: parseInt(maxParticipants) || 0,
      gradeOptions: selectedGrades.length > 0 ? JSON.stringify(selectedGrades) : null,
      status,
    }
  })

  revalidatePath('/admin/tournaments')
  redirect('/admin/tournaments')
}