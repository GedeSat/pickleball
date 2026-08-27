"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createPost } from "../actions";
import { showError } from "@/lib/swal";

export default function CreatePostPage() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.url) setImageUrl(data.url);
      else showError(data.error || "Gagal upload gambar");
    } catch (error) {
      showError("Terjadi kesalahan sistem saat upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="text-slate-500 hover:text-slate-900">← Kembali</Link>
        <h1 className="text-2xl font-bold text-slate-900">Tulis Artikel Baru</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form action={createPost} className="space-y-6">
          <input type="hidden" name="image" value={imageUrl} />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Judul Artikel *</label>
            <input type="text" name="title" required className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Gambar Cover</label>
            <div className="flex flex-col sm:flex-row gap-6">
              <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary-50 file:text-primary-800 cursor-pointer" />
              {imageUrl && <img src={imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl border" />}
            </div>
            {isUploading && <p className="text-sm text-primary-700 animate-pulse">Mengunggah...</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Isi Konten *</label>
            <textarea name="content" required rows={8} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary resize-y"></textarea>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" disabled={isUploading} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-[#ffffff] px-8 py-3 rounded-lg font-medium">
              {isUploading ? "Tunggu..." : "Terbitkan Artikel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}