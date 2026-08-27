# Panduan Deploy ke VPS (mis. Biznet Gio)

Prasyarat server: Ubuntu/Debian, Node.js 20+, MariaDB 11+, Nginx, PM2, Git.

## 1. Siapkan database

```bash
sudo mysql -e "CREATE DATABASE pickleball CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'pickleball'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_KUAT';"
sudo mysql -e "GRANT ALL PRIVILEGES ON pickleball.* TO 'pickleball'@'localhost';"
```

## 2. Clone & install

```bash
git clone <REPO_URL> /var/www/pickleball
cd /var/www/pickleball
cp .env.example .env   # lalu isi DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_*
npm install            # menjalankan postinstall: prisma generate
npx prisma migrate deploy
node scripts/create-admin.js   # buat akun admin (sekali saja)
npm run build
```

## 3. Jalankan dengan PM2

```bash
npm install -g pm2
pm2 start deploy/ecosystem.config.js
pm2 save && pm2 startup
```

## 4. Nginx + HTTPS

Salin `deploy/nginx.conf.example` ke `/etc/nginx/sites-available/pickleball`,
ganti `DOMAIN_ANDA`, aktifkan, lalu:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d DOMAIN_ANDA
```

## 5. Backup otomatis

```bash
chmod +x deploy/backup.sh
crontab -e   # tambah: 0 3 * * * /var/www/pickleball/deploy/backup.sh
```

## 6. Health check

```bash
curl https://DOMAIN_ANDA/api/health   # → {"status":"ok"}
```

## Catatan operasional

- `public/uploads/` tidak di-commit ke git — file upload hidup di disk server,
  otomatis di-backup oleh `deploy/backup.sh`.
- Ubah `NEXTAUTH_SECRET` dengan nilai acak (lihat `.env.example`).
- Saat ada perubahan kode: `git pull && npm install && npm run build && pm2 restart pickleball`.
- Saat ada migrasi baru: jalankan `npx prisma migrate deploy` sebelum restart.