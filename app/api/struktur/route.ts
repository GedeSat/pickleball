import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";

export async function GET() {
  const data = await prisma.orgStructure.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const body = await req.json();

  if (!body.name || !body.position) {
    return NextResponse.json(
      { error: "Nama dan jabatan wajib diisi" },
      { status: 400 }
    );
  }

  const created = await prisma.orgStructure.create({
    data: {
      name: body.name,
      position: body.position,
      order: body.order ?? 0,
      parentId: body.parentId || null,
      photoUrl: body.photoUrl || null,
    },
  });

  return NextResponse.json(created);
}