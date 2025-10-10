#!/bin/bash

# =============================================================================
# DATABASE BACKUP SCRIPT
# =============================================================================
# This script creates a timestamped backup of your PostgreSQL database
# Usage: ./scripts/backup-database.sh [production|local]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment (production or local)
ENVIRONMENT="${1:-production}"

# Create backups directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${ENVIRONMENT}_${TIMESTAMP}.sql"

echo -e "${YELLOW}==============================================================================${NC}"
echo -e "${YELLOW}DATABASE BACKUP SCRIPT${NC}"
echo -e "${YELLOW}==============================================================================${NC}"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    echo -e "${GREEN}✓${NC} Loading environment variables from .env.local"
    export $(grep -v '^#' .env.local | xargs)
fi

# Determine which database URL to use
if [ "$ENVIRONMENT" == "production" ]; then
    DB_URL="${DATABASE_URL_PRODUCTION:-$DATABASE_URL}"
    echo -e "${YELLOW}⚠️  BACKING UP PRODUCTION DATABASE${NC}"
elif [ "$ENVIRONMENT" == "local" ]; then
    DB_URL="${DATABASE_URL_LOCAL:-$DATABASE_URL}"
    echo -e "${GREEN}Backing up local database${NC}"
else
    echo -e "${RED}✗${NC} Invalid environment. Use 'production' or 'local'"
    exit 1
fi

if [ -z "$DB_URL" ]; then
    echo -e "${RED}✗${NC} DATABASE_URL not found in environment variables"
    exit 1
fi

# Extract database connection details
# Format: postgresql://user:password@host:port/database
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
echo -e "Database: ${GREEN}$DB_NAME${NC}"
echo -e "Host: ${GREEN}$DB_HOST${NC}"
echo -e "Port: ${GREEN}$DB_PORT${NC}"
echo ""

# Confirm backup
read -p "$(echo -e ${YELLOW}Do you want to proceed with the backup? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}✗${NC} Backup cancelled"
    exit 1
fi

echo ""
echo -e "${YELLOW}Creating backup...${NC}"

# Create backup using pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "$BACKUP_FILE"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    
    echo ""
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "${GREEN}✓ BACKUP SUCCESSFUL${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    echo ""
    echo -e "File: ${GREEN}$COMPRESSED_FILE${NC}"
    echo -e "Size: ${GREEN}$FILE_SIZE${NC}"
    echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
    echo ""
    
    # Keep only last 10 backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_${ENVIRONMENT}_*.sql.gz 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt 10 ]; then
        echo -e "${YELLOW}Cleaning up old backups (keeping last 10)...${NC}"
        ls -1t "$BACKUP_DIR"/backup_${ENVIRONMENT}_*.sql.gz | tail -n +11 | xargs rm -f
        echo -e "${GREEN}✓${NC} Old backups cleaned"
    fi
    
    echo ""
    echo -e "${YELLOW}To restore this backup, run:${NC}"
    echo -e "  ./scripts/restore-database.sh $COMPRESSED_FILE"
    echo ""
else
    echo -e "${RED}✗${NC} Backup failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

