# Database Safety Guide

Complete guide to protect your production database from accidental modifications
and data loss.

## Table of Contents

- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Setup Instructions](#setup-instructions)
- [Scripts & Commands](#scripts--commands)
- [Development Workflow](#development-workflow)
- [Emergency Procedures](#emergency-procedures)
- [Best Practices](#best-practices)

---

## Quick Start (5 Minutes)

### Step 1: Backup Your Database NOW

```bash
npm run backup:now
```

This creates a timestamped backup in the `backups/` folder. **Do this before any
other changes!**

### Step 2: Check Current Safety Status

```bash
npm run db:check-safety
```

If you see "PRODUCTION DATABASE DETECTED IN DEVELOPMENT MODE" - you need to fix
this immediately!

### Step 3: Run Safety Setup Wizard

```bash
npm run db:setup-safe
```

Follow the prompts to separate your local and production databases.

### Step 4: Verify Setup

```bash
npm run db:check-safety
```

Should now show: "Local database detected - Safe to proceed"

---

## The Problem

Using the same database URL for both local development and production is
**extremely dangerous**:

- Running migrations locally affects production immediately
- Testing features locally modifies production data
- Database schema changes happen in production without warning
- Data loss can happen without any safety net
- Tables can disappear when working on local changes

### Real-World Scenario

```bash
# .env.local (DANGEROUS)
DATABASE_URL=postgresql://...neon.tech/production  # Production DB!
NODE_ENV=development

# When you run:
npx prisma migrate dev --name add_new_column

# Result: PRODUCTION DATABASE MODIFIED! Tables dropped, data lost!
```

---

## The Solution

### Separate Databases for Each Environment

- **Local Development**: Your own database for testing
- **Production**: Live database for real users
- **Never mix them**: Strict separation prevents accidents

### After Setup (SAFE)

```bash
# .env.local
DATABASE_URL=postgresql://localhost:5432/stemtoys_dev  # Local only!
DATABASE_URL_LOCAL=postgresql://localhost:5432/stemtoys_dev
DATABASE_URL_PRODUCTION=postgresql://...neon.tech/production  # Reference
NODE_ENV=development

# When you run:
npm run migrate:safe

# Result: Only LOCAL database is touched. Production is safe!
```

---

## Setup Instructions

### Option A: Local PostgreSQL (Recommended)

Best for full control and offline development.

**Install PostgreSQL:**

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt-get install postgresql-16

# Docker
docker run --name postgres-local \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16
```

**Create Database:**

```bash
createdb stemtoys_dev

# Verify it works
psql -d stemtoys_dev -c "SELECT version();"
```

**Your Local URL:**

```
postgresql://postgres:postgres@localhost:5432/stemtoys_dev
```

### Option B: Free Cloud Database (Easier)

Best for quick setup without local installation.

**Steps:**

1. Go to [Neon.tech](https://neon.tech) (Free tier: 500MB, no credit card)
2. Click "Create Project"
3. Name it "stemtoys-dev"
4. Copy the connection string provided
5. Use as `DATABASE_URL_LOCAL` in `.env.local`

### Configure Environment Variables

**Create/Update `.env.local`:**

```bash
# =============================================================================
# DEVELOPMENT ENVIRONMENT
# =============================================================================

# Node environment
NODE_ENV=development

# LOCAL DATABASE (for development) - SAFE TO MODIFY
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev
DATABASE_URL_LOCAL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev

# PRODUCTION DATABASE (DO NOT USE IN DEVELOPMENT!)
# Only used when explicitly backing up or deploying
DATABASE_URL_PRODUCTION=your-production-database-url-here

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Other required variables...
```

**Production Environment (Vercel Dashboard):**

```bash
NODE_ENV=production
DATABASE_URL=your-production-database-url-here
# Do NOT include DATABASE_URL_LOCAL in production
```

### Initialize Local Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed with test data
npm run seed

# Or use specific seed scripts
node seed-basic-products.js
node seed-email-templates.js
node seed-test-suppliers.js
```

---

## Scripts & Commands

### Backup Commands

```bash
# Quick backup of current database
npm run backup:now

# Backup production database
npm run backup:production

# Backup local database
npm run backup:local

# Manual backup with script
./scripts/backup-database.sh production
```

**Backup Files Location:** `backups/backup_[environment]_YYYYMMDD_HHMMSS.sql.gz`

### Safety Check Commands

```bash
# Check if using production database
npm run db:check-safety

# Run interactive setup wizard
npm run db:setup-safe

# Safe migration with automatic check
npm run migrate:safe
```

### Restore Commands

```bash
# List available backups
ls -lt backups/

# Restore to local database (safe)
./scripts/restore-database.sh backups/backup_production_20241009_120000.sql.gz local

# Restore to production (requires confirmation)
./scripts/restore-database.sh backups/backup_production_20241009_120000.sql.gz production
```

### Database Management

```bash
# Open Prisma Studio
npm run db:studio

# Check database diff
npm run db:diff

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (local only!)
npm run db:reset
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start development server (uses local DB automatically)
npm run dev

# 2. Make code changes

# 3. Update Prisma schema (if needed)
# Edit prisma/schema.prisma

# 4. Create and test migration locally
npm run migrate:safe
# This checks safety before running: npx prisma migrate dev

# 5. Test your changes
npm run test

# 6. Commit changes
git add .
git commit -m "Your changes"
```

### Before Deploying to Production

```bash
# 1. CRITICAL: Backup production database first!
npm run backup:production

# 2. Review schema changes
npx prisma migrate diff \
  --from-url="$DATABASE_URL_PRODUCTION" \
  --to-schema-datamodel prisma/schema.prisma

# 3. Test locally one more time
npm run test
npm run build

# 4. Deploy (migrations run automatically on Vercel)
git push origin main

# 5. Monitor deployment
vercel logs --follow

# 6. Verify production database
npm run db:check-safety  # Should show production is safe
```

### Weekly Maintenance

```bash
# Every Monday: Backup production database
npm run backup:production

# Every month: Clean old backups (keeps last 10)
# This happens automatically in backup script

# Quarterly: Database health check
node scripts/check-db-indexes.js
```

---

## Emergency Procedures

### If You Accidentally Modified Production

**Immediate Actions:**

1. **STOP** - Don't make any more changes
2. **Don't panic** - Your backups can save you
3. **Assess damage** - Check what was modified
4. **Restore immediately** if data loss occurred

**Restoration Steps:**

```bash
# 1. List available backups
ls -lt backups/

# 2. Find the most recent backup before the accident
# Example: backup_production_20241009_143000.sql.gz

# 3. Restore the backup
./scripts/restore-database.sh \
  backups/backup_production_20241009_143000.sql.gz \
  production

# 4. Verify data is restored
# Log into your application
# Check critical data: users, products, orders

# 5. Review what went wrong
npm run db:check-safety

# 6. Fix configuration to prevent future issues
npm run db:setup-safe
```

### If Backup Script Fails

**Check these:**

```bash
# 1. Verify pg_dump is installed
pg_dump --version

# 2. Check DATABASE_URL is accessible
echo $DATABASE_URL

# 3. Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"

# 4. Check disk space
df -h

# 5. Verify backups folder exists and is writable
ls -la backups/
```

### If You Lost Data and Have No Recent Backup

1. Check if Vercel/Neon has automatic backups
2. Contact your database provider's support
3. Check if you have any database snapshots
4. Review git history for Prisma schema changes
5. Implement immediate backup schedule going forward

---

## Best Practices

### Essential Safety Rules

- [ ] **Always backup before changes** - No exceptions
- [ ] **Use separate databases** - Local for dev, production for live
- [ ] **Run safety checks** - Before every migration
- [ ] **Never modify production directly** - Always test locally first
- [ ] **Keep `.env.local` out of git** - Add to .gitignore
- [ ] **Document environment setup** - For team members
- [ ] **Schedule automatic backups** - Weekly at minimum
- [ ] **Test restore procedures** - Verify backups actually work

### Configuration Checklist

- [ ] Local database set up and working
- [ ] Production database backed up
- [ ] `.env.local` has `DATABASE_URL_LOCAL` and `DATABASE_URL_PRODUCTION`
- [ ] `NODE_ENV=development` in `.env.local`
- [ ] Safety check script runs without errors
- [ ] Team members trained on safety procedures
- [ ] Backup rotation policy established (keep last 10)
- [ ] Emergency contact list created

### Development Best Practices

- [ ] Always use `npm run migrate:safe` instead of `npx prisma migrate dev`
- [ ] Review migration SQL before running
- [ ] Test migrations on local database first
- [ ] Keep migration files in git
- [ ] Use descriptive migration names
- [ ] Never skip migrations in production
- [ ] Monitor database performance after migrations
- [ ] Document breaking schema changes

### Backup Strategy

**Frequency:**

- **Before deployments:** Always
- **Weekly:** Automatic backup on Sundays
- **Before major changes:** Schema modifications, data imports
- **Monthly:** Long-term archive backup

**Retention:**

- **Daily backups:** Keep for 7 days
- **Weekly backups:** Keep for 4 weeks
- **Monthly backups:** Keep for 12 months
- **Pre-deployment backups:** Keep indefinitely

**Verification:**

- Test restore procedure monthly
- Verify backup file integrity
- Ensure backup files are compressed
- Monitor backup storage usage

---

## Database Safety Scripts Reference

### backup-database.sh

Creates compressed backups of PostgreSQL databases.

**Usage:**

```bash
./scripts/backup-database.sh [production|local]
```

**Features:**

- Timestamped backups
- Automatic compression (gzip)
- Keeps last 10 backups
- Confirmation prompts
- Error handling

### restore-database.sh

Restores database from backup file.

**Usage:**

```bash
./scripts/restore-database.sh <backup_file.sql.gz> [local|production]
```

**Features:**

- Automatic decompression
- Safety confirmations
- Production requires typing "RESTORE PRODUCTION"
- Validates backup file exists
- Error handling and rollback

### check-database-safety.js

Detects if using production database in development.

**Usage:**

```bash
node scripts/check-database-safety.js
```

**Checks:**

- Current DATABASE_URL
- NODE_ENV setting
- Production database indicators (neon.tech, railway.app, etc.)
- Warns if misconfigured
- Requires confirmation to continue with production DB

### setup-safe-databases.sh

Interactive wizard for database setup.

**Usage:**

```bash
./scripts/setup-safe-databases.sh
```

**Features:**

- Guides through database selection
- Creates local database if needed
- Updates `.env.local` safely
- Backs up existing configuration
- Validates setup after completion

---

## Troubleshooting

### "DATABASE_URL not found"

**Solution:**

```bash
# Check .env.local exists
ls -la .env.local

# Create from example if needed
cp env.example .env.local

# Verify DATABASE_URL is set
grep DATABASE_URL .env.local
```

### "Connection refused" to Local Database

**Solution:**

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if stopped
brew services start postgresql@16

# Test connection
psql -d stemtoys_dev -c "SELECT 1;"
```

### "Permission denied" on Backup Script

**Solution:**

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Verify permissions
ls -la scripts/backup-database.sh
```

### "Backup file not found"

**Solution:**

```bash
# Check backups folder exists
ls -la backups/

# Create if missing
mkdir -p backups

# List available backups with full path
find backups/ -name "*.sql.gz"
```

---

## Additional Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Neon Documentation:** https://neon.tech/docs
- **Project Environment Setup:** See `ENVIRONMENT_SETUP.md`
- **Database Schema:** See `prisma/schema.prisma`

---

## Summary

This guide protects you from:

- Accidental production database modifications
- Data loss from schema changes
- Mixing development and production databases
- Irreversible migrations
- Lost tables and data

By following this guide, you get:

- Separate local and production databases
- Automatic backup system
- Safety checks before migrations
- Emergency restore procedures
- Peace of mind while developing

**Remember:** It's better to spend 5 minutes on safety now than hours recovering
data later!
