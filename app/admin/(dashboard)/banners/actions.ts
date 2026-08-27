// app/admin/(dashboard)/banners/actions.ts
'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

const DEFAULT_GRADIENT = 'from-primary via-brand to-brand'

function readBannerFields(formData: FormData) {
  return {
    tag: (formData.get('tag') as string) || '',
    title: (formData.get('title') as string) || '',
    titleHighlight: (formData.get('titleHighlight') as string) || '',
    desc: (formData.get('desc') as string) || '',
    image: (formData.get('image') as string) || '',
    bgGradient: (formData.get('bgGradient') as string) || DEFAULT_GRADIENT,
    order: parseInt(formData.get('order') as string) || 0,
    active: formData.get('active') === 'on',
  }
}

function refreshPaths() {
  revalidatePath('/admin/banners')
  revalidatePath('/')
  revalidatePath('/api/banners')
}

export async function createBanner(formData: FormData) {
  const data = readBannerFields(formData)
  if (!data.title || !data.image) return

  await prisma.banner.create({ data })

  refreshPaths()
  redirect('/admin/banners')
}

export async function updateBanner(id: number, formData: FormData) {
  const data = readBannerFields(formData)
  if (!data.title || !data.image) return

  await prisma.banner.update({ where: { id }, data })

  refreshPaths()
  redirect('/admin/banners')
}

export async function deleteBanner(id: number) {
  await prisma.banner.delete({ where: { id } })
  refreshPaths()
}

export async function toggleBanner(id: number, active: boolean) {
  await prisma.banner.update({ where: { id }, data: { active } })
  refreshPaths()
}