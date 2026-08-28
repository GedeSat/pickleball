// /api/tournaments/[id]/brackets/members/route.ts
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";

const prisma = new PrismaClient();

// POST: Tambah member ke grup
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // consume params

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { groupId, playerName, seedOrder } = body;

    if (!groupId || !playerName) {
      return errorResponse("groupId dan playerName wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    // Cek apakah pemain sudah ada di grup ini
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: Number(groupId),
        playerName: playerName
      }
    });

    if (existingMember) {
      return errorResponse("Pemain ini sudah ditambahkan ke dalam grup ⚠️", 400, "BAD_REQUEST");
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: Number(groupId),
        playerName,
        seedOrder: seedOrder || 0,
      },
    });

    return successResponse("Member berhasil ditambahkan 👤", member, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menambah member ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// DELETE: Hapus member dari grup
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return errorResponse("memberId wajib diisi ⚠️", 400, "BAD_REQUEST");
    }

    await prisma.groupMember.delete({
      where: { id: Number(memberId) },
    });

    return successResponse("Member berhasil dihapus 🗑️");
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal menghapus member ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// PUT: Update seed order member (untuk seeding manual)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { members } = body; // [ { id: 1, seedOrder: 1 }, { id: 2, seedOrder: 2 } ]

    if (!members || !Array.isArray(members)) {
      return errorResponse("Format data members tidak valid ⚠️", 400, "BAD_REQUEST");
    }

    // Update seed order untuk semua member sekaligus
    await Promise.all(
      members.map((m: { id: number; seedOrder: number }) =>
        prisma.groupMember.update({
          where: { id: m.id },
          data: { seedOrder: m.seedOrder },
        })
      )
    );

    return successResponse("Seed order berhasil diperbarui 🔢");
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal update seed order ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}
