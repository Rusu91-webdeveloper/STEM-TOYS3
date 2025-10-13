# Production Database Migration Guide

**Real-World Workflow for Updating Production Database Without Data Loss**

## 🎯 Overview

This guide explains how to safely add new tables or columns to your production
database while preserving all existing customer data.

## ✅ Why Prisma Migrations Are Safe

### Key Safety Features

1. **Additive Changes** - Adding columns/tables never deletes existing data
2. **Migration Tracking** - Prisma knows which migrations have run
3. **Transactional** - Migrations either succeed completely or roll back
4. **Repeatable** - Same migration file works locally and in production
5. **Version Controlled** - Migration history is tracked in git

### What Happens to Existing Data

When you add a new column:

```sql
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
```

**Result:**

- ✅ All existing users remain in database
- ✅ All existing columns keep their data
- ✅ New column is added with `NULL` value for existing rows
- ✅ New users can fill in the field
- ✅ No data is deleted or modified

---

## 📋 Complete Real-World Example

### Scenario: Adding Phone Number to User Table

You have 1,000 customers in production. You want to add a phone number field.

### Step 1: Update Schema Locally

**File: `prisma/schema.prisma`**

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  phoneNumber String?  // ← NEW FIELD
  createdAt   DateTime @default(now())
  // ... rest of fields
}
```

### Step 2: Create Migration Locally

```bash
# IMPORTANT: Use local database for development
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# Create the migration
npx prisma migrate dev --name add_user_phone_number
```

**Output:**

```
✓ Your database is now in sync with your schema.
✓ Generated Prisma Client
✓ Applied migration 20241013_add_user_phone_number
```

**Migration file created:**
`prisma/migrations/20241013123456_add_user_phone_number/migration.sql`

```sql
-- CreateTable or AlterTable statements
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
```

### Step 3: Test Locally

```bash
# 1. Check local database has the new column
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma studio

# Navigate to User table - you should see phoneNumber column

# 2. Test your application
pnpm run dev

# Visit http://localhost:3000
# - Existing test users should still work
# - Try creating a new user with phone number
# - Try updating existing user with phone number

# 3. Run automated tests
pnpm run test

# 4. Build production bundle
pnpm run build
```

### Step 4: Review Migration SQL

**CRITICAL STEP**: Always review what will run in production!

```bash
# View the migration SQL
cat prisma/migrations/*/add_user_phone_number/migration.sql

# Should show simple ALTER TABLE statement
# No DROP TABLE or DELETE statements!
```

**Safe migrations look like:**

```sql
-- Adding column (SAFE)
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;

-- Adding table (SAFE)
CREATE TABLE "PhoneVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- Adding index (SAFE)
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");
```

**Dangerous migrations look like:**

```sql
-- DANGER: Drops entire table!
DROP TABLE "User";

-- DANGER: Removes column and all its data!
ALTER TABLE "User" DROP COLUMN "email";
```

If you see dangerous statements, **STOP** and reconsider your changes!

### Step 5: Backup Production Database

**Before ANY schema change, backup production!**

```bash
# Create backup of production database
pnpm run backup:production
```

**Output:**

```
Backing up production database...
✓ Backup created: backups/backup_production_20241013_143000.sql.gz
✓ Backup size: 45.2 MB
✓ Old backups cleaned up (keeping last 10)
```

**Why this matters:**

- If migration fails, you can restore
- If unexpected behavior occurs, you can rollback
- Peace of mind for critical changes

### Step 6: Deploy to Production

```bash
# 1. Stage your changes
git add prisma/schema.prisma
git add prisma/migrations/
git add app/  # Any code changes that use the new field

# 2. Commit with clear message
git commit -m "feat: add phone number field to User table

- Added phoneNumber column to User model
- Migration: add_user_phone_number
- Nullable field, safe for existing users
- Tested locally with existing data"

# 3. Push to production
git push origin main
```

### Step 7: Monitor Deployment

**Vercel Deployment Process:**

```
Building...                              [████████████] 100%
Running database migrations...
→ Applying migration: add_user_phone_number
✓ Migration applied successfully
Deploying...                             [████████████] 100%
✓ Deployment successful
```

**What runs automatically:**

```bash
# This command runs during deployment
npx prisma migrate deploy
```

**What it does:**

1. Connects to production database
2. Checks `_prisma_migrations` table
3. Identifies new migrations not yet applied
4. Runs them in order
5. Updates tracking table
6. Exits with success/failure

### Step 8: Verify Production

```bash
# 1. Check Vercel/Railway deployment logs
# Look for migration success message

# 2. Test production website
# - Login with existing account ✓
# - View user profile ✓
# - Check products still load ✓
# - Test checkout flow ✓

# 3. Check Neon dashboard (if you have access)
# - Navigate to SQL Editor
# - Run: SELECT * FROM "User" LIMIT 1;
# - Verify phoneNumber column exists
```

**Expected result:**

- All 1,000 existing customers still in database
- All existing data intact
- New `phoneNumber` column added with NULL values
- Application works normally

---

## 🔄 More Complex Scenarios

### Scenario 2: Adding a New Table

**Example: Add a wishlist feature**

```prisma
// In prisma/schema.prisma
model Wishlist {
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
}

model User {
  id        String     @id @default(cuid())
  // ... existing fields
  wishlist  Wishlist[] // Add relation
}

model Product {
  id        String     @id @default(cuid())
  // ... existing fields
  wishlist  Wishlist[] // Add relation
}
```

**Migration process:**

```bash
# 1. Create migration locally
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name add_wishlist_table

# 2. Test locally
pnpm run dev

# 3. Review migration SQL
cat prisma/migrations/*/add_wishlist_table/migration.sql

