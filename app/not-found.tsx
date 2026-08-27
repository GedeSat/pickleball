import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black text-primary-800 dark:text-primary-100 tracking-tight">
          404
        </div>
        <div className="mt-2 text-sm font-bold uppercase tracking-widest text-gold">
          Halaman tidak ditemukan
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Halaman yang Anda cari mungkin sudah dihapus, dipindahkan, atau tidak pernah ada.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-[#ffffff] px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}