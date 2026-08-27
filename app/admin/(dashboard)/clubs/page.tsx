// app/admin/clubs/page.tsx
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import DeleteClubButton from "./DeleteClubButton";

const prisma = new PrismaClient();

export default async function AdminClubsPage() {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Kelola Klub</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar klub Pickleball yang terdaftar.</p>
        </div>
        <Link 
          href="/admin/clubs/create" 
          className="bg-slate-900 text-[#ffffff] px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition"
        >
          + Tambah Klub
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 uppercase">
              <th className="p-4 font-semibold">Nama Klub</th>
              <th className="p-4 font-semibold">Lokasi</th>
              <th className="p-4 font-semibold">Kontak</th>
              <th className="p-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {clubs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500">Belum ada data klub.</td>
              </tr>
            ) : (
              clubs.map((club) => (
                <tr key={club.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{club.name}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{club.location || ""}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{club.contact || "-"}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {/* Placeholder untuk tombol Edit nanti */}
                    <Link href={`/admin/clubs/${club.id}/edit`} className="text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-200/20 px-3 py-1 rounded-md transition font-medium text-sm">
                      Edit
                    </Link>
                    <DeleteClubButton id={club.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}