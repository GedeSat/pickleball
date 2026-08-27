"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
// Tipe data yang disesuaikan dengan yang akan dikirim dari database
interface Tournament {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  status: string;
  image: string | null; // Bisa null jika belum ada gambar
}

export default function TournamentClient({
  tournaments,
  archivedTournaments = [],
}: {
  tournaments: Tournament[];
  archivedTournaments?: Tournament[];
}) {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(
    null,
  );

  // --- TAMPILAN 1: DAFTAR TURNAMEN ---
  if (!activeTournament) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Pusat Turnamen IPF
            </h1>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Pantau jadwal, hasil pertandingan, dan klasemen dari berbagai
              kejuaraan Pickleball resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.length === 0 ? (
              <p className="text-center col-span-full text-slate-500 dark:text-slate-400">
                Belum ada turnamen yang tersedia saat ini.
              </p>
            ) : (
              tournaments.map((tourney) => (
                <TournamentCard key={tourney.id} tourney={tourney} />
              ))
            )}
          </div>

          {/* Riwayat Turnamen (arsip COMPLETED) */}
          {archivedTournaments.length > 0 && (
            <div className="mt-16">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  🏆 Riwayat Turnamen
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Kejuaraan yang telah selesai dan hasilnya masih bisa dilihat.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {archivedTournaments.map((tourney) => (
                  <TournamentCard key={tourney.id} tourney={tourney} archived />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: DETAIL TURNAMEN ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => setActiveTournament(null)}
          className="mb-8 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
        >
          &larr; Kembali ke Daftar Turnamen
        </button>

        <header className="mb-10 text-center bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="inline-block px-4 py-1 bg-amber-100 text-amber-900 rounded-full text-sm font-bold mb-4">
            {activeTournament.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {activeTournament.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {activeTournament.location} • {activeTournament.date}
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center animate-fade-in">
          <div className="text-5xl mb-4">🏓</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Informasi Pertandingan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Bagan dan hasil pertandingan untuk turnamen ini belum tersedia atau
            sedang dalam tahap penyusunan.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KARTU TURNAMEN (dipakai untuk daftar aktif & riwayat)
// ============================================================
function TournamentCard({
  tourney,
  archived = false,
}: {
  tourney: Tournament;
  archived?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border shadow-sm transition-all duration-300 flex flex-col group ${
        archived
          ? "border-slate-300 dark:border-slate-700 hover:shadow-lg opacity-90"
          : "border-slate-200 dark:border-slate-700 hover:shadow-xl"
      }`}
    >
      <div className="h-48 w-full relative overflow-hidden bg-slate-200 dark:bg-slate-700">
        <Image
          src={tourney.image || "/no-image.png"}
          alt={tourney.title}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
            archived ? "grayscale-[30%]" : ""
          }`}
        />
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm">
          {archived || tourney.status === "COMPLETED" ? (
            <span className="text-slate-600 dark:text-slate-300">Selesai</span>
          ) : tourney.status === "ONGOING" ? (
            <span className="text-emerald-600">Sedang Berjalan</span>
          ) : tourney.status === "UPCOMING" ? (
            <span className="text-primary-700 dark:text-primary-300">Akan Datang</span>
          ) : tourney.status === "DRAFT" ? (
            <span className="text-slate-400">Draft</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{tourney.status}</span>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <span className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-2">
          {tourney.category}
        </span>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 line-clamp-2">
          {tourney.title}
        </h3>
        <div className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>📅</span> {tourney.date}
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span> {tourney.location}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
            {archived ? "Riwayat" : tourney.status}
          </span>

          <Link
            href={`/tournament/${tourney.id}`}
            className="text-primary-700 dark:text-primary-300 font-bold hover:text-primary-800 dark:hover:text-primary-200 text-sm"
          >
            {archived ? "Lihat Hasil" : "Lihat Detail & Daftar"} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
