#!/usr/bin/env bash
# deploy/backup.sh — backup database + file upload
# Jadwalkan via cron, contoh setiap hari 03.00:
#   0 3 * * * /path/ke/deploy/backup.sh >> /var/log/pickleball-backup.log 2>&1
set -euo pipefail

APP_DIR="/var/www/pickleball"
BACKUP_DIR="/var/backups/pickleball"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

# 1. Dump database (baca kredensial dari .env di app)
set -a
source "$APP_DIR/.env"
set +a

DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]*@([^:/]+).*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+)\?.*|\1|')
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')

mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  > "$BACKUP_DIR/db-$DATE.sql"
gzip "$BACKUP_DIR/db-$DATE.sql"

# 2. Backup folder upload
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C "$APP_DIR/public" uploads

# 3. Hapus backup lebih dari 14 hari
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +14 -delete
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime +14 -delete

echo "Backup selesai: $DATE"