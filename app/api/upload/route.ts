import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { requireAdminSession, unauthorizedResponse } from "@/lib/requireAdmin";
import { detectImageFileType, imageFileExtension } from "@/lib/imageFile";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return errorResponse("Tidak ada file yang diunggah ⚠️", 400, "BAD_REQUEST");
    }

    if (file.size > MAX_SIZE) {
      return errorResponse("Ukuran file maksimal 5MB", 400, "BAD_REQUEST");
    }

    // Validasi isi file (magic bytes), bukan hanya MIME type dari klien
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageType = detectImageFileType(buffer);
    if (!imageType) {
      return errorResponse(
        "File harus berupa gambar JPG/PNG/WebP yang valid",
        400,
        "BAD_REQUEST"
      );
    }

    // Nama file acak; ekstensi ditentukan dari isi file, bukan nama asli klien
    const filename = `${crypto.randomUUID()}${imageFileExtension(imageType)}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;

    return successResponse("Gambar berhasil diunggah 🖼️", { url: imageUrl });

  } catch (error) {
    console.error("Gagal mengunggah gambar:", error);
    return errorResponse("Gagal memproses gambar di server ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}