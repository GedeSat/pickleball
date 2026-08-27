import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-16 border-t border-brand-2">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* KOLOM 1: IDENTITAS & LOGO */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white border-2 border-[#334155]">
              <Image 
                src="/img/logo.png" 
                alt="Logo IPF Denpasar" 
                width={48} 
                height={48} 
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-[#ffffff] tracking-tight leading-none">IPF KOTA DENPASAR</span>
              <span className="text-xs text-amber-500 mt-1">Indonesia Pickleball Federation</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Mewadahi, membina, dan mengembangkan olahraga Pickleball di Kota Denpasar. Mari bergabung dan jadilah bagian dari olahraga dengan pertumbuhan tercepat di dunia!
          </p>
        </div>

        {/* KOLOM 2: TAUTAN CEPAT */}
        <div>
          <h4 className="text-[#ffffff] font-bold mb-6 uppercase tracking-wider text-sm">Tautan Cepat</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <span className="text-amber-500">&bull;</span> Berita & Artikel
              </Link>
            </li>
            <li>
              <Link href="/tournament" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <span className="text-amber-500">&bull;</span> Jadwal Turnamen
              </Link>
            </li>
            <li>
              <Link href="/payment" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <span className="text-amber-500">&bull;</span> Cek Pembayaran
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <span className="text-amber-500">&bull;</span> Tentang Kami
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <span className="text-amber-500">&bull;</span> Galeri Kegiatan
              </Link>
            </li>
          </ul>
        </div>

        {/* KOLOM 3: KONTAK & SEKRETARIAT */}
        <div>
          <h4 className="text-[#ffffff] font-bold mb-6 uppercase tracking-wider text-sm">Hubungi Kami</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                <strong className="text-slate-200 block mb-1">Sekretariat IPF Denpasar</strong>
               Jl. Raya Sesetan, <br />
                Denpasar, Bali, Indonesia 80232
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.4 1.15l-1.56 1.04a13.53 13.53 0 006.09 6.09l1.04-1.56a1 1 0 011.15-.4l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
              </svg>
              <span className="hover:text-amber-400 transition-colors cursor-pointer">+62 812 3456 7890</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hover:text-amber-400 transition-colors cursor-pointer">pickleballdenpasar@gmail.com</span>
            </li>
            
          </ul>
        </div>

      </div>

      {/* BAGIAN BAWAH (COPYRIGHT) */}
      <div className="max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-brand-2 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Indonesia Pickleball Federation (IPF) Kota Denpasar. Hak cipta dilindungi.</p>
      </div>
    </footer>
  );
}