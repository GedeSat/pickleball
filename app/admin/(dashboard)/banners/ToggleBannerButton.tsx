// app/admin/(dashboard)/banners/ToggleBannerButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toggleBanner } from "./actions";

export default function ToggleBannerButton({ id, active }: { id: number; active: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await toggleBanner(id, !active);
        router.refresh();
      }}
      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
        active
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
      }`}
    >
      {active ? "Aktif" : "Nonaktif"}
    </button>
  );
}