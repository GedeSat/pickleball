'use client';

import React, { useState } from 'react';
import { showSuccess, showError } from '@/lib/swal';

// Tipe data untuk form
interface FormData {
  nama: string;
  email: string;
  pesan: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    email: '',
    pesan: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handler untuk mendeteksi perubahan input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler saat form disubmit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data?.message || 'Gagal mengirim pesan. Silakan coba lagi.');
        return;
      }

      showSuccess(`Terima kasih ${formData.nama}, pesan Anda telah terkirim!`);
      setFormData({ nama: '', email: '', pesan: '' }); // Reset form
    } catch {
      showError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-8 font-sans">
      
      {/* Container Utama */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Sisi Kiri: Informasi Kontak */}
        <div className="bg-brand text-[#ffffff] p-8 md:p-12 md:w-2/5 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-4">Mari Berbincang!</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Punya pertanyaan, ide, atau proyek menarik? Jangan ragu untuk menghubungi kami. Kami akan membalas secepatnya.
          </p>
          
          <div className="space-y-6">
            <div>
              <span className="block text-[#cbd5e1] font-semibold mb-1">
                <svg className="inline-block w-4 h-4 mr-1 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </span>
              <a href="mailto:halo@perusahaananda.com" className="text-[#ffffff] hover:text-amber-400 transition-colors">
                halo@perusahaananda.com
              </a>
            </div>
            <div>
              <span className="block text-[#cbd5e1] font-semibold mb-1">
                <svg className="inline-block w-4 h-4 mr-1 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.4 1.15l-1.56 1.04a13.53 13.53 0 006.09 6.09l1.04-1.56a1 1 0 011.15-.4l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                </svg>
                Telepon / WhatsApp
              </span>
              <p className="text-[#ffffff]">+62 812 3456 7890</p>
            </div>
            <div>
              <span className="block text-[#cbd5e1] font-semibold mb-1">
                <svg className="inline-block w-4 h-4 mr-1 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Alamat Kantor
              </span>
              <p className="text-[#ffffff] leading-relaxed">
                Jl. Sudirman No. 123, Jakarta Selatan<br />Indonesia, 12190
              </p>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Formulir Kontak */}
        <div className="p-8 md:p-12 md:w-3/5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Kirim Pesan</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nama" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Nama Lengkap</label>
              <input
                type="text"
                id="nama"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Masukkan nama Anda"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Alamat Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@contoh.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            
            <div>
              <label htmlFor="pesan" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Pesan Anda</label>
              <textarea
                id="pesan"
                name="pesan"
                value={formData.pesan}
                onChange={handleChange}
                placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 resize-y"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-[#ffffff] font-bold text-lg transition-all ${
                isSubmitting 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-hover hover:shadow-lg active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Pesan Sekarang'}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
};

export default Contact;