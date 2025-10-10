#!/bin/bash

# =============================================================================
# QUICK BACKUP - Run this NOW to protect your data!
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                 EMERGENCY DATABASE BACKUP                        ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}This will create a backup of your current database.${NC}"
echo -e "${GREEN}It's quick, safe, and could save your project!${NC}"
echo ""

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}✗ pg_dump not found!${NC}"
    echo ""
    echo "Install PostgreSQL tools:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

# Run the backup
./scripts/backup-database.sh production

echo ""
echo -e "${GREEN}✓ Backup complete! Your data is safe.${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Read DATABASE_SAFETY_GUIDE.md"
echo "2. Set up separate local database"
echo "3. Update your .env.local file"
echo ""

