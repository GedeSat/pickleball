import { PrismaClient } from '@prisma/client';
import TournamentClient from './TournamentClient'; // Import komponen yang baru kita buat


const prisma = new PrismaClient();


export default async function TournamentPage() {
  // 1. Ambil data turnamen dari MySQL (Urutkan dari yang terbaru)
  // Kita sembunyikan yang berstatus DRAFT agar tidak dilihat publik
  const rawTournaments = await prisma.tournament.findMany({
    where: {
      status: {
        not: 'DRAFT'
      },
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 2. Format data dari database agar sesuai dengan kebutuhan UI
  const formatTournament = (t: { id: number; name: string; category: string | null; startDate: Date; endDate: Date; location: string; status: string; image: string | null }) => {
    // Format tanggal: "12 - 15 Agustus 2026"
    const startDate = t.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const endDate = t.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateString = startDate === endDate ? startDate : `${startDate} - ${endDate}`;

    return {
      id: t.id.toString(),
      title: t.name,
      // Karena belum ada field kategori di database, pakai default dulu
      category: t.category || "Umum / All Age",
      date: dateString,
      location: t.location,
      status: t.status,
      // Karena belum ada field gambar di database, pakai gambar default
      image: t.image,
    };
  };

  const formattedTournaments = rawTournaments.map(formatTournament);

  // 3. Riwayat: turnamen yang sudah diarsipkan DAN berstatus COMPLETED
  //    (CANCELED tidak ditampilkan karena bukan history pertandingan)
  const archivedTournaments = await prisma.tournament.findMany({
    where: {
      status: "COMPLETED",
      NOT: { deletedAt: null },
    },
    orderBy: { deletedAt: "desc" },
  });
  const formattedArchived = archivedTournaments.map(formatTournament);

  // 4. Render komponen Client dan berikan data yang sudah diformat
  return <TournamentClient tournaments={formattedTournaments} archivedTournaments={formattedArchived} />;
}
