// app/(public)/tournament/[id]/RegistrationModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { registerPlayer } from "./action";
import { showSuccess, showError } from "@/lib/swal";
import { parseTournamentGrades, gradeToLabel } from "@/lib/tournamentGrades";

type BankAccount = {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type PaymentMethodOption = {
  id: number;
  method: string;
  label: string;
  image: string | null;
};

type RegistrationTournament = {
  id: number;
  name: string;
  status: string;
  registrationFee: number;
  gradeOptions: string | null;
};

export default function RegistrationModal({ tournament }: { tournament: RegistrationTournament }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchType, setMatchType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const router = useRouter();

  // Tingkat yang tersedia mengikuti setting turnamen (pilihan admin)
  const availableGrades = parseTournamentGrades(tournament.gradeOptions);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/public/bank-accounts")
        .then((res) => res.json())
        .then((data) => setBankAccounts(data.data ?? []))
        .catch(() => {});
      fetch("/api/public/payment-methods")
        .then((res) => res.json())
        .then((data) => setPaymentMethods(data.data ?? []))
        .catch(() => {});
    }
  }, [isOpen]);

  if (tournament.status !== "UPCOMING") {
    return (
      <div className="bg-slate-100 text-slate-500 font-semibold px-6 py-3 rounded-xl inline-block">
        Pendaftaran Belum Dibuka / Sudah Tutup
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // MIXED: namaPutra & namaPutri tetap terkirim terpisah,
    // server yang membuat tim berisi 2 pemain.

    try {
      await registerPlayer(formData);

      form.reset();
      setMatchType("");
      setPaymentMethod("");
      setProofPreview(null);
      setIsSubmitting(false);
      setIsOpen(false);

      if (tournament.registrationFee > 0) {
        // Turnamen berbayar: ajak ke halaman cek pembayaran
        const result = await Swal.fire({
          icon: "success",
          title: "Pendaftaran Berhasil! 🎉",
          html:
            "Data Anda telah berhasil dikirim. Pastikan menyelesaikan pembayaran sesuai metode yang dipilih — statusnya bisa dicek kapan saja di halaman pembayaran.",
          showCancelButton: true,
          confirmButtonText: "Lihat Status Pembayaran",
          cancelButtonText: "Tutup",
          confirmButtonColor: "#4f46e5",
          cancelButtonColor: "#94a3b8",
          reverseButtons: true,
          customClass: {
            popup: "swal-rounded",
            confirmButton: "swal-btn",
            cancelButton: "swal-btn",
          },
        });
        if (result.isConfirmed) {
          router.push("/payment");
        }
      } else {
        showSuccess("Data Anda telah berhasil dikirim.", "Pendaftaran Berhasil! 🎉");
      }
    } catch (error) {
      setIsSubmitting(false);
      showError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mendaftar. Silakan coba lagi."
      );
    }
  };

  // Validasi client-side bukti transfer (gambar, maks 5MB)
  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showError("Bukti pembayaran harus berupa gambar (JPG/PNG/WebP).");
      e.target.value = "";
      setProofPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("Ukuran bukti pembayaran maksimal 5MB.");
      e.target.value = "";
      setProofPreview(null);
      return;
    }

    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(URL.createObjectURL(file));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary hover:bg-primary-hover text-[#ffffff] font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary-800/30 transition-all hover:scale-105"
      >
        Daftar Sekarang
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Form Pendaftaran</h2>
            <p className="text-sm text-slate-500 mb-6">
              Mendaftar untuk: <strong className="text-primary-700">{tournament.name}</strong>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="tournamentId" value={tournament.id} />

              {/* Tipe Pertandingan & Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Tipe Pertandingan *</label>
                  <select
                    name="matchType"
                    required
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="" disabled>-- Pilih Tipe --</option>
                    <option value="SINGLE">Single (Tunggal)</option>
                    <option value="DOUBLE">Double (Ganda)</option>
                    <option value="MIXED">Double Mix (Ganda Campuran)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Tingkat (Grade) *</label>
                  <select
                    name="grade"
                    required
                    defaultValue=""
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="" disabled>-- Pilih Tingkat --</option>
                    {availableGrades.map((grade) => (
                      <option key={grade} value={grade}>{gradeToLabel(grade)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama — kondisional berdasarkan matchType */}
              {matchType === "MIXED" ? (
                <div className="space-y-3">
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-xs text-primary-800 font-medium">
                    🏓 Double Mix: isi nama pemain putra dan putri secara terpisah
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Pemain Putra *</label>
                    <input
                      type="text"
                      name="namaPutra"
                      required
                      placeholder="Nama lengkap pemain putra"
                      className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Pemain Putri *</label>
                    <input
                      type="text"
                      name="namaPutri"
                      required
                      placeholder="Nama lengkap pemain putri"
                      className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              ) : matchType === "DOUBLE" ? (
                <div className="space-y-3">
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-xs text-primary-800 font-medium">
                    🏓 Double: isi 2 nama pemain dengan gender yang sama (sesuai pilihan Gender di bawah)
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Pemain 1 *</label>
                    <input
                      type="text"
                      name="namaPemain1"
                      required
                      placeholder="Nama lengkap pemain pertama"
                      className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Pemain 2 *</label>
                    <input
                      type="text"
                      name="namaPemain2"
                      required
                      placeholder="Nama lengkap pemain kedua"
                      className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">
                    Nama Lengkap Pemain *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Gender — sembunyikan kalau MIXED */}
              {matchType !== "MIXED" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Gender *</label>
                  <select
                    name="gender"
                    required
                    defaultValue=""
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="" disabled>-- Pilih Gender --</option>
                    <option value="MALE">Putra (Male)</option>
                    <option value="FEMALE">Putri (Female)</option>
                  </select>
                </div>
              )}

              {/* Kalau MIXED, kirim gender MIXED secara hidden */}
              {matchType === "MIXED" && (
                <input type="hidden" name="gender" value="MIXED" />
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Instansi / Sekolah / Klub *</label>
                <input
                  type="text"
                  name="schoolName"
                  required
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Pembayaran — hanya muncul jika turnamen berbayar */}
              {tournament.registrationFee > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Biaya Pendaftaran</p>
                    <p className="font-bold text-primary-800">
                      Rp {tournament.registrationFee.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">Metode Pembayaran *</label>
                    <select
                      name="paymentMethod"
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
                    >
                      <option value="" disabled>-- Pilih Metode --</option>
                      {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.method}>{pm.label}</option>
                      ))}
                    </select>
                  </div>

                  {paymentMethod && paymentMethod !== "VENUE" && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">
                        Upload Bukti Transfer *
                      </label>
                      <input
                        type="file"
                        name="paymentProof"
                        required
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProofChange}
                        className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary file:text-[#ffffff] file:font-semibold file:text-sm file:cursor-pointer"
                      />
                      {proofPreview && (
                        <img
                          src={proofPreview}
                          alt="Pratinjau bukti pembayaran"
                          className="mt-2 w-32 h-32 object-cover rounded-lg border border-slate-200"
                        />
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Transfer ke rekening resmi panitia, lalu unggah bukti transfer (JPG/PNG/WebP, maks 5MB).
                      </p>
                    </div>
                  )}

                  {paymentMethod === "TRANSFER" && bankAccounts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rekening Tujuan Transfer:</p>
                      {bankAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{acc.bankName}</p>
                            <p className="font-mono text-sm text-slate-600 tracking-wider">{acc.accountNumber}</p>
                          </div>
                          <p className="text-sm text-slate-500">{acc.accountName}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {paymentMethod && paymentMethod !== "TRANSFER" && paymentMethod !== "VENUE" && (() => {
                    const selectedPM = paymentMethods.find((pm) => pm.method === paymentMethod);
                    if (!selectedPM?.image) return null;
                    return (
                      <div className="flex justify-center">
                        <img
                          src={selectedPM.image}
                          alt={selectedPM.label}
                          className="max-w-[250px] max-h-[250px] object-contain rounded-xl border border-slate-200"
                        />
                      </div>
                    );
                  })()}

                  <p className="text-xs text-slate-500">
                    Pembayaran dikonfirmasi oleh panitia setelah bukti transfer diperiksa.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-[#ffffff] font-bold py-3 rounded-xl transition-colors mt-4"
              >
                {isSubmitting ? "Memproses..." : "Kirim Pendaftaran"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
