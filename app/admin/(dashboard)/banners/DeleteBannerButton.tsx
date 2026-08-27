// app/admin/(dashboard)/banners/DeleteBannerButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { deleteBanner } from "./actions";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/swal";

export default function DeleteBannerButton({ id }: { id: number }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md transition"
      onClick={async () => {
        const confirmed = await showDeleteConfirm("Yakin ingin menghapus banner ini?");
        if (confirmed) {
          try {
            await deleteBanner(id);
            showSuccess("Banner berhasil dihapus!");
            router.refresh();
          } catch {
            showError("Gagal menghapus banner.");
          }
        }
      }}
    >
      Hapus
    </button>
  );
}