# Should show:
# - CREATE TABLE "Wishlist"
# - No DROP TABLE or ALTER on User/Product
# - Just adds new table and relations

# 4. Backup production
pnpm run backup:production

# 5. Deploy
git add .
git commit -m "feat: add wishlist feature"
git push origin main
```

**Result:**

- New `Wishlist` table created
- User table untouched
- Product table untouched
- Existing data 100% safe

### Scenario 3: Making a Column Required (Risky!)

**Problem**: You want to make `phoneNumber` required, but existing users don't
have it.

**Wrong approach (will fail!):**

```prisma
model User {
  phoneNumber String  // ❌ Removing ? makes it required
}
```

```bash
npx prisma migrate dev --name make_phone_required
# ERROR: Cannot add NOT NULL column without default value
```

**Right approach (two-step migration):**

**Step 1: Add column with default**

```prisma
model User {
  phoneNumber String @default("000-000-0000")  // Temporary default
}
```

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name add_phone_with_default
```

**Step 2: Update existing users**

```bash
# Create a data migration script
# File: scripts/populate-phone-numbers.ts

import { prisma } from '@/lib/prisma'

async function main() {
  // Update users without phone numbers
  await prisma.user.updateMany({
    where: { phoneNumber: "000-000-0000" },
    data: { phoneNumber: null } // Or send email asking for it
  })
}

main()
```

**Step 3: Make it required (after data is ready)**

```prisma
model User {
  phoneNumber String  // Now required, all users have values
}
```

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name make_phone_required_final
```

### Scenario 4: Renaming a Column (Data Migration)

**Problem**: You want to rename `name` to `fullName`

**Wrong approach (data loss!):**

```prisma
model User {
  // name     String?  ❌ Removed
  fullName String?     // ❌ New column - data lost!
}
```

**Right approach (3-step migration):**

**Step 1: Add new column**

```prisma
model User {
  name     String?  // Keep old
  fullName String?  // Add new
}
```

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name add_fullname_column
```

**Step 2: Copy data**

```sql
-- Run this on production after migration
UPDATE "User" SET "fullName" = "name" WHERE "fullName" IS NULL;
```

Or use a script:

```typescript
// scripts/migrate-name-to-fullname.ts
await prisma.user.updateMany({
  where: { fullName: null },
  data: { fullName: { _field: "name" } }, // Copy from name
});
```

**Step 3: Remove old column**

```prisma
model User {
  // name     String?  // Remove old
  fullName String?
}
```

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name remove_old_name_column
```

---

## ⚠️ Migration Safety Checklist

Before deploying ANY migration to production:

### Pre-Deployment

- [ ] ✅ Migration tested locally with real-like data
- [ ] ✅ Migration SQL reviewed (no DROP TABLE/COLUMN)
- [ ] ✅ Production database backed up (`pnpm run backup:production`)
- [ ] ✅ Application tested locally after migration
- [ ] ✅ Tests passing (`pnpm run test`)
- [ ] ✅ Build successful (`pnpm run build`)
- [ ] ✅ Rollback plan prepared

### During Deployment

- [ ] ✅ Monitor deployment logs
- [ ] ✅ Watch for migration success message
- [ ] ✅ Check application starts successfully

### Post-Deployment

- [ ] ✅ Test critical user flows (login, checkout, etc.)
- [ ] ✅ Verify new feature works
- [ ] ✅ Check error logs for issues
- [ ] ✅ Monitor for 15-30 minutes

---

## 🚨 Emergency Rollback

### If Migration Fails

**Option 1: Fix Forward (Preferred)**

If the migration fails partway through:

```bash
# 1. Check what went wrong in deployment logs
# 2. Fix the issue in a new migration
# 3. Deploy the fix
```

**Option 2: Restore from Backup (Nuclear Option)**

If data is corrupted or lost:

```bash
# 1. Find latest backup before deployment
ls -lt backups/

