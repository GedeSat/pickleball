// app/admin/(dashboard)/banners/BannerForm.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { showError } from "@/lib/swal";

const GRADIENT_OPTIONS = [
  { value: "from-primary via-brand to-brand", label: "Navy" },
  { value: "from-gold via-brand to-brand", label: "Emas" },
  { value: "from-primary-900 via-brand to-brand", label: "Navy Gelap" },
  { value: "from-amber-500 via-brand to-brand", label: "Amber" },
];

export type BannerFormData = {
  tag: string;
  title: string;
  titleHighlight: string;
  desc: string;
  image: string;
  bgGradient: string;
  order: number;
  active: boolean;
};

export default function BannerForm({
  action,
  banner,
}: {
  action: (formData: FormData) => Promise<void>;
  banner?: BannerFormData | null;
}) {
  const [imageUrl, setImageUrl] = useState(banner?.image || "");
  const [isUploading, setIsUploading] = useState(false);
  const [gradient, setGradient] = useState(
    banner?.bgGradient || GRADIENT_OPTIONS[0].value
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.data?.url) setImageUrl(data.data.url);
      else if (data.url) setImageUrl(data.url);
      else showError(data.error?.details || data.error || "Gagal upload gambar");
    } catch {
      showError("Terjadi kesalahan sistem saat upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form action={action} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Judul Banner *</label>
        <input
          type="text" name="title" defaultValue={banner?.title} required
          placeholder="Contoh: Selamat Datang di"
          className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Judul Highlight (teks gradasi emas) *</label>
        <input
          type="text" name="titleHighlight" defaultValue={banner?.titleHighlight}
          placeholder="Contoh: Pickleball Denpasar"
          className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Label / Tag</label>
        <input
          type="text" name="tag" defaultValue={banner?.tag}
          placeholder="Contoh: Portal Resmi IPF"
          className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
        <textarea
          name="desc" defaultValue={banner?.desc} rows={3}
          placeholder="Teks pendukung di bawah judul"
          className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary resize-y"
        ></textarea>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700">Gambar Banner *</label>
        <div className="flex flex-col sm:flex-row gap-6">
          <input
            type="file" accept="image/*" onChange={handleUpload} disabled={isUploading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary-50 file:text-primary-800 cursor-pointer"
          />
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Preview"
              width={160}
              height={96}
              className="w-40 h-24 object-cover rounded-xl border"
            />
          )}
        </div>
        <input type="hidden" name="image" value={imageUrl} />
        {isUploading && <p className="text-sm text-primary-700 animate-pulse">Mengunggah...</p>}
        {!imageUrl && <p className="text-xs text-red-500">Wajib pilih gambar.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Gradasi Latar Belakang</label>
          <input type="hidden" name="bgGradient" value={gradient} />
          <div className="grid grid-cols-2 gap-3">
            {GRADIENT_OPTIONS.map((g) => (
              <button
                type="button"
                key={g.value}
                onClick={() => setGradient(g.value)}
                className={`text-left rounded-xl border-2 overflow-hidden transition ${
                  gradient === g.value
                    ? "border-primary shadow-md"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <div className={`h-10 bg-gradient-to-r ${g.value}`}></div>
                <div className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white">
                  {g.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Urutan Tampil</label>
          <input
            type="number" name="order" defaultValue={banner?.order ?? 0} min={0}
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox" name="active" defaultChecked={banner ? banner.active : true}
          className="w-5 h-5 accent-[#0B2447]"
        />
        <span className="text-sm font-semibold text-slate-700">Aktif (tampil di beranda)</span>
      </label>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="submit" disabled={isUploading || !imageUrl}
          className="bg-primary hover:bg-primary-hover disabled:bg-slate-400 text-[#ffffff] px-8 py-3 rounded-lg font-medium transition"
        >
          {isUploading ? "Tunggu..." : "Simpan Banner"}
        </button>
      </div>
    </form>
  );
}