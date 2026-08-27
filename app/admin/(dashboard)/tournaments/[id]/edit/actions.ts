'use server'

import { TournamentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { parseGradeOptionsPayload } from '@/lib/tournamentGrades'

export async function updateTournament(formData: FormData) { 
  const id = parseInt(formData.get('id') as string) 
  const name = formData.get('name') as string
  const category = formData.get('category') as string 
  const location = formData.get('location') as string
  const description = formData.get('description') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const registrationFee = formData.get('registrationFee') as string
  const maxParticipants = formData.get('maxParticipants') as string
  const status = formData.get('status') as TournamentStatus

  // 🔥 AMBIL STRING URL GAMBAR DARI FORM (Bukan File lagi)
  const imageUrl = formData.get('image') as string

  // Tingkat (grade) yang dipilih admin untuk turnamen ini
  const selectedGrades = parseGradeOptionsPayload(formData.getAll('grades') as string[])

  // Buat slug dari nama turnamen
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  // Lakukan proses UPDATE ke database
  await prisma.tournament.update({
    where: { id: id },
    data: {
      name,
      slug,
      category,
      location,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationFee: parseInt(registrationFee) || 0,
      maxParticipants: parseInt(maxParticipants) || 0,
      gradeOptions: selectedGrades.length > 0 ? JSON.stringify(selectedGrades) : null,
      status,
      // 🔥 Masukkan URL gambar ke database jika ada!
      ...(imageUrl ? { image: imageUrl } : {}) 
    }
  })

  // Refresh cache halaman agar perubahannya langsung terlihat di web
  revalidatePath('/admin/tournaments')
  revalidatePath('/tournament') // Asumsi ini halaman publikmu
  revalidatePath('/') 
  
  redirect('/admin/tournaments')
}