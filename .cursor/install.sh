#!/usr/bin/env bash
# Cloud Agent install script for STEM-TOYS3 (TechTots).
# Idempotent one-time setup: system deps, node deps, local Postgres, schema + seed data.
# Heavy/durable work lives here so it is baked into the environment build snapshot.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

PG_VERSION=16
DB_NAME=stemtoys_dev
DB_USER=postgres
DB_PASS=postgres

echo "==> [1/6] Ensuring PostgreSQL ${PG_VERSION} is installed"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

echo "==> [2/6] Starting PostgreSQL cluster"
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true
# Wait until the server accepts connections.
for _ in $(seq 1 30); do
  if pg_isready -q; then break; fi
  sleep 1
done

echo "==> [3/6] Ensuring database role and database exist"
sudo -u postgres psql -tc "ALTER USER ${DB_USER} PASSWORD '${DB_PASS}';" >/dev/null
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb "${DB_NAME}"
fi

echo "==> [4/6] Generating local env files (only if missing)"
if [ ! -f .env ]; then
  cat > .env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
DIRECT_DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
EOF
fi
if [ ! -f .env.local ]; then
  cat > .env.local <<EOF
# ---- Core ----
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -hex 32)

# ---- Security keys ----
ENCRYPTION_KEY=$(openssl rand -hex 32)
CSRF_SECRET_KEY=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 24)
SECURITY_QUESTIONS_KEY=$(openssl rand -hex 24)
REVALIDATION_SECRET=$(openssl rand -hex 16)
CRON_SECRET=$(openssl rand -hex 16)
CRON_SECRET_TOKEN=devcron
NEXT_PUBLIC_CRON_SECRET_TOKEN=devcron

# ---- Database ----
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
DIRECT_DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

# ---- Redis / cache (disabled for local dev) ----
DISABLE_REDIS=true
RATE_LIMIT_PROVIDER=memory

# ---- Payments (local defaults) ----
PAYMENT_PROVIDER=netopia
NEXT_PUBLIC_PAYMENT_PROVIDER=netopia
NEXT_PUBLIC_NETOPIA_ENABLED=true
NEXT_PUBLIC_STRIPE_ENABLED=false

# ---- Misc dev flags ----
LOG_LEVEL=info

# ---- Dev admin bootstrap (local only) ----
USE_ENV_ADMIN=true
ADMIN_EMAIL=admin@techtots.local
ADMIN_NAME="Dev Admin"
ADMIN_PASSWORD=Admin1234!
SKIP_ADMIN_VALIDATION=true
EOF
fi

echo "==> [5/6] Installing Node dependencies (pnpm, runs prisma generate via postinstall)"
pnpm install --frozen-lockfile

echo "==> [6/6] Syncing schema and seeding local data (best effort)"
# Use `prisma db push` for local dev: the historical migration chain contains a
# latent ordering bug (InvoiceStatus enum used before creation) that breaks a
# fresh `migrate deploy`, while db push materializes the full current schema.
# Prisma auto-loads DATABASE_URL from .env; the seed scripts auto-load .env.local.
pnpm exec prisma db push --skip-generate
pnpm run seed:admin || true
pnpm run seed || true
# The public storefront only shows APPROVED products; approve seeded demo items.
PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" \
  -c "UPDATE \"Product\" SET status='APPROVED' WHERE status='IN_PENDING';" || true

echo "==> install.sh complete"
