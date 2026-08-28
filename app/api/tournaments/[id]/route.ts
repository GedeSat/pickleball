// /api/tournaments/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Sesuaikan tipe params
) {
  // 2. Await params sebelum digunakan
  const resolvedParams = await params; 

  try {
    const data = await prisma.tournament.findUnique({
      where: { id: Number(resolvedParams.id) },
    });

    if (!data) {
      return errorResponse("Turnamen tidak ditemukan 🔍", 404, "NOT_FOUND");
    }

    return successResponse("Data turnamen berhasil diambil ✨", data);
  } catch {
    return errorResponse("Gagal mengambil data turnamen ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// ----------------------------------------------------------------
// DELETE: Arsipkan turnamen (soft delete) — hanya untuk COMPLETED / CANCELED
// Data pertandingan tetap tersimpan sebagai history.
// DELETE ?permanent=true — hapus permanen, hanya untuk arsip CANCELED.
// ----------------------------------------------------------------
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournamentId = Number(id);
  const url = new URL(req.url);
  const permanent = url.searchParams.get("permanent") === "true";

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return errorResponse("Turnamen tidak ditemukan 🔍", 404, "NOT_FOUND");
    }

    if (permanent) {
      return handlePermanentDelete(tournament);
    }

    if (tournament.deletedAt) {
      return errorResponse("Turnamen sudah diarsipkan", 400, "BAD_REQUEST");
    }

    if (tournament.status !== "COMPLETED" && tournament.status !== "CANCELED") {
      return errorResponse(
        "Turnamen hanya bisa diarsipkan jika statusnya COMPLETED atau CANCELED ⚠️",
        400,
        "BAD_REQUEST"
      );
    }

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { deletedAt: new Date() },
    });

    return successResponse(`Turnamen "${tournament.name}" berhasil diarsipkan 🗃️`, {
      id: tournament.id,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mengarsipkan turnamen ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}

// ----------------------------------------------------------------
// Hapus permanen: hanya untuk turnamen yang SUDAH diarsipkan &
// berstatus CANCELED — history COMPLETED tidak pernah dihapus.
// Menghapus semua data terkait (player, team, pool, grup, knockout)
// beserta file gambar poster.
// ----------------------------------------------------------------
async function handlePermanentDelete(tournament: {
  id: number;
  name: string;
  status: string;
  deletedAt: Date | null;
  image: string | null;
}) {
  if (!tournament.deletedAt) {
    return errorResponse(
      "Pertama arsipkan turnamen (status harus CANCELED) sebelum hapus permanen ⚠️",
      400,
      "BAD_REQUEST"
    );
  }

  if (tournament.status !== "CANCELED") {
    return errorResponse(
      "Hapus permanen hanya diizinkan untuk turnamen CANCELED untuk menjaga history pertandingan 🗄️",
      400,
      "BAD_REQUEST"
    );
  }

  const tournamentId = tournament.id;

  // Urutan penting karena FK Restrict:
  // PoolMatch → PoolMember → Player/Team → Tournament (sisanya cascade)
  await prisma.$transaction(async (tx) => {
    await tx.poolMatch.deleteMany({
      where: { pool: { tournamentId } },
    });
    await tx.poolMember.deleteMany({
      where: { pool: { tournamentId } },
    });
    await tx.player.deleteMany({
      where: { tournamentId },
    });
    await tx.team.deleteMany({
      where: { tournamentId },
    });
    await tx.tournament.delete({
      where: { id: tournamentId },
    });
  });

  // Hapus file gambar poster jika memakai upload lokal
  if (tournament.image && tournament.image.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", tournament.image);
    try {
      await unlink(filePath);
    } catch {
      // File sudah tidak ada — abaikan
    }
  }

  return successResponse(
    `Turnamen "${tournament.name}" dihapus permanen beserta semua datanya 🗑️`,
    { id: tournamentId }
  );
}

// ----------------------------------------------------------------
// PATCH: Pulihkan turnamen yang diarsipkan
// ----------------------------------------------------------------
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournamentId = Number(id);

  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return errorResponse("Turnamen tidak ditemukan 🔍", 404, "NOT_FOUND");
    }

    if (!tournament.deletedAt) {
      return errorResponse("Turnamen ini tidak sedang diarsipkan", 400, "BAD_REQUEST");
    }

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { deletedAt: null },
    });

    return successResponse(`Turnamen "${tournament.name}" berhasil dipulihkan ♻️`, {
      id: tournament.id,
      deletedAt: null,
    });
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal memulihkan turnamen ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}