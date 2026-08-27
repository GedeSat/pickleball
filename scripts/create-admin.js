// scripts/create-admin.js
// Membuat akun admin dari environment variables (pengganti /api/setup).
// Dijalankan manual sekali setelah migrate:
//   node scripts/create-admin.js
//
// Butuh env: ADMIN_EMAIL, ADMIN_PASSWORD (dan opsional ADMIN_NAME).
// Aman dijalankan ulang: jika email sudah ada, tidak melakukan apa-apa.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Administrator";

  if (!email || !password) {
    console.error("ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi di environment.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD minimal 8 karakter.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} sudah ada — tidak ada perubahan.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, password: hashedPassword, role: "ADMIN" },
  });
  console.log(`Akun admin ${email} berhasil dibuat.`);
}

main()
  .catch((err) => {
    console.error("Gagal membuat admin:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());