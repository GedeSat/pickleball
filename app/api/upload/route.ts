import { writeFile, mkdir } from "fs/promises"; // 🔥 Tambahkan mkdir di sini
import path from "path";
import { successResponse, errorResponse } from "@/lib/apiResponse";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return errorResponse("Tidak ada file yang diunggah ⚠️", 400, "BAD_REQUEST");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Hanya file gambar JPG/PNG/WebP yang diizinkan", 400, "BAD_REQUEST");
    }

    if (file.size > MAX_SIZE) {
      return errorResponse("Ukuran file maksimal 5MB", 400, "BAD_REQUEST");
    }

    // 1. Ubah file menjadi format Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Buat nama file unik
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "")}`;

    // 3. Tentukan lokasi penyimpanan
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    // 🔥 4. BARIS BARU: Cek & buat folder otomatis jika belum ada!
    await mkdir(uploadDir, { recursive: true });

    // 5. Simpan file fisik ke dalam folder
    await writeFile(filepath, buffer);

    // 6. Kembalikan URL gambar aslinya
    const imageUrl = `/uploads/${filename}`;

    return successResponse("Gambar berhasil diunggah 🖼️", { url: imageUrl });

  } catch (error) {
    console.error("Gagal mengunggah gambar:", error);
    return errorResponse("Gagal memproses gambar di server ❌", 500, "INTERNAL_SERVER_ERROR");
  }
}