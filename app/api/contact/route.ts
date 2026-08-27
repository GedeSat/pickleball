import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const nama = typeof body?.nama === "string" ? body.nama.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const pesan = typeof body?.pesan === "string" ? body.pesan.trim() : "";

    if (!nama || !email || !pesan) {
      return errorResponse("Nama, email, dan pesan wajib diisi ⚠️", 400, "BAD_REQUEST");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse("Format email tidak valid ⚠️", 400, "BAD_REQUEST");
    }
    if (pesan.length < 10) {
      return errorResponse("Pesan terlalu pendek (minimal 10 karakter) ⚠️", 400, "BAD_REQUEST");
    }

    const contact = await prisma.contact.create({
      data: { nama, email, pesan },
    });

    return successResponse("Pesan berhasil terkirim ✅", { id: contact.id }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Gagal mengirim pesan ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}