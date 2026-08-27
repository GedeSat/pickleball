"use client";

export default function Error({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black text-red-500">⚠️</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
          Terjadi Kesalahan
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Maaf, ada masalah saat memuat halaman ini. Silakan coba lagi.
        </p>
        <button
          onClick={() => reset()}
          className="mt-8 bg-primary hover:bg-primary-hover text-[#ffffff] px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}