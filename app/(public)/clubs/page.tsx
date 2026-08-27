// app/(public)/clubs/page.tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function PublicClubsPage() {
  // Ambil semua data klub dari database, urutkan berdasarkan nama (A-Z)
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Halaman */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
            Direktori Klub Pickleball
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Temukan klub Pickleball terdekat di sekitarmu, bergabunglah dengan komunitas, dan mulai bermain bersama!
          </p>
        </div>

        {/* Grid Daftar Klub */}
        {clubs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-4xl mb-4 block">🏜️</span>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Belum Ada Klub</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Daftar klub saat ini masih kosong.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubs.map((club) => (
              <div 
                key={club.id} 
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Area Logo / Gambar Placeholder */}
                <div className="h-48 bg-slate-100 dark:bg-slate-700 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-700">
                  {club.logo ? (
                    <img 
                      src={club.logo} 
                      alt={`Logo ${club.name}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <span className="text-5xl mb-2">🛡️</span>
                      <span className="text-sm font-bold uppercase tracking-widest">Klub</span>
                    </div>
                  )}
                </div>

                {/* Info Klub */}
                <div className="p-8 flex flex-col flex-grow">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{club.name}</h2>
                  
                  <div className="space-y-3 mt-4 mb-6 text-sm text-slate-600 dark:text-slate-300">
                    {/* Baris Lokasi */}
                    <div className="flex items-start gap-3">
                      <span className="text-amber-500 text-lg leading-none">📍</span>
                      <span className="leading-tight">{club.location || "Lokasi belum ditentukan"}</span>
                    </div>
                    
                    {/* Baris Kontak */}
                    <div className="flex items-start gap-3">
                      <span className="text-amber-500 text-lg leading-none">📱</span>
                      <span className="leading-tight font-medium">{club.contact || "Kontak belum tersedia"}</span>
                    </div>
                  </div>

                  {/* Deskripsi (line-clamp-3 agar teks yang terlalu panjang otomatis terpotong dengan ...) */}
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                    {club.description || "Belum ada deskripsi untuk klub ini."}
                  </p>
{/* Tombol Hubungi */}
                  {club.contact ? (
                    <a 
                      href={club.contact.includes('http') ? club.contact : `https://wa.me/${club.contact.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-[#ffffff] font-bold py-3 px-4 rounded-xl transition-colors mt-auto"
                    >
                      Hubungi Klub
                    </a>
                  ) : (
                    <button 
                      disabled
                      className="block w-full text-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-3 px-4 rounded-xl mt-auto cursor-not-allowed"
                    >
                      Kontak Belum Tersedia
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}