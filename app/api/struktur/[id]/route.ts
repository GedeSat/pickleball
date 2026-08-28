import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json();

  if (body.parentId === id) {
    return NextResponse.json(
      { error: "Tidak bisa menjadikan diri sendiri sebagai atasan" },
      { status: 400 }
    );
  }

  const updated = await prisma.orgStructure.update({
    where: { id },
    data: {
      name: body.name,
      position: body.position,
      order: body.order ?? 0,
      parentId: body.parentId || null,
      photoUrl: body.photoUrl || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const { id } = await params;

  try {
    const currentItem = await prisma.orgStructure.findUnique({
      where: { id },
      select: { parentId: true },
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.orgStructure.updateMany({
      where: { parentId: id },
      data: {
        parentId: currentItem.parentId,
      },
    });

    await prisma.orgStructure.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gagal menghapus struktur:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data struktur" },
      { status: 500 }
    );
  }
}