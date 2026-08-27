# Pickleball Platform

Platform manajemen turnamen Pickleball berbasis web — mulai dari registrasi pemain, pembagian pool, bracket knockout, hingga fitur wasit (referee).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, styled-components
- **Database:** MariaDB / MySQL + Prisma ORM 5
- **Auth:** NextAuth 4
- **Libraries:** SweetAlert2, jspdf, react-svg-pan-zoom, xlsx-js-style

## Fitur Utama

- Manajemen turnamen (DRAFT → UPCOMING → ONGOING → COMPLETED)
- Kategori & grade turnamen (SD, SMP, SMA, Open, U11–U21)
- Pool stage & bracket knockout
- Registrasi pemain & tim (single, double, mixed)
- Upload bukti pembayaran
- Interface wasit (referee) — tanpa login, link langsung dibagikan
- Dashboard admin
- Artikel, kategori, & komentar
- Upload file/gambar

## Struktur Folder

```
app/
  ├─ admin/          # Dashboard admin
  ├─ api/            # API route handlers
  ├─ wasit/          # Interface wasit
  ├─ layout.tsx
  └─ globals.css
components/           # Reusable UI components
lib/                  # Shared utilities & business logic
prisma/               # Schema, migrations, generated client
public/               # Static assets
```

## Instalasi & Setup

### Prasyarat

- Node.js >= 18
- MariaDB / MySQL
- npm

### Langkah

```bash
# clone repo
git clone https://github.com/Gede-Satya/pickleball.git
cd pickleball

# install dependency
npm install

# copy env & konfigurasi
cp .env.example .env
# isi DATABASE_URL, NEXTAUTH_SECRET, dll di .env

# generate Prisma client
npx prisma generate

# jalankan migration (jika perlu)
npx prisma migrate dev

# jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Key | Deskripsi |
|-----|-----------|
| `DATABASE_URL` | Connection string database MariaDB/MySQL |
| `NEXTAUTH_SECRET` | Secret untuk enkripsi session NextAuth |

## Development Commands

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Jalankan dev server (next dev --webpack) |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint |

## Kontribusi

1. Fork repo
2. Buat branch baru: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi singkat"`
4. Push dan buat Pull Request

## Lisensi

Proprietary
