#!/usr/bin/env bash
# Cloud Agent start script for STEM-TOYS3 (TechTots).
# Per-boot reconciliation: bring the local Postgres server up. Fast and idempotent.
# Durable state (deps, env files, DB schema + seed data) is created by install.sh
# and preserved in the environment snapshot, so it is not repeated here.
set -euo pipefail

PG_VERSION=16
DB_NAME=stemtoys_dev
DB_USER=postgres
DB_PASS=postgres

echo "==> Starting PostgreSQL ${PG_VERSION} cluster"
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if pg_isready -q; then
    echo "==> PostgreSQL is ready"
    break
  fi
  sleep 1
done

# Safety net for a freshly provisioned VM that never ran install.sh
# (e.g. a just-in-time agent whose snapshot lacks the database).
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1; then
  echo "==> Database ${DB_NAME} missing; creating and syncing schema"
  sudo -u postgres psql -tc "ALTER USER ${DB_USER} PASSWORD '${DB_PASS}';" >/dev/null || true
  sudo -u postgres createdb "${DB_NAME}" || true
  # Prisma auto-loads DATABASE_URL from .env.
  pnpm exec prisma db push --skip-generate || true
fi

echo "==> start.sh complete"
