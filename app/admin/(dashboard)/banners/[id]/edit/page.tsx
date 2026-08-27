import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import BannerForm from "../../BannerForm";
import { updateBanner } from "../../actions";

const prisma = new PrismaClient();

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return notFound();

  const updateBannerWithId = updateBanner.bind(null, id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/banners" className="text-slate-500 hover:text-slate-900">← Kembali</Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Banner</h1>
      </div>
      <BannerForm action={updateBannerWithId} banner={banner} />
    </div>
  );
}