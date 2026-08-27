'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { deletePlayer } from './action';
import { showDeleteConfirm, showSuccess, showError } from '@/lib/swal';

export default function DeleteButton({ playerId }: { playerId: number }) {
  const router = useRouter();

  return (
    <button 
      type="button"
      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-danger hover:text-[#ffffff] hover:shadow-lg hover:shadow-red-500/30 font-semibold rounded-xl text-sm transition-all active:scale-95 flex items-center gap-1"
      onClick={async () => {
        const confirmed = await showDeleteConfirm('Yakin ingin menghapus pemain ini? Data yang dihapus tidak bisa dikembalikan.');
        if (confirmed) {
          try {
            const formData = new FormData();
            formData.set('id', playerId.toString());
            await deletePlayer(formData);
            showSuccess('Pemain berhasil dihapus!');
            router.refresh(); // 🔥 Refresh data tanpa reload halaman
          } catch (err) {
            showError('Gagal menghapus pemain.');
          }
        }
      }}
    >
      🗑️ Hapus
    </button>
  );
}