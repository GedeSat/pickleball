import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import DeleteButton from "./DeleteButton";
const prisma = new PrismaClient();

export default async function PostsPage() {
  // Ambil semua post, urutkan dari yang terbaru
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true }, // Mengambil nama penulis dari tabel User
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Kelola Artikel / Post
        </h1>
        <Link
          href="/admin/posts/create"
          className="bg-primary hover:bg-primary-hover text-[#ffffff] px-4 py-2 rounded-lg font-medium transition"
        >
          + Tambah Post
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Belum ada artikel.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Judul</th>
                <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Penulis</th>
                <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                    {post.title}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">
                    {post.author?.name || "Admin"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Tombol Edit */}
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-200/20 px-3 py-1 rounded-md transition"
                      >
                        Edit
                      </Link>

                      {/* Form Hapus (Kode Lama) */}
                      <DeleteButton id={post.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
