// /api/tournaments/[id]/brackets/route.ts
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";

const prisma = new PrismaClient();

// GET: Ambil semua grup + member + match untuk turnamen tertentu
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournamentId = Number(id);

  try {
    const groups = await prisma.tournamentGroup.findMany({
      where: { tournamentId },
      include: {
        members: { orderBy: { seedOrder: "asc" } },
        matches: { orderBy: { id: "asc" } },
      },
      orderBy: { id: "asc" },
    });

    // Ambil juga daftar pemain turnamen (untuk assign ke grup)
    const players = await prisma.player.findMany({
      where: { tournamentId },
      orderBy: { seedOrder: "asc" },
    });

    // Ambil kategori unik dari pemain (berdasarkan kombinasi grade+gender+matchType)
    const categories = [...new Set(players.map((p) => {
      if (p.matchType === 'MIXED') return `${p.grade}_MIXED`;
      return `${p.grade}_${p.gender}_${p.matchType}`;
    }))];

    return successResponse("Data bracket berhasil diambil 📊", { groups, players, categories });
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mengambil data bracket ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// POST: Buat grup baru
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournamentId = Number(id);

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { name, category } = body;

    if (!name || !category) {
      return errorResponse("Nama grup dan kategori wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    const group = await prisma.tournamentGroup.create({
      data: {
        name,
        category,
        tournamentId,
      },
      include: {
        members: true,
        matches: true,
      },
    });

    return successResponse("Grup berhasil dibuat ✅", group, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal membuat grup ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// DELETE: Hapus grup beserta member dan match-nya
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { groupId } = body;

    if (!groupId) {
      return errorResponse("groupId wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    await prisma.tournamentGroup.delete({
      where: { id: Number(groupId) },
    });

    return successResponse("Grup berhasil dihapus 🗑️");
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menghapus grup ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}
