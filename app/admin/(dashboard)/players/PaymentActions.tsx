'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { confirmPayment, resetPayment } from './action';
import { showConfirm, showSuccess, showError } from '@/lib/swal';

export default function PaymentActions({ type, id, status }: { type: 'player' | 'team'; id: number; status: string | null }) {
  const router = useRouter();

  const handleConfirm = async () => {
    const confirmed = await showConfirm(
      'Yakin pembayaran ini sudah lunas? Status akan berubah menjadi LUNAS.',
      'Konfirmasi Pembayaran ✓',
      'Ya, Konfirmasi'
    );
    if (!confirmed) return;
    try {
      const formData = new FormData();
      formData.set('type', type);
      formData.set('id', id.toString());
      await confirmPayment(formData);
      showSuccess('Pembayaran telah dikonfirmasi.');
      router.refresh();
    } catch {
      showError('Gagal mengkonfirmasi pembayaran.');
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirm(
      'Batalkan konfirmasi dan kembalikan status menjadi Belum Bayar?',
      'Batalkan Konfirmasi',
      'Ya, Batalkan'
    );
    if (!confirmed) return;
    try {
      const formData = new FormData();
      formData.set('type', type);
      formData.set('id', id.toString());
      await resetPayment(formData);
      showSuccess('Status pembayaran dikembalikan ke Belum Bayar.');
      router.refresh();
    } catch {
      showError('Gagal membatalkan konfirmasi.');
    }
  };

  if (status === 'PAID') {
    return (
      <button
        type="button"
        onClick={handleReset}
        className="px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-[#ffffff] hover:shadow-lg hover:shadow-amber-500/30 font-semibold rounded-lg text-xs transition-all active:scale-95 whitespace-nowrap"
      >
        ↺ Batal
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConfirm}
      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-[#ffffff] hover:shadow-lg hover:shadow-emerald-500/30 font-semibold rounded-lg text-xs transition-all active:scale-95 whitespace-nowrap"
    >
      ✓ Konfirmasi
    </button>
  );
}
