"use client";

import React, { useState } from "react";
import { lookupPayments, uploadPaymentProof } from "./actions";
import type { PaymentLookupItem } from "./actions";
import { showSuccess, showError } from "@/lib/swal";

const METHOD_LABEL: Record<string, string> = {
  TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  EWALLET: "E-Wallet",
  VENUE: "Bayar di Tempat",
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function PaymentCheckPage() {
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<PaymentLookupItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setItems(null);
    try {
      const result = await lookupPayments(phone);
      setItems(result);
      if (result.length === 0) {
        showError(
          "Tidak ditemukan pendaftaran dengan nomor WhatsApp tersebut.",
          "Tidak Ditemukan 🔍"
        );
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canUpload = (item: PaymentLookupItem) =>
    item.registrationFee > 0 &&
    item.paymentStatus !== "PAID" &&
    item.paymentMethod !== null &&
    item.paymentMethod !== "VENUE";

  const handleUpload = async (item: PaymentLookupItem, file: File | null) => {
    if (!file) {
      showError("Pilih file bukti pembayaran terlebih dahulu.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showError("Bukti pembayaran harus berupa gambar (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("Ukuran bukti pembayaran maksimal 5MB.");
      return;
    }

    const key = `${item.type}-${item.id}`;
    setUploadingId(key);
    try {
      const fd = new FormData();
      fd.append("type", item.type);
      fd.append("id", String(item.id));
      fd.append("paymentProof", file);
      await uploadPaymentProof(fd);
      showSuccess("Bukti pembayaran terkirim. Status menunggu konfirmasi panitia.", "Bukti Terkirim 🧾");
      const result = await lookupPayments(phone);
      setItems(result);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal mengunggah bukti pembayaran."
      );
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-primary-50/40 dark:from-slate-900 dark:to-slate-900 pt-32 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-primary-800/40 mb-4">
            <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Cek Pembayaran Pendaftaran
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Masukkan nomor WhatsApp yang dipakai saat mendaftar untuk melihat status
            pembayaran atau mengunggah bukti transfer.
          </p>
        </div>

        {/* Form pencarian */}
        <form
          onSubmit={handleSearch}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 p-5 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-[#ffffff] font-bold px-6 py-3 rounded-xl transition-all active:scale-95"
          >
            {isLoading ? "Mencari..." : "Cari 🔍"}
          </button>
        </form>

        {/* Hasil */}
        {items !== null && items.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Ditemukan {items.length} pendaftaran untuk nomor ini:
            </p>

            {items.map((item) => {
              const key = `${item.type}-${item.id}`;
              const isPaid = item.paymentStatus === "PAID";
              const uploadable = canUpload(item);
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/40 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                        {item.tournamentName}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</h3>
                    </div>
                    {isPaid ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold whitespace-nowrap">
                        ✓ Lunas
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold whitespace-nowrap">
                        ⏳ Belum Bayar
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {item.registrationFee > 0 ? (
                      <>
                        <span>
                          Biaya:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {rupiah.format(item.registrationFee)}
                          </strong>
                        </span>
                        <span>
                          Metode:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {item.paymentMethod ? (METHOD_LABEL[item.paymentMethod] ?? item.paymentMethod) : "-"}
                          </strong>
                        </span>
                      </>
                    ) : (
                      <span className="text-emerald-600 font-semibold">Pendaftaran gratis</span>
                    )}
                  </div>

                  {item.paymentProof && (
                    <a
                      href={item.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary-700 dark:text-primary-300 hover:underline font-semibold"
                    >
                      📎 Lihat Bukti Terkirim
                    </a>
                  )}

                  {uploadable && !isPaid && (
                    <div className="bg-primary-50 dark:bg-primary-200/10 border border-primary-200 dark:border-primary-200/30 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Belum sempat mengunggah bukti? Kirim sekarang — panitia akan
                        memverifikasi setelah bukti diterima.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingId === key}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUpload(item, e.target.files[0]);
                            }
                            e.target.value = "";
                          }}
                          className="flex-1 text-sm p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary file:text-[#ffffff] file:font-semibold file:text-sm file:cursor-pointer"
                        />
                        <span className="text-xs text-slate-400">
                          JPG/PNG/WebP, maks 5MB
                        </span>
                      </div>
                    </div>
                  )}

                  {item.paymentMethod === "VENUE" && !isPaid && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pembayaran di tempat (venue) — akan dikonfirmasi panitia saat hari
                      pertandingan.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
