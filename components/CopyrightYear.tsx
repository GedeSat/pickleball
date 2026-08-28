import { cacheLife } from "next/cache";

// Tahun berjalan di footer. Di-cache (Cache Component) agar tidak memicu
// error prerender 'new Date() in Server/Client Component' saat build.
async function getCurrentYear() {
  "use cache";
  cacheLife("reference");
  return new Date().getFullYear();
}

export default async function CopyrightYear() {
  const year = await getCurrentYear();
  return <>{year}</>;
}