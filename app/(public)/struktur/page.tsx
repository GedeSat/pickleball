import { prisma } from "@/lib/prisma";
import { buildTree, OrgNode } from "@/lib/buildTree";

type OrgTreeCustomNode = OrgNode & {
  photoUrl: string | null;
};

export default async function PublicStrukturPage() {
  const items = await prisma.orgStructure.findMany({
    orderBy: { order: "asc" },
  });

  const tree = buildTree(items) as OrgTreeCustomNode[];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Halaman */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
            Struktur Organisasi
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Susunan Kepengurusan IPF (Indonesia Pickleball Federation) Kota Denpasar Periode Aktif.
          </p>
          <div className="w-24 h-1 bg-primary-hover mx-auto mt-4 rounded-full" />
        </div>

        {/* Tree Render */}
        {tree.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-lg mx-auto">
            <span className="text-5xl mb-4 block">👥</span>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Belum Ada Struktur</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Bagan kepengurusan organisasi saat ini masih belum dirilis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-3xl p-8 md:p-12">
            <div className="flex justify-center min-w-max">
              <PublicOrgTree nodes={tree} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function PublicOrgTree({ nodes }: { nodes: OrgTreeCustomNode[] }) {
  return (
    <div className="flex gap-12">
      {nodes.map((node) => (
        <div key={node.id} className="flex flex-col items-center">
          {/* Card Pengurus */}
          <div className="bg-white dark:bg-slate-800 border-2 border-amber-500 rounded-3xl px-6 py-5 shadow-sm min-w-[200px] text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            {/* Foto Profil */}
            {node.photoUrl ? (
              <img
                src={node.photoUrl}
                alt={node.name}
                className="w-20 h-20 rounded-full mx-auto object-cover mb-3 border-2 border-amber-400 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-600 shadow-sm">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}

            <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug text-base">{node.name}</h3>
            <p className="text-xs text-primary-700 dark:text-primary-300 font-bold uppercase tracking-wider mt-1">{node.position}</p>
          </div>

          {/* Child Node render */}
          {node.children.length > 0 && (
            <>
              <div className="w-px h-8 bg-slate-300 dark:bg-slate-600" />
              <div className="relative">
                {/* Horizontal Connector Line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-slate-300 dark:bg-slate-600" />
                <div className="flex gap-12 pt-8">
                  <PublicOrgTree nodes={node.children as OrgTreeCustomNode[]} />
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
