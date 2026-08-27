// app/admin/clubs/[id]/edit/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateClub } from "../action";

const prisma = new PrismaClient();

export default async function EditClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  // Ambil data klub yang mau diedit
  const club = await prisma.club.findUnique({
    where: { id: id },
  });

  if (!club) return notFound();

  // Mengikat ID klub ke fungsi update
  const updateClubWithId = updateClub.bind(null, id);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/clubs" className="text-primary-700 font-semibold text-sm hover:underline mb-4 inline-block">
          &larr; Batal & Kembali
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Data Klub</h1>
      </div>

      <form action={updateClubWithId} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Nama Klub *</label>
          {/* Gunakan defaultValue untuk menampilkan data yang sudah ada */}
          <input type="text" name="name" defaultValue={club.name} required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Lokasi / Lapangan Utama</label>
          <input type="text" name="location" defaultValue={club.location || ""} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Kontak (WA / IG)</label>
          <input type="text" name="contact" defaultValue={club.contact || ""} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Link Logo / Gambar</label>
          <input type="url" name="logo" defaultValue={club.logo || ""} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Singkat</label>
          <textarea name="description" defaultValue={club.description || ""} rows={4} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"></textarea>
        </div>

        <button type="submit" className="w-full bg-primary text-[#ffffff] font-bold py-4 rounded-xl hover:bg-primary-hover transition">
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}