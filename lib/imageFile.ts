// lib/imageFile.ts
// Validasi file gambar berdasarkan isi (magic bytes), bukan hanya MIME type.
// Dipakai oleh API /api/upload dan helper bukti pembayaran.

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
// PNG header: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_RIFF = "RIFF";
const WEBP_FILE_KEY = "WEBP";

export type ImageFileType = "jpeg" | "png" | "webp";

/**
 * Deteksi tipe gambar dari magic bytes file.
 * Mengembalikan null jika file bukan gambar JPG/PNG/WebP yang valid.
 */
export function detectImageFileType(
  buffer: Buffer | ArrayBuffer
): ImageFileType | null {
  const bytes = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(new Uint8Array(buffer));
  if (bytes.length < 12) return null;

  if (
    bytes[0] === JPEG_MAGIC[0] &&
    bytes[1] === JPEG_MAGIC[1] &&
    bytes[2] === JPEG_MAGIC[2]
  ) {
    return "jpeg";
  }

  const header = bytes.subarray(0, 8);
  if (header.equals(Buffer.from(PNG_MAGIC))) return "png";

  // WebP: "RIFF" + ukuran(4 byte) + "WEBP"
  const riff = bytes.toString("latin1", 0, 4);
  const webp = bytes.toString("latin1", 8, 12);
  if (riff === WEBP_RIFF && webp === WEBP_FILE_KEY) return "webp";

  return null;
}

const EXTENSION_BY_TYPE: Record<ImageFileType, string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
};

export function imageFileExtension(type: ImageFileType): string {
  return EXTENSION_BY_TYPE[type];
}