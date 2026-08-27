import Link from "next/link";
import BannerForm from "../BannerForm";
import { createBanner } from "../actions";

export default function CreateBannerPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/banners" className="text-slate-500 hover:text-slate-900">← Kembali</Link>
        <h1 className="text-2xl font-bold text-slate-900">Tambah Banner Baru</h1>
      </div>
      <BannerForm action={createBanner} />
    </div>
  );
}