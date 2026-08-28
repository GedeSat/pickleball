"use client";

// ============================================================
// /wasit — Halaman Login Wasit (TANPA NextAuth)
// Wasit hanya mengisi: Nama Wasit + Kode Akses.
// Kode akses = 1 kode per turnamen. Setelah valid, sesi disimpan
// di localStorage dan user diarahkan ke /wasit/portal.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRefereeSession, saveRefereeSession } from "@/lib/refereeSession";

export default function WasitLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [refereeName, setRefereeName] = useState("");
  const [refereeCode, setRefereeCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Proteksi sederhana: jika sudah punya sesi, langsung ke portal
  useEffect(() => {
    if (getRefereeSession()) {
      setRedirecting(true);
      router.replace("/wasit/portal");
    }
    setMounted(true);
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Validasi client
    const name = refereeName.trim();
    const code = refereeCode.trim();
    if (!name) {
      setError("Nama wasit wajib diisi.");
      return;
    }
    if (!code) {
      setError("Kode akses wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/wasit/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refereeName: name, refereeCode: code }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        // Simpan sesi di localStorage agar tidak login ulang saat refresh
        saveRefereeSession({
          refereeName: data.data.refereeName,
          refereeCode: data.data.refereeCode,
          tournamentId: data.data.tournamentId,
          loginAt: data.data.loginAt,
        });
        router.replace("/wasit/portal");
      } else {
        setError(data.message || "Kode akses tidak valid.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // Tampilkan splash selama pemulihan sesi / sedang dialihkan ke portal
  if (!mounted || redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand via-brand-2 to-brand flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-4xl inline-block animate-bounce">🏁</span>
          <p className="text-slate-400 mt-4 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand via-brand-2 to-brand flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-800/30">
            <span className="text-4xl">🏁</span>
          </div>
          <h1 className="text-3xl font-black text-[#ffffff] tracking-tight">Login Wasit</h1>
          <p className="text-slate-400 mt-2 text-sm">Masuk menggunakan kode akses turnamen</p>
        </div>

        {/* Form */}
        <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-xl border border-[rgba(255,255,255,0.15)] rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="wasit-name" className="block text-sm font-semibold text-slate-300 mb-2">
                Nama Wasit
              </label>
              <input
                id="wasit-name"
                type="text"
                required
                value={refereeName}
                onChange={(e) => { setRefereeName(e.target.value); setError(""); }}
                placeholder="Tulis nama lengkap Anda..."
                autoComplete="off"
                autoFocus
                className="w-full px-4 py-3.5 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-xl text-[#ffffff] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              />
            </div>

            <div>
              <label htmlFor="wasit-code" className="block text-sm font-semibold text-slate-300 mb-2">
                Kode Akses
              </label>
              <input
                id="wasit-code"
                type="password"
                required
                value={refereeCode}
                onChange={(e) => { setRefereeCode(e.target.value); setError(""); }}
                placeholder="Kode akses dari panitia..."
                autoComplete="off"
                className="w-full px-4 py-3.5 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-xl text-[#ffffff] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              />
            </div>

            {error && (
              <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <p className="text-xs text-slate-400 bg-[rgba(255,255,255,0.05)] rounded-lg p-3 border border-[rgba(255,255,255,0.1)]">
              ⚠️ Nama yang Anda masukkan tercatat otomatis saat menginput skor. Tanyakan kode
              akses ke panitia jika belum memilikinya.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-[#ffffff] font-bold rounded-xl transition-colors text-base shadow-lg shadow-primary-800/30 disabled:opacity-50"
            >
              {submitting ? "Memverifikasi..." : "Masuk ke Portal Wasit →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}