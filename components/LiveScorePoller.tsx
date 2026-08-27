"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LiveScorePoller({
  intervalMs = 15000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
      setLastUpdated(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-600"
      title="Halaman diperbarui otomatis setiap beberapa detik"
    >
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      LIVE
      {lastUpdated &&
        ` • ${lastUpdated.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}`}
    </span>
  );
}