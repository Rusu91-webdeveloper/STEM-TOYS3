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

# Load environment variables (only DATABASE_URL related variables to avoid SSL cert issues)
if [ -f .env.local ]; then
    echo -e "${GREEN}✓${NC} Loading environment variables from .env.local"
    # Only extract DATABASE_URL variables, avoiding multi-line SSL certificates
    # This safely handles .env files with certificates/keys by only loading what we need
    
    # Extract DATABASE_URL_PRODUCTION if it exists
    if grep -q "^DATABASE_URL_PRODUCTION=" .env.local 2>/dev/null; then
        DATABASE_URL_PRODUCTION=$(grep "^DATABASE_URL_PRODUCTION=" .env.local | head -1 | cut -d '=' -f2- | sed "s/^['\"]//;s/['\"]$//" | tr -d '\n')
        if [[ -n "$DATABASE_URL_PRODUCTION" ]] && [[ ! "$DATABASE_URL_PRODUCTION" =~ (-----|CERTIFICATE) ]]; then
            export DATABASE_URL_PRODUCTION="$DATABASE_URL_PRODUCTION"
        fi
    fi
    
    # Extract DATABASE_URL if it exists
    if grep -q "^DATABASE_URL=" .env.local 2>/dev/null; then
        DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | head -1 | cut -d '=' -f2- | sed "s/^['\"]//;s/['\"]$//" | tr -d '\n')
        if [[ -n "$DATABASE_URL" ]] && [[ ! "$DATABASE_URL" =~ (-----|CERTIFICATE) ]]; then
            export DATABASE_URL="$DATABASE_URL"
        fi
    fi
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

# Extract database connection details using a more robust method
# Try using pg_dump's built-in connection string parsing first
# If that fails, fall back to manual parsing

# Remove query parameters for parsing (but keep them for connection)
DB_URL_CLEAN="${DB_URL%%\?*}"

# Try to parse using multiple regex patterns
PARSED=false

# Pattern 1: postgresql://user:password@host:port/database
if [[ $DB_URL_CLEAN =~ ^postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)$ ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    PARSED=true
# Pattern 2: postgresql://user:password@host/database (no port)
elif [[ $DB_URL_CLEAN =~ ^postgresql://([^:]+):([^@]+)@([^/]+)/(.+)$ ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    # Check if host contains port
    HOST_PART="${BASH_REMATCH[3]}"
    if [[ $HOST_PART =~ ^(.+):([0-9]+)$ ]]; then
        DB_HOST="${BASH_REMATCH[1]}"
        DB_PORT="${BASH_REMATCH[2]}"
    else
        DB_HOST="$HOST_PART"
        DB_PORT="5432"
    fi
    DB_NAME="${BASH_REMATCH[4]}"
    PARSED=true
# Pattern 3: postgres:// (alternative protocol)
elif [[ $DB_URL_CLEAN =~ ^postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)$ ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    PARSED=true
elif [[ $DB_URL_CLEAN =~ ^postgres://([^:]+):([^@]+)@([^/]+)/(.+)$ ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    HOST_PART="${BASH_REMATCH[3]}"
    if [[ $HOST_PART =~ ^(.+):([0-9]+)$ ]]; then
        DB_HOST="${BASH_REMATCH[1]}"
        DB_PORT="${BASH_REMATCH[2]}"
    else
        DB_HOST="$HOST_PART"
        DB_PORT="5432"
    fi
    DB_NAME="${BASH_REMATCH[4]}"
    PARSED=true
fi

if [ "$PARSED" = false ]; then
    echo -e "${YELLOW}⚠️${NC} Could not parse DATABASE_URL using standard patterns"
    echo -e "${YELLOW}Attempting to use connection string directly...${NC}"
    echo ""
    
    # Try to extract database name for display (simple extraction)
    if [[ $DB_URL =~ /([^/\?]+) ]]; then
        DB_NAME="${BASH_REMATCH[1]}"
        echo -e "Database: ${GREEN}$DB_NAME${NC}"
    else
        echo -e "Database: ${YELLOW}(will be determined from connection string)${NC}"
    fi
    echo ""
    
    # Set flag to use connection string directly
    USE_CONNECTION_STRING=true
else
    USE_CONNECTION_STRING=false
fi

# If we couldn't parse, use connection string directly
if [ "$USE_CONNECTION_STRING" = true ]; then
    # Confirm backup
    read -p "$(echo -e ${YELLOW}Do you want to proceed with the backup? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗${NC} Backup cancelled"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}Creating backup using connection string...${NC}"
    
    # Use connection string directly (most robust method)
    pg_dump "$DB_URL" --no-owner --no-acl --clean --if-exists -f "$BACKUP_FILE"
else
    # URL-decode password if needed (handle % encoding)
    # Note: This is a simple implementation - for complex cases, consider using a proper URL decoder
    DB_PASSWORD=$(printf '%b' "${DB_PASSWORD//%/\\x}")
    
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
    
    # Try using pg_dump with connection string first (most robust)
    # If that fails, fall back to individual parameters
    if pg_dump "$DB_URL" --no-owner --no-acl --clean --if-exists -f "$BACKUP_FILE" 2>/dev/null; then
        # Success using connection string
        echo -e "${GREEN}✓${NC} Backup created using connection string"
    else
        # Fall back to individual parameters
        echo -e "${YELLOW}Trying with individual parameters...${NC}"
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
    fi
fi

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

