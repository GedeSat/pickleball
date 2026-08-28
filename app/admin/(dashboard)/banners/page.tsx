import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PrismaClient } from "@prisma/client";
import DeleteBannerButton from "./DeleteBannerButton";
import ToggleBannerButton from "./ToggleBannerButton";

const prisma = new PrismaClient();

export default function BannersPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kelola Banner Slider</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Banner tampil di beranda. Urutan kecil tampil lebih dulu.
          </p>
        </div>
        <Link
          href="/admin/banners/create"
          className="bg-primary hover:bg-primary-hover text-[#ffffff] px-4 py-2 rounded-lg font-medium transition"
        >
          + Tambah Banner
        </Link>
      </div>

      <Suspense fallback={<BannersTableSkeleton />}>
        <BannersTable />
      </Suspense>
    </div>
  );
}

function BannersTableSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="h-12 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700" />
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="h-20 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700"
        />
      ))}
    </div>
  );
}

async function BannersTable() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });

  if (banners.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          Belum ada banner. Klik &quot;Tambah Banner&quot; untuk membuat yang pertama.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Preview</th>
            <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Judul</th>
            <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Urutan</th>
            <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
            <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
              <td className="p-4">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  width={112}
                  height={64}
                  className="w-28 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </td>
              <td className="p-4">
                <div className="font-medium text-slate-900 dark:text-slate-100">{banner.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{banner.tag || "—"}</div>
              </td>
              <td className="p-4 text-slate-600 dark:text-slate-400">{banner.order}</td>
              <td className="p-4">
                <ToggleBannerButton id={banner.id} active={banner.active} />
              </td>
              <td className="p-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/banners/${banner.id}/edit`}
                    className="text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-200/20 px-3 py-1 rounded-md transition"
                  >
                    Edit
                  </Link>
                  <DeleteBannerButton id={banner.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}