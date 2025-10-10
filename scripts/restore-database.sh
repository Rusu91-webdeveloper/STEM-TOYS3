#!/bin/bash

# =============================================================================
# DATABASE RESTORE SCRIPT
# =============================================================================
# This script restores a database from a backup file
# Usage: ./scripts/restore-database.sh <backup_file.sql.gz> [target_environment]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKUP_FILE="$1"
TARGET_ENV="${2:-local}"

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}✗${NC} Please provide a backup file"
    echo "Usage: ./scripts/restore-database.sh <backup_file.sql.gz> [local|production]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗${NC} Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo -e "${RED}==============================================================================${NC}"
echo -e "${RED}⚠️  DATABASE RESTORE SCRIPT - DANGER ZONE ⚠️${NC}"
echo -e "${RED}==============================================================================${NC}"
echo ""
echo -e "${YELLOW}This will REPLACE ALL DATA in the target database!${NC}"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Determine which database URL to use
if [ "$TARGET_ENV" == "production" ]; then
    DB_URL="${DATABASE_URL_PRODUCTION:-$DATABASE_URL}"
    echo -e "${RED}⚠️  TARGET: PRODUCTION DATABASE${NC}"
elif [ "$TARGET_ENV" == "local" ]; then
    DB_URL="${DATABASE_URL_LOCAL:-$DATABASE_URL}"
    echo -e "${YELLOW}Target: Local database${NC}"
else
    echo -e "${RED}✗${NC} Invalid environment. Use 'production' or 'local'"
    exit 1
fi

if [ -z "$DB_URL" ]; then
    echo -e "${RED}✗${NC} DATABASE_URL not found in environment variables"
    exit 1
fi

# Extract database connection details
if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^\?]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo -e "${RED}✗${NC} Could not parse DATABASE_URL"
    exit 1
fi

echo ""
echo -e "Backup file: ${GREEN}$BACKUP_FILE${NC}"
echo -e "Target database: ${YELLOW}$DB_NAME${NC}"
echo -e "Target host: ${YELLOW}$DB_HOST${NC}"
echo ""

# Triple confirmation for production
if [ "$TARGET_ENV" == "production" ]; then
    echo -e "${RED}WARNING: You are about to restore to PRODUCTION!${NC}"
    echo ""
    read -p "$(echo -e ${RED}Type 'RESTORE PRODUCTION' to continue:${NC} )" CONFIRM
    if [ "$CONFIRM" != "RESTORE PRODUCTION" ]; then
        echo -e "${RED}✗${NC} Restore cancelled"
        exit 1
    fi
fi

# Final confirmation
read -p "$(echo -e ${YELLOW}Are you absolutely sure? This cannot be undone! [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}✗${NC} Restore cancelled"
    exit 1
fi

echo ""
echo -e "${YELLOW}Decompressing backup...${NC}"

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

echo -e "${YELLOW}Restoring database...${NC}"

# Restore database using psql
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$RESTORE_FILE"

RESTORE_STATUS=$?

# Clean up temp file if we created one
if [[ $BACKUP_FILE == *.gz ]]; then
    rm -f "$TEMP_FILE"
fi

if [ $RESTORE_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "${GREEN}✓ RESTORE SUCCESSFUL${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    echo ""
    echo -e "${GREEN}✓${NC} Database restored from: $BACKUP_FILE"
    echo -e "${GREEN}✓${NC} Target environment: $TARGET_ENV"
    echo ""
else
    echo ""
    echo -e "${RED}==============================================================================${NC}"
    echo -e "${RED}✗ RESTORE FAILED${NC}"
    echo -e "${RED}==============================================================================${NC}"
    exit 1
fi

