#!/bin/bash

# =============================================================================
# SAFE SYNC TO PRODUCTION (NON-DESTRUCTIVE)
# =============================================================================
# Purpose:
#  - Diff local Prisma schema against production database
#  - Abort on destructive operations (DROP/TRUNCATE/DELETE/ALTER DROP)
#  - Perform PEM-safe production backup using a temporary .env.local
#  - Apply pending migrations to production using Prisma migrate deploy
#
# Usage:
#  PROD_URL='postgres://...neon.tech/neondb?sslmode=require' ./scripts/safe-sync-production.sh
#  or set DATABASE_URL_PRODUCTION in .env.local (single-line) and run without env var
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}==============================================================================${NC}"
echo -e "${YELLOW}SAFE SYNC TO PRODUCTION (NON-DESTRUCTIVE)${NC}"
echo -e "${YELLOW}==============================================================================${NC}"

# Resolve production URL
PROD_URL_ENV=${PROD_URL:-}

# Read from .env.local only if not provided via PROD_URL
if [ -z "$PROD_URL_ENV" ] && [ -f .env.local ]; then
  # Avoid exporting multi-line keys; just grep the one we need
  PROD_URL_ENV=$(grep -m1 '^DATABASE_URL_PRODUCTION=' .env.local | cut -d '=' -f2- || true)
fi

if [ -z "$PROD_URL_ENV" ]; then
  echo -e "${RED}✗${NC} Missing production URL. Set PROD_URL env or DATABASE_URL_PRODUCTION in .env.local"
  exit 1
fi

echo -e "Using production database: ${YELLOW}${PROD_URL_ENV}${NC}"

# 1) Diff production vs current schema
echo -e "\n${YELLOW}→ Computing diff (production vs prisma/schema.prisma)...${NC}"
DIFF_OUTPUT=$(DATABASE_URL="$PROD_URL_ENV" npx prisma migrate diff --from-url "$PROD_URL_ENV" --to-schema-datamodel prisma/schema.prisma 2>&1 || true)
echo "$DIFF_OUTPUT" > .tmp_prisma_prod_diff.sql || true

# 2) Block destructive statements
if echo "$DIFF_OUTPUT" | grep -E "DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM|ALTER TABLE[^;]*DROP" >/dev/null; then
  echo -e "${RED}✗ Destructive changes detected in diff. Aborting.${NC}"
  echo -e "Review .tmp_prisma_prod_diff.sql for details. Only additive changes are allowed."
  exit 1
fi

echo -e "${GREEN}✓ No destructive changes detected.${NC}"

# 3) Backup production with PEM-safe temp .env.local
echo -e "\n${YELLOW}→ Creating production backup (PEM-safe)...${NC}"

# Normalize PROD_URL for backup script parser (expects postgresql://host:port)
BACKUP_URL="$PROD_URL_ENV"
# a) scheme postgres -> postgresql
BACKUP_URL="${BACKUP_URL/#postgres:\/\//postgresql://}"
# b) strip query params
BACKUP_URL="${BACKUP_URL%%\?*}"
# c) inject :5432 if host has no explicit port
if [[ "$BACKUP_URL" =~ ^postgresql://[^@]+@[^:/]+/[^/]+$ ]]; then
  PREFIX="${BACKUP_URL%%@*}@"          # up to and including '@'
  AFTER_AT="${BACKUP_URL#*@}"          # host/db
  HOST_PART="${AFTER_AT%%/*}"          # host
  REST_PART="/${AFTER_AT#*/}"          # /db
  BACKUP_URL="${PREFIX}${HOST_PART}:5432${REST_PART}"
fi

# Robust env swap with trap-based restore
ORIG_ENV_PATH=".env.local"
TEMP_ENV_PATH=".env.local"
BACKUP_ENV_PATH=".env.local.full.safe-sync.$$"
ORIG_ENV_EXISTS=false

restore_env() {
  # If original existed, restore it; otherwise, ensure we don't leave a temp file behind
  if [ "$ORIG_ENV_EXISTS" = true ] && [ -f "$BACKUP_ENV_PATH" ]; then
    mv -f "$BACKUP_ENV_PATH" "$ORIG_ENV_PATH" || true
  fi
}

trap restore_env EXIT INT TERM

if [ -f "$ORIG_ENV_PATH" ]; then
  mv "$ORIG_ENV_PATH" "$BACKUP_ENV_PATH"
  ORIG_ENV_EXISTS=true
fi

# Write minimal env using DATABASE_URL (not PRODUCTION) to satisfy script fallback
printf "DATABASE_URL='%s'\n" "$BACKUP_URL" > "$TEMP_ENV_PATH"

yes | pnpm run backup:production

# Early restore (trap will still protect on any later error)
if [ "$ORIG_ENV_EXISTS" = true ] && [ -f "$BACKUP_ENV_PATH" ]; then
  mv -f "$BACKUP_ENV_PATH" "$ORIG_ENV_PATH"
fi

echo -e "${GREEN}✓ Backup completed.${NC}"

# 4) Apply pending migrations to production
echo -e "\n${YELLOW}→ Applying pending migrations to production (non-destructive only)...${NC}"
DATABASE_URL="$PROD_URL_ENV" npx prisma migrate deploy

echo -e "\n${GREEN}✓ Production sync complete (non-destructive).${NC}"


