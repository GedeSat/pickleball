import { Suspense } from "react";
import { prisma } from '@/lib/prisma';
import { updatePlayer } from '../action';
import Link from 'next/link';
import { ALL_TOURNAMENT_GRADES, gradeToLabel } from '@/lib/tournamentGrades';

export default function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PlayerEditSkeleton />}>
      <EditPlayerContent params={params} />
    </Suspense>
  );
}

function PlayerEditSkeleton() {
  return (
    <div className="max-w-3xl mx-auto mt-4 animate-pulse">
      <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-48 rounded bg-slate-100 dark:bg-slate-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-700" />
          <div className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-700" />
          <div className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 md:col-span-2" />
        </div>
      </div>
    </div>
  );
}

async function EditPlayerContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const playerId = parseInt(resolvedParams.id);

  const player = await prisma.player.findUnique({
    where: { id: playerId }
  });

  // Tampilan Error
  if (!player) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-white p-10 rounded-3xl shadow-xl shadow-red-100/50 border border-red-50 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">🤔</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Pemain Tidak Ditemukan</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">Waduh, data pemain ini sepertinya sudah dihapus atau ID-nya salah ketik.</p>
        <Link href="/admin/players" className="inline-flex items-center justify-center bg-slate-900 text-[#ffffff] px-6 py-3 rounded-xl hover:bg-slate-800 font-medium transition-all hover:shadow-lg hover:-translate-y-0.5">
          &larr; Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // Tampilan Form Utama
  return (
    <div className="max-w-3xl mx-auto mt-4 bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-amber-500 rounded-2xl flex items-center justify-center text-[#ffffff] text-2xl shadow-lg shadow-primary-800/30">
            🎾
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Data Pemain</h1>
            <p className="text-slate-500 mt-1">
              Mengubah data <span className="font-semibold text-primary-700">{player.fullName}</span>
            </p>
          </div>
        </div>
        <Link 
          href="/admin/players" 
          className="inline-flex items-center px-5 py-2.5 bg-slate-500 text-[#ffffff] rounded-xl hover:bg-slate-600 font-medium transition-all shadow-sm"
        >
          ← Kembali
        </Link>
      </div>

      {/* Form Section */}
      <form action={updatePlayer} className="space-y-6">
        <input type="hidden" name="id" value={player.id} />

        {/* Grid agar layout lebih responsif */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nama Lengkap (Lebar Penuh) */}
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-700 block mb-2">Nama Lengkap Tim/Pemain <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="fullName" 
              defaultValue={player.fullName} 
              required 
              placeholder="Masukkan nama lengkap..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none text-slate-700 font-medium" 
            />
          </div>

          {/* Grade */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Grade</label>
            <select
              name="grade"
              defaultValue={player.grade}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none text-slate-700 font-medium"
            >
              {(ALL_TOURNAMENT_GRADES as readonly string[]).includes(player.grade) ? null : (
                <option value={player.grade}>{gradeToLabel(player.grade)}</option>
              )}
              {ALL_TOURNAMENT_GRADES.map((g) => (
                <option key={g} value={g}>{gradeToLabel(g)}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Gender</label>
            <select
              name="gender"
              defaultValue={player.gender}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none text-slate-700 font-medium"
            >
              <option value="MALE">Putra (MALE)</option>
              <option value="FEMALE">Putri (FEMALE)</option>
            </select>
          </div>

          {/* MatchType */}
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-700 block mb-2">Tipe Pertandingan</label>
            <select
              name="matchType"
              defaultValue={player.matchType}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none text-slate-700 font-medium"
            >
              <option value="SINGLE">SINGLE</option>
              <option value="DOUBLE">DOUBLE</option>
              <option value="MIXED">MIXED</option>
            </select>
          </div>

          {/* Instansi (Setengah Lebar) */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Instansi / Klub <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="schoolName" 
              defaultValue={player.schoolName} 
              required 
              placeholder="Asal sekolah atau klub..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none text-slate-700 font-medium" 
            />
          </div>

          {/* No WhatsApp (Lebar Penuh) */}
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-700 block mb-2">Nomor WhatsApp <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📱</span>
              <input 
                type="tel" 
                name="phoneNumber" 
                defaultValue={player.phoneNumber} 
                required 
                placeholder="Contoh: 081234567890"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/15 focus:border-green-500 transition-all outline-none text-slate-700 font-medium" 
              />
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="pt-8 mt-4 border-t border-slate-100">
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary-hover hover:to-amber-600 text-[#ffffff] font-bold py-4 rounded-2xl shadow-xl shadow-primary-800/30 transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Simpan Perubahan</span>
            <span className="text-xl">✨</span>
          </button>
        </div>
      </form>
    </div>
  );
}