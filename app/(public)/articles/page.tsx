// app/(public)/articles/page.tsx
import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function PublicArticlesPage() {
  // 1. Ambil semua artikel yang sudah dipublish dari database
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" }, // Urutkan dari yang terbaru
    include: { author: true }, // Ambil data penulis sekalian
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Berita & Artikel</h1>
        <p className="text-slate-600 dark:text-slate-300">Info terbaru seputar Pickleball dan turnamen.</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          Belum ada artikel yang diterbitkan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/articles/${post.id}`} className="group block h-full">
              <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col h-full">
                
                {/* Gambar Artikel */}
                <div className="h-48 bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                  {post.image ? (
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      Tidak ada gambar
                    </div>
                  )}
                </div>

                {/* Info Artikel */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span>{new Date(post.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>Oleh {post.author?.name || "Admin"}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition">
                    {post.title}
                  </h2>
                  
                  {/* Potong isi konten agar tidak terlalu panjang di preview */}
                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4 flex-1">
                    {post.content}
                  </p>
                  
                  <span className="text-primary-700 dark:text-primary-300 text-sm font-semibold mt-auto">Baca selengkapnya →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}