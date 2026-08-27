// app/admin/clubs/create/page.tsx
import Link from "next/link";
import { createClub } from "../action";

export default function CreateClubPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/clubs" className="text-primary-700 font-semibold text-sm hover:underline mb-4 inline-block">
          &larr; Kembali ke Daftar Klub
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Tambah Klub Baru</h1>
      </div>

      <form action={createClub} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Nama Klub *</label>
          <input type="text" name="name" required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Contoh: Denpasar Pickleball Club" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Lokasi / Lapangan Utama</label>
          <input type="text" name="location" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Contoh: Lapangan Renon" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Kontak (WA / IG)</label>
          <input type="text" name="contact" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Contoh: 08123456789 atau @denpasarpickleball" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Link Logo / Gambar</label>
          <input type="url" name="logo" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="https://..." />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Singkat</label>
          <textarea name="description" rows={4} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Ceritakan sedikit tentang klub ini..."></textarea>
        </div>

        <button type="submit" className="w-full bg-primary text-[#ffffff] font-bold py-4 rounded-xl hover:bg-primary-hover transition">
          Simpan Klub
        </button>
      </form>
    </div>
  );
}