# 2. Restore (requires confirmation)
./scripts/restore-database.sh \
  backups/backup_production_20241013_143000.sql.gz \
  production

# Type: RESTORE PRODUCTION

# 3. Revert code deployment in Vercel/Railway
# 4. Investigate what went wrong
# 5. Fix and redeploy properly
```

---

## 📊 Migration Best Practices

### 1. Always Test with Production-Like Data

```bash
# Seed local DB with realistic data volumes
# If production has 10,000 users, test with 10,000 locally

# Generate test data
node scripts/seed-large-dataset.js
```

### 2. Use Safe Migration Patterns

**Safe:**

- Adding new columns (nullable)
- Adding new tables
- Adding indexes
- Creating relations

**Risky:**

- Making columns required (use two-step approach)
- Removing columns (consider soft delete first)
- Renaming columns (use three-step approach)
- Changing column types (test thoroughly!)

### 3. Keep Migrations Small

Instead of one big migration:

```bash
# ❌ Bad: One massive change
npx prisma migrate dev --name huge_refactor
```

Do incremental migrations:

```bash
# ✅ Good: Small, focused changes
npx prisma migrate dev --name add_phone_column
npx prisma migrate dev --name add_phone_index
npx prisma migrate dev --name add_verification_table
```

### 4. Use Descriptive Migration Names

```bash
# ❌ Bad
npx prisma migrate dev --name update

# ✅ Good
npx prisma migrate dev --name add_user_phone_number_field
npx prisma migrate dev --name create_order_refunds_table
npx prisma migrate dev --name add_product_category_index
```

### 5. Document Breaking Changes

If migration requires app code changes:

```bash
git commit -m "feat: add phone verification

BREAKING CHANGE: User.phoneNumber is now required
All API endpoints must include phoneNumber field

Migration: add_phone_verification_system"
```

---

## 🎓 Key Takeaways

### What You Learned

1. **Migrations are safe** - Adding columns/tables preserves existing data
2. **Same migration runs everywhere** - Local → Production consistency
3. **Always backup first** - Protection against unexpected issues
4. **Test thoroughly locally** - Catch issues before production
5. **Review SQL before deploying** - Know exactly what will change
6. **Monitor deployments** - Catch and fix issues quickly

### Your Production Data is Safe Because

- ✅ **Additive migrations** don't delete data
- ✅ **Transactional** - either succeeds completely or rolls back
- ✅ **Tracked** - Prisma knows what's been applied
- ✅ **Tested** - Same migration works locally first
- ✅ **Backed up** - Can restore if needed

### Daily Workflow Summary

```bash
# 1. Make changes locally
# Edit prisma/schema.prisma

# 2. Create migration
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
npx prisma migrate dev --name your_change_name

# 3. Test locally
pnpm run dev
pnpm run test

# 4. Review migration SQL
cat prisma/migrations/latest/migration.sql

# 5. Backup production
pnpm run backup:production

# 6. Deploy
git add .
git commit -m "feat: description of change"
git push origin main

# 7. Monitor and verify
# Watch deployment logs
# Test production site
```

---

## 📚 Additional Resources

- **Prisma Migration Docs**:
  https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Database Safety Guide**: See `DATABASE_SAFETY.md`
- **Environment Setup**: See `ENVIRONMENT_SETUP.md`

---

## ✅ You're Ready!

You now understand how to safely update your production database without
affecting existing data. The key is:

1. **Test locally first**
2. **Review what will change**
3. **Backup before deploying**
4. **Monitor after deployment**

**Remember**: Migrations are designed to be safe! Adding columns and tables will
never delete your customer data. 🎉

---

_Last Updated: October 2024_ _Local Development: Safe to experiment_
_Production: Protected by backups and safe migration practices_
