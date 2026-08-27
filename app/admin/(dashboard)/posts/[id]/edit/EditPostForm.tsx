// app/admin/posts/[id]/edit/EditPostForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { updatePost } from "../../actions";
import { showError } from "@/lib/swal";

export default function EditPostForm({ post }: { post: any }) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Fungsi upload gambar
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

  // Gunakan gambar baru jika diupload, jika tidak tampilkan gambar lama
  const displayImage = imageUrl || post.image;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="text-slate-500 hover:text-slate-900">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Artikel</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form action={updatePost} className="space-y-6">
          {/* Hidden inputs untuk ID dan Gambar Baru */}
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="image" value={imageUrl} />

          {/* Judul Artikel */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Judul Artikel *</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={post.title}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Upload Gambar */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Ganti Gambar Cover</label>
            <div className="flex flex-col sm:flex-row gap-6">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={isUploading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary-50 file:text-primary-800 cursor-pointer"
              />
              
              {/* Preview Gambar (Lama atau Baru) */}
              {displayImage && (
                <img
                  src={displayImage}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-xl border border-slate-200"
                />
              )}
            </div>
            {isUploading && <p className="text-sm text-primary-700 animate-pulse">Mengunggah...</p>}
          </div>

          {/* Isi Konten Artikel */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Isi Konten *</label>
            <textarea
              name="content"
              required
              rows={8}
              defaultValue={post.content}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary resize-y"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-[#ffffff] px-8 py-3 rounded-lg font-medium"
            >
              {isUploading ? "Tunggu..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}