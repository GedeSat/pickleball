import React from "react";
import Link from "next/link";
import { createTournament } from "./actions"; // Import fungsi yang kita buat tadi
import GradePicker from "@/components/GradePicker";
import { DEFAULT_TOURNAMENT_GRADES } from "@/lib/tournamentGrades";

export default function CreateTournamentPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tournaments" className="text-slate-500 hover:text-slate-900">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Tambah Turnamen Baru</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        {/* Hubungkan form ini dengan Server Action: createTournament */}
        <form action={createTournament} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Turnamen */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">Nama Turnamen *</label>
              <input type="text" id="name" name="name" required placeholder="Contoh: Jakarta Pickleball Open 2026" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
            </div>

            {/* Lokasi */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="location" className="text-sm font-medium text-slate-700">Lokasi Pertandingan *</label>
              <input type="text" id="location" name="location" required placeholder="Contoh: GOR Soemantri Brodjonegoro" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
            </div>

            {/* Tanggal Mulai */}
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium text-slate-700">Tanggal Mulai *</label>
              <input type="date" id="startDate" name="startDate" required 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Tanggal Selesai */}
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium text-slate-700">Tanggal Selesai *</label>
              <input type="date" id="endDate" name="endDate" required 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Biaya Pendaftaran */}
            <div className="space-y-2">
              <label htmlFor="registrationFee" className="text-sm font-medium text-slate-700">Biaya Pendaftaran (Rp)</label>
              <input type="number" id="registrationFee" name="registrationFee" defaultValue="0" min="0" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Maksimal Peserta */}
            <div className="space-y-2">
              <label htmlFor="maxParticipants" className="text-sm font-medium text-slate-700">Maksimal Peserta *</label>
              <input type="number" id="maxParticipants" name="maxParticipants" required min="2" placeholder="Contoh: 32"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-slate-700">Status Turnamen</label>
              <select id="status" name="status" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all">
                <option value="DRAFT">Draft (Belum Rilis)</option>
                <option value="UPCOMING">Upcoming (Buka Pendaftaran)</option>
                <option value="ONGOING">Ongoing (Sedang Berjalan)</option>
              </select>
            </div>
          </div>

          {/* Tingkat / Grade yang tersedia */}
          <GradePicker defaultGrades={DEFAULT_TOURNAMENT_GRADES as unknown as string[]} />

          {/* Deskripsi */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">Deskripsi / Peraturan</label>
            <textarea id="description" name="description" rows={5} placeholder="Tuliskan aturan, sistem pertandingan, dll..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"></textarea>
          </div>

          {/* Input Kategori */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="category" className="text-sm font-medium text-slate-700">Kategori Turnamen *</label>
              <input type="text" id="category" name="category" required placeholder="Contoh: Men's Doubles All Age" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Input Poster / Gambar */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="image" className="text-sm font-medium text-slate-700">Poster / Gambar Turnamen</label>
              <input type="file" id="image" name="image" accept="image/*" 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-800 hover:file:bg-primary-100" />
              <p className="text-xs text-slate-500 mt-1">Format didukung: JPG, PNG. Ukuran ideal 16:9.</p>
            </div>

          {/* Tombol Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" className="bg-primary hover:bg-primary-hover text-[#ffffff] px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
              Simpan Turnamen
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}