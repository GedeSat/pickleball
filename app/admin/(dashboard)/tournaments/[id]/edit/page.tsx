"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { updateTournament } from "./actions";
import { showError } from "@/lib/swal";
import GradePicker from "@/components/GradePicker";
import { parseTournamentGrades } from "@/lib/tournamentGrades";
export default function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // State Management
  const [tournament, setTournament] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 🔥 Fetch Data Awal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/tournaments/${id}`);
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
        
        const data = await res.json();
        const tournamentData = data?.data ?? data;
        if (tournamentData) {
          setTournament(tournamentData);
          setImageUrl(tournamentData.image || "");
        }
      } catch (error) {
        console.error("Gagal mengambil data turnamen:", error);
      }
    };

    if (id) fetchData();
  }, [id]);

  // 🔥 Handle Upload Gambar Terpisah
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true); // Aktifkan loading

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.url) {
        setImageUrl(data.url);
      } else {
        showError(data.error || "Gagal mengunggah gambar");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showError("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setIsUploading(false); // Matikan loading
    }
  };

  // 🔥 State Loading Layar Penuh
  if (!tournament) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat data turnamen...</p>
        </div>
      </div>
    );
  }

  // Tingkat yang aktif untuk turnamen ini
  const activeGrades = parseTournamentGrades(tournament.gradeOptions);

 const formatDateLocal = (date: string | Date | null | undefined): string => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
};

const formattedStartDate = tournament?.startDate
  ? formatDateLocal(tournament.startDate)
  : "";

const formattedEndDate = tournament?.endDate
  ? formatDateLocal(tournament.endDate)
  : "";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/tournaments" className="text-slate-500 hover:text-slate-900 transition-colors">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Turnamen</h1>
        <Link
          href={`/admin/tournaments/${id}/pools`}
          className="ml-auto inline-block px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold text-sm transition-colors"
        >
          🏊 Kelola Pool & Penempatan
        </Link>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
        <form action={updateTournament} className="space-y-6">
          
          {/* Hidden Inputs untuk Server Action */}
          <input type="hidden" name="id" value={tournament.id} />
          <input type="hidden" name="image" value={imageUrl} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Nama Turnamen */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nama Turnamen *</label>
              <input
                id="name"
                name="name"
                required
                defaultValue={tournament.name}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="Contoh: Jakarta Pickleball Open 2026"
              />
            </div>

            {/* Kategori Turnamen */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="category" className="text-sm font-semibold text-slate-700">Kategori Turnamen *</label>
              <input 
                type="text" 
                id="category" 
                name="category" 
                required 
                defaultValue={tournament.category || ""}
                placeholder="Contoh: Men's Doubles All Age" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
              />
            </div>

            {/* Lokasi */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="location" className="text-sm font-semibold text-slate-700">Lokasi Pertandingan *</label>
              <input
                id="location"
                name="location"
                required
                defaultValue={tournament.location}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="Contoh: GOR Soemantri Brodjonegoro"
              />
            </div>

            {/* Tanggal Mulai */}
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-semibold text-slate-700">Tanggal Mulai *</label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                required
                defaultValue={formattedStartDate}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Tanggal Selesai */}
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-semibold text-slate-700">Tanggal Selesai *</label>
              <input
                id="endDate"
                type="date"
                name="endDate"
                required
                defaultValue={formattedEndDate}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Biaya Pendaftaran */}
            <div className="space-y-2">
              <label htmlFor="registrationFee" className="text-sm font-semibold text-slate-700">Biaya Pendaftaran (Rp)</label>
              <input 
                type="number" 
                id="registrationFee" 
                name="registrationFee" 
                defaultValue={tournament.registrationFee} 
                min="0" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
              />
            </div>

            {/* Maksimal Peserta */}
            <div className="space-y-2">
              <label htmlFor="maxParticipants" className="text-sm font-semibold text-slate-700">Maksimal Peserta *</label>
              <input 
                type="number" 
                id="maxParticipants" 
                name="maxParticipants" 
                required 
                defaultValue={tournament.maxParticipants}
                min="2" 
                placeholder="Contoh: 32"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
              />
            </div>

            {/* Status */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="status" className="text-sm font-semibold text-slate-700">Status Turnamen</label>
              <select 
                id="status" 
                name="status" 
                defaultValue={tournament.status}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all bg-white"
              >
                <option value="DRAFT">Draft (Belum Rilis)</option>
                <option value="UPCOMING">Upcoming (Buka Pendaftaran)</option>
                <option value="ONGOING">Ongoing (Sedang Berjalan)</option>
                <option value="COMPLETED">Completed (Selesai)</option>
                <option value="CANCELED">Canceled (Dibatalkan)</option>
              </select>
            </div>

            {/* Tingkat / Grade yang tersedia */}
            <GradePicker defaultGrades={activeGrades} />

            {/* Upload Gambar */}
            <div className="space-y-3 md:col-span-2 pt-2 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-700">Ganti Poster / Gambar</label>
              
              {/* Info gambar saat ini jika ada */}
              {tournament.image && (
                <div className="mb-2 text-sm text-primary-700 bg-primary-50 p-3 rounded-md border border-primary-100 flex items-center gap-2">
                  <span>🖼️</span> Turnamen ini sudah memiliki gambar. Kosongkan jika tidak ingin mengubahnya.
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                    className="block w-full text-sm text-slate-500 
                      file:mr-4 file:py-2.5 file:px-4 
                      file:rounded-md file:border-0 
                      file:text-sm file:font-semibold 
                      file:bg-primary-50 file:text-primary-800 
                      hover:file:bg-primary-100 transition-all cursor-pointer disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-500 mt-2">Format didukung: JPG, PNG. Ukuran ideal 16:9.</p>

                  {isUploading && (
                    <p className="mt-2 text-sm text-primary-700 animate-pulse flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      Sedang mengunggah gambar...
                    </p>
                  )}
                </div>

                {/* Preview Gambar */}
                {imageUrl && (
                  <div className="shrink-0 relative group">
                    <img
                      src={imageUrl}
                      alt="Preview poster"
                      className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Deskripsi Turnamen */}
            <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100">
              <label htmlFor="description" className="text-sm font-semibold text-slate-700">Deskripsi / Peraturan</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={tournament.description || ""}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-y"
                placeholder="Tuliskan aturan, sistem pertandingan, dll..."
              ></textarea>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={isUploading}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-[#ffffff] px-8 py-3 rounded-lg font-medium transition-colors shadow-sm focus:ring-4 focus:ring-slate-200 outline-none"
            >
              {isUploading ? "Tunggu Sebentar..." : "Simpan Perubahan"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}