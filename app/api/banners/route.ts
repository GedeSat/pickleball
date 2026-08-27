import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "@/lib/apiResponse";

const prisma = new PrismaClient();


export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    return successResponse("OK", { banners });
  } catch (error) {
    console.error("Gagal mengambil banner:", error);
    return errorResponse("Gagal mengambil banner", 500, "INTERNAL_SERVER_ERROR");
  }
}
