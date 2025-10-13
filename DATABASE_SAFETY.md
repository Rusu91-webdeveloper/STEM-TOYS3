# Database Safety Guide

Complete guide to protect your production database from accidental modifications
and data loss.

## ✅ Current Status

**Your development environment is now SAFE!** 🎉

- ✅ **Local Database**: `stemtoys_dev` at `localhost:5432`
- ✅ **Production Database**: Protected (stored as `DATABASE_URL_PRODUCTION`)
- ✅ **Safety Check**: Active and verified
- ✅ **Test Data**: Seeded and ready to use

**Always run `pnpm run db:check-safety` before database changes!**

---

## Table of Contents

- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [Current Status](#current-status)
- [Daily Usage Guide](#daily-usage-guide)
- [Quick Commands Reference](#quick-commands-reference)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Setup Instructions](#setup-instructions)
- [Scripts & Commands](#scripts--commands)
- [Development Workflow](#development-workflow)
- [Deploying to Production](#deploying-to-production)
- [Database Status](#database-status)
- [Emergency Procedures](#emergency-procedures)
- [Troubleshooting](#troubleshooting)
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

## Daily Usage Guide

### Starting Development

```bash
# Start the development server (uses local DB automatically)
pnpm run dev
```

✅ **Uses local database automatically** - No risk to production data!

### Making Database Changes

#### Option 1: Quick Schema Sync (No Migration)

```bash
# Edit prisma/schema.prisma, then:
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma db push
```

Use this for rapid prototyping and testing schema changes locally.

#### Option 2: Create Migration (For Production)

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name your_migration_name
```

Use this when you want to create a migration file that will be applied to
production.

### Viewing Your Database

```bash
# Option 1: Prisma Studio (Visual Interface)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma studio
# Opens browser at http://localhost:5555

# Option 2: Direct SQL Access
psql postgresql://postgres:postgres@localhost:5432/stemtoys_dev

# Option 3: Quick Query
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Product\";"
```

### Resetting Local Database

```bash
# SAFE - Only affects your local database!
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# Option 1: Reset and sync (RECOMMENDED)
npx prisma migrate reset --force
npx prisma db push --accept-data-loss
pnpm run seed

# Option 2: Drop and recreate database
dropdb stemtoys_dev
createdb stemtoys_dev
npx prisma db push --accept-data-loss
pnpm run seed
```

**Why two steps?** The migrations don't include all columns in your schema, so
we need to run `db push` after reset to sync everything.

This wipes your local database and re-seeds it with fresh test data.

### Safety Check

```bash
# Run this before making any database changes
pnpm run db:check-safety
```

Expected output: **"✓ Local database detected - Safe to proceed"**

---

## Quick Commands Reference

### Essential Commands

```bash
# Safety check (run before database changes)
pnpm run db:check-safety

# Start development server
pnpm run dev

# View database in browser (Prisma Studio)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma studio

# Sync schema changes to local DB (no migration)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma db push

# Create migration for production
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name migration_name

# Reset local database completely (2 steps needed!)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate reset --force
npx prisma db push --accept-data-loss
pnpm run seed

# Check database connection
psql postgresql://postgres:postgres@localhost:5432/stemtoys_dev -c "SELECT version();"
```

### Backup Commands

```bash
# Quick backup of production
pnpm run backup:production

# Backup local database
pnpm run backup:local
```

### Pro Tip: Add to Shell Profile

Add this to your `~/.zshrc` or `~/.bashrc` to avoid typing export every time:

```bash
# Add to ~/.zshrc
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
```

Then just run:

```bash
npx prisma studio  # Works without export!
```

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

## Deploying to Production

### Pre-Deployment Checklist

Before pushing changes that include database migrations:

#### 1. Verify Changes Locally

```bash
# Run safety check
pnpm run db:check-safety  # Should show "Local database"

# Build the project
pnpm run build

# Run tests
pnpm run test
```

#### 2. Review Migration SQL

Check what will actually change in production:

```bash
# View the migration file
cat prisma/migrations/LATEST_MIGRATION_NAME/migration.sql

# Or check diff against production (if you have access)
npx prisma migrate diff \
  --from-url="$DATABASE_URL_PRODUCTION" \
  --to-schema-datamodel prisma/schema.prisma
```

#### 3. Backup Production Database

**CRITICAL**: Always backup before schema changes!

```bash
pnpm run backup:production
```

Neon also provides automatic backups, but it's better to be safe.

#### 4. Deploy

```bash
git add .
git commit -m "feat: your changes with migration description"
git push origin main
```

#### 5. Monitor Deployment

Watch the deployment process:

- Vercel/Railway will automatically run `prisma migrate deploy`
- Monitor logs for any migration errors
- Check application health after deployment

#### 6. Verify Production

After deployment:

```bash
# Check production is running
curl https://your-production-url.com/api/health

# Verify critical features work
# - Test user login
# - Check product listings
# - Verify checkout flow
```

### What Happens During Deployment

1. **Code Deploy**: Your code is pushed to production
2. **Build Phase**: Next.js builds the application
3. **Migration Phase**: Prisma runs `prisma migrate deploy`
4. **Start Phase**: Application starts with new schema

### Rollback Procedure

If something goes wrong:

1. **Immediately**: Revert the deployment in Vercel/Railway dashboard
2. **If data was affected**: Restore from backup (see Emergency Procedures)
3. **Fix locally**: Debug the issue in your local environment
4. **Test thoroughly**: Ensure fix works locally
5. **Re-deploy**: Push fixed version

---

## Database Status

### Local Database (Development)

- **Host**: `localhost:5432`
- **Database**: `stemtoys_dev`
- **User**: `postgres`
- **Status**: ✅ Active and Seeded
- **Purpose**: Development and testing
- **Data**: Test data only (safe to modify/delete/reset)
- **Backup**: Not needed (can be regenerated)

**Seeded Data:**

- ✅ 1 Admin user (`rusu.emanuel.webdeveloper@gmail.com`)
- ✅ 5 Categories (Science, Technology, Engineering, Mathematics, Educational
  Books)
- ✅ 2 Languages (English, Romanian)
- ✅ 6 Test products
- ✅ 3 Blog posts

### Production Database

- **Host**: `ep-small-union-a2e4pe5c-pooler.eu-central-1.aws.neon.tech`
- **Database**: `neondb`
- **Provider**: Neon (PostgreSQL)
- **Status**: 🔒 Protected (not used in development)
- **Purpose**: Live production data
- **Data**: Real customer data (DO NOT TOUCH from local environment)
- **Backup**: Automatic (Neon) + Manual (via `pnpm run backup:production`)

### Configuration Summary

```bash
# Development (.env.local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev
DATABASE_URL_PRODUCTION=postgres://...neon.tech/neondb  # Reference only
NODE_ENV=development

# Production (Vercel/Railway Dashboard)
DATABASE_URL=postgres://...neon.tech/neondb
NODE_ENV=production
```

### Verify Current Setup

```bash
# Check which database you're using
pnpm run db:check-safety

# Check local database has data
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
psql $DATABASE_URL -c "SELECT COUNT(*) as products FROM \"Product\"; SELECT COUNT(*) as users FROM \"User\";"
```

Expected output:

```
products: 6
users: 1
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

### "Environment variable not found: DATABASE_URL"

This is the most common issue when running Prisma commands.

**Solution:**

Always export DATABASE_URL before running Prisma commands:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma studio  # or any prisma command
```

**Permanent Fix (Recommended):**

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# Add this line to ~/.zshrc
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
```

Then reload your shell:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

Now you can run Prisma commands without exporting every time!

### "DATABASE_URL not found" in .env.local

**Solution:**

```bash
# Check .env.local exists
ls -la .env.local

# Create from example if needed
cp env.example .env.local

# Verify DATABASE_URL is set
grep DATABASE_URL .env.local

# Should show:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev
```

### "Connection refused" to Local Database

**Problem**: PostgreSQL is not running or not accepting connections.

**Solution:**

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# If using Postgres.app, ensure it's started
# Look for the elephant icon in your menu bar

# Start PostgreSQL if stopped
brew services start postgresql@16

# Or for Postgres.app, click the elephant icon and select "Start"

# Test connection
psql -d stemtoys_dev -c "SELECT 1;"

# Check if the database exists
psql -l | grep stemtoys_dev

# Create database if it doesn't exist
createdb stemtoys_dev
```

### Want to inspect production data?

**⚠️ WARNING: READ ONLY - NEVER MODIFY**

To view production data (read-only):

1. **Best Option**: Use Neon Dashboard
   - Go to https://console.neon.tech
   - Select your production database
   - Use the SQL Editor (read-only mode)

2. **Alternative**: Use Prisma Studio with production URL (read-only)

   ```bash
   # DANGER: Only use for reading, never modify!
   export DATABASE_URL="$DATABASE_URL_PRODUCTION"
   npx prisma studio
   # Close immediately after viewing!
   ```

3. **Safest**: Export production data to local
   ```bash
   pnpm run backup:production
   # Import to a separate local database for analysis
   ```

### Local database connection refused?

**Check PostgreSQL is running:**

```bash
# Check if PostgreSQL server is up
pg_isready -h localhost -p 5432

# If using Homebrew:
brew services list | grep postgresql

# Start if not running:
brew services start postgresql@16

# If using Postgres.app:
# Check menu bar for elephant icon
# Click and select "Start"

# Test connection:
psql -h localhost -p 5432 -U postgres -d stemtoys_dev
```

### "Column does not exist" error when seeding

**Error**:
`The column 'User.accountLocked' does not exist in the current database`

This happens because migrations don't include all columns from your schema.

**Solution:**

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# Always run db push after migrate reset
npx prisma migrate reset --force
npx prisma db push --accept-data-loss  # This adds missing columns!
pnpm run seed
```

### Reset everything and start fresh

If things get corrupted or you want to start over:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# Option 1: Complete reset (RECOMMENDED)
npx prisma migrate reset --force
npx prisma db push --accept-data-loss  # Important! Syncs all columns
pnpm run seed

# Option 2: Drop and recreate database
dropdb stemtoys_dev
createdb stemtoys_dev
npx prisma db push --accept-data-loss
pnpm run seed
```

### Prisma Client out of sync

**Error**: "Prisma Client did not initialize yet. Please run `prisma generate`"

**Solution:**

```bash
npx prisma generate

# If that doesn't work, try:
rm -rf node_modules/.pnpm/@prisma
pnpm install
npx prisma generate
```

### Migration conflicts

**Error**: "Migration `xxx` failed to apply"

**Solution:**

For local database (safe):

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# Option 1: Reset and start fresh
npx prisma migrate reset --force

# Option 2: Mark as applied (if you know it's already applied)
npx prisma migrate resolve --applied xxx

# Option 3: Roll back
npx prisma migrate resolve --rolled-back xxx
```

### "Permission denied" on Backup Script

**Solution:**

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Verify permissions
ls -la scripts/backup-database.sh

# Should show: -rwxr-xr-x (executable)
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

# Check disk space
df -h
```

### Can't run pnpm commands

**Solution:**

```bash
# Install pnpm if not installed
npm install -g pnpm

# Or use npm instead:
npm run dev
npm run db:check-safety

# Check pnpm version
pnpm --version
```

### Build fails after database changes

**Solution:**

```bash
# Regenerate Prisma Client
npx prisma generate

# Clear Next.js cache
rm -rf .next

# Rebuild
pnpm run build
```

---

## Additional Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Neon Documentation:** https://neon.tech/docs
- **Project Environment Setup:** See `ENVIRONMENT_SETUP.md`
- **Database Schema:** See `prisma/schema.prisma`

---

## ✅ Success Indicators

You're all set when you see these positive signs:

### Safety Check Passes

```bash
pnpm run db:check-safety
```

Expected output:

```
✓ Local database detected - Safe to proceed
```

### Development Server Starts

```bash
pnpm run dev
```

Should start without database connection errors.

### Admin Login Works

- URL: `http://localhost:3000/admin-login`
- Email: `rusu.emanuel.webdeveloper@gmail.com`
- Password: Check `ADMIN_PASSWORD` in `.env.local`

### Products Visible

Visit `http://localhost:3000` - you should see 6 test products.

### Prisma Studio Opens

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma studio
```

Opens at `http://localhost:5555` showing your local data.

### No Production Database Warnings

When running commands, you should NOT see:

- ❌ "PRODUCTION DATABASE DETECTED IN DEVELOPMENT MODE"
- ❌ "WARNING: You are about to modify production"

If you see these, run `pnpm run db:setup-safe` again!

---

## Summary

### What You're Protected From

- ✅ Accidental production database modifications
- ✅ Data loss from schema changes
- ✅ Mixing development and production databases
- ✅ Irreversible migrations
- ✅ Lost tables and data
- ✅ Testing directly on live data

### What You Now Have

- ✅ Separate local database (`stemtoys_dev`) for development
- ✅ Production database safely stored as `DATABASE_URL_PRODUCTION`
- ✅ Automatic safety checks before database operations
- ✅ Seeded test data (6 products, 1 admin user, etc.)
- ✅ Emergency restore procedures and backups
- ✅ Peace of mind while developing

### Key Points to Remember

1. **Always run `pnpm run db:check-safety`** before database changes
2. **Never use `DATABASE_URL_PRODUCTION`** in development commands
3. **Export DATABASE_URL** before Prisma commands (or add to shell profile)
4. **Test locally first** - your local DB is safe to break
5. **Backup before deploying** schema changes to production
6. **Reset freely** - local database can be regenerated anytime

### Daily Workflow

```bash
# 1. Start development
pnpm run dev

# 2. Make changes to prisma/schema.prisma

# 3. Sync to local database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma db push

# 4. Test your changes

# 5. When ready, commit and push
git add .
git commit -m "Your changes"
git push origin main
```

### Need Help?

- **Daily Usage**: See [Daily Usage Guide](#daily-usage-guide)
- **Commands**: See [Quick Commands Reference](#quick-commands-reference)
- **Problems**: See [Troubleshooting](#troubleshooting)
- **Deployment**: See [Deploying to Production](#deploying-to-production)

---

## 🎉 You're Protected!

Your production database is now **completely safe** from accidental changes
during development.

**Experiment freely, break things locally, learn without fear!** 🚀

**Remember:** It's better to spend 5 minutes on safety now than hours recovering
data later!

---

_Last Updated: October 2024_  
_Local Database: `stemtoys_dev` at `localhost:5432`_  
_Production: Protected ✅_
