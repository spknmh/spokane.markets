#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/app/uploads/backups"
BACKUP_FILE="${BACKUP_DIR}/spokane_market_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting database backup at $(date)"

pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

echo "[backup] Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retain only last 7 daily backups
ls -t "$BACKUP_DIR"/spokane_market_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f

echo "[backup] Cleanup complete. Remaining backups:"
ls -lh "$BACKUP_DIR"/spokane_market_*.sql.gz 2>/dev/null || echo "  (none)"

# Optional: upload to S3 if configured
if [ -n "$S3_BACKUP_BUCKET" ]; then
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BACKUP_BUCKET/backups/$(basename "$BACKUP_FILE")"
    echo "[backup] Uploaded to S3: s3://$S3_BACKUP_BUCKET/backups/$(basename "$BACKUP_FILE")"
  else
    echo "[backup] WARNING: aws CLI not available, skipping S3 upload"
  fi
fi

echo "[backup] Done at $(date)"
