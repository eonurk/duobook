#!/bin/bash

# Path to your .env file
ENV_FILE="$HOME/duobook/.env"

# Source the .env file directly
source "$ENV_FILE"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

# Define backup directory
BACKUP_DIR="$HOME/db_backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Dump the database
echo "Dumping database..."
pg_dump "$DATABASE_URL" -F p -f "$BACKUP_FILE"

# Compress the dump
echo "Compressing backup..."
gzip -9 "$BACKUP_FILE"

echo "Backup completed: ${BACKUP_FILE}.gz"
