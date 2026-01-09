# 🛡️ Pre-Push Safety Guide - Automatic Protection

## Overview

This guide explains the **automatic safety checks** that run before pushing database changes to GitHub. These checks ensure your production database is protected and only safe, additive migrations are deployed.

---

## 🚨 What Was Added

### 1. **Pre-Push Safety Protocol in Cursor Rules**

The `.cursorrules` file now includes a **mandatory pre-push safety protocol** that the AI must follow before any `git push` that includes database changes.

### 2. **Migration Validation Script**

A new script (`scripts/validate-migrations.js`) automatically:
- ✅ Checks all migration SQL files for dangerous operations
- ✅ Verifies only additive changes (ADD COLUMN, CREATE TABLE, etc.)
- ✅ Flags destructive operations (DROP TABLE, DROP COLUMN, DELETE, etc.)
- ✅ Checks for recent production backups
- ✅ Reports validation results clearly

### 3. **New npm Scripts**

```bash
# Validate all migrations are safe
pnpm run validate:migrations

# Complete pre-push safety check (all checks at once)
pnpm run pre-push:safety
```

---

## 🔄 How It Works

### Automatic Detection

When you want to push to GitHub, the AI automatically:

1. **Detects database changes** - Checks if `prisma/schema.prisma` or any migration files changed
2. **Runs safety checks** - If database changes detected, runs mandatory checks
3. **Validates migrations** - Scans all migration SQL for dangerous operations
4. **Verifies backup** - Ensures production backup exists
5. **Confirms safety** - Only proceeds if all checks pass

### The Safety Checks

```
🔒 PRE-PUSH SAFETY CHECKLIST

☐ Safety check passed (local database detected)
☐ All migration files reviewed (no destructive operations)
☐ All migrations committed to git
☐ Production backup created (within last 24 hours)
☐ Application builds successfully
☐ Tests pass (if applicable)
☐ Migration SQL verified (additive only)
```

**If ANY check fails → Push is blocked until fixed**

---

## 📋 Manual Usage

You can also run these checks manually:

### Validate Migrations

```bash
# Check all migration files are safe
pnpm run validate:migrations
```

**Output example:**
```
MIGRATION VALIDATION - Production Safety Check
================================================================================

Found 5 migration file(s)

✓ 20240101_initial_schema
✓ 20240115_add_user_phone_number
✓ 20240201_add_wishlist_table
✓ 20250115_add_blog_fields
✓ 20250116_add_supplier_features

--------------------------------------------------------------------------------

Checking for production backup...
✓ Recent backup found: backup_production_20250116_143000.sql.gz
  Age: 2.5 hours (0.1 days)

================================================================================

✅ ALL CHECKS PASSED
✓ All migrations are safe (additive only)
✓ Production backup exists and is recent

✓ Safe to push to production
```

### Full Pre-Push Check

```bash
# Run all safety checks at once
pnpm run pre-push:safety
```

This runs:
1. Database safety check (verifies local database)
2. Migration validation (checks all migrations)
3. Build verification (ensures app builds)

---

## 🚫 What Gets Blocked

### Dangerous Operations

The validation script will **block push** if migrations contain:

❌ **DROP TABLE** - Deletes entire tables
❌ **DROP COLUMN** - Removes columns and data
❌ **ALTER TABLE ... DROP** - Removes columns/constraints
❌ **DELETE FROM** - Deletes rows
❌ **TRUNCATE** - Empties tables
❌ **DROP INDEX** - Removes indexes
❌ **DROP TYPE/ENUM** - Removes types

### Safe Operations (Always Allowed)

✅ **ALTER TABLE ... ADD COLUMN** - Adds new columns
✅ **CREATE TABLE** - Creates new tables
✅ **CREATE INDEX** - Adds indexes
✅ **CREATE TYPE/ENUM** - Creates types
✅ **ALTER TABLE ... ADD CONSTRAINT** - Adds foreign keys
✅ **COMMENT ON** - Adds comments

---

## 📊 Example Scenarios

### Scenario 1: Safe Migration

**Migration file:**
```sql
-- Add phone number to User table
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
```

**Validation result:**
```
✓ 20250116_add_user_phone
✅ ALL CHECKS PASSED
Safe to push to production
```

### Scenario 2: Dangerous Migration (Blocked)

**Migration file:**
```sql
-- Remove old column
ALTER TABLE "User" DROP COLUMN "oldField";
```

**Validation result:**
```
✗ 20250116_remove_old_field
  Line 2: ALTER TABLE "User" DROP COLUMN "oldField"
    ⚠️  DANGEROUS OPERATION DETECTED

❌ VALIDATION FAILED
✗ Found 1 dangerous operation(s) in migration(s)

🚫 DO NOT PUSH TO PRODUCTION
```

### Scenario 3: Missing Backup

**Migration is safe, but no recent backup:**

```
✓ All migrations are safe (additive only)
⚠️  Production backup is missing or outdated

⚠️  Create backup before pushing: pnpm run backup:production
```

---

## 🔧 How to Fix Issues

### If Validation Fails

1. **Review flagged migrations:**
   ```bash
   cat prisma/migrations/[MIGRATION_NAME]/migration.sql
   ```

2. **Fix dangerous operations:**
   - Remove DROP statements
   - Use additive-only operations
   - Create new migration with safe changes

3. **Re-validate:**
   ```bash
   pnpm run validate:migrations
   ```

### If Backup is Missing

1. **Create production backup:**
   ```bash
   pnpm run backup:production
   ```

2. **Re-validate:**
   ```bash
   pnpm run validate:migrations
   ```

---

## 🤖 AI Behavior

The AI will now **automatically**:

1. ✅ Detect database changes before push
2. ✅ Run safety checks automatically
3. ✅ Validate all migrations
4. ✅ Check for backups
5. ✅ Block push if unsafe
6. ✅ Show clear error messages
7. ✅ Suggest fixes for issues

**You don't need to remember to run checks - the AI does it for you!**

---

## 📝 Workflow Example

### Normal Push (No Database Changes)

```bash
# User: "Push my changes"
# AI: Detects no database changes
# AI: Proceeds with normal push
git push origin main
```

### Push with Safe Database Changes

```bash
# User: "Push my changes"
# AI: Detects database changes
# AI: Runs: pnpm run validate:migrations
# Result: ✓ All checks passed
# AI: Shows summary and asks for confirmation
# User: Confirms
# AI: git push origin main
```

### Push with Dangerous Changes (Blocked)

```bash
# User: "Push my changes"
# AI: Detects database changes
# AI: Runs: pnpm run validate:migrations
# Result: ✗ Dangerous operations found
# AI: STOPS and reports issue
# AI: Suggests how to fix
# User: Fixes migration
# AI: Re-validates
# Result: ✓ All checks passed
# AI: Proceeds with push
```

---

## ✅ Benefits

### 1. **Automatic Protection**
- No need to remember safety checks
- AI enforces safety rules automatically

### 2. **Prevents Accidents**
- Catches dangerous operations before push
- Blocks deployment of unsafe migrations

### 3. **Clear Feedback**
- Shows exactly what's wrong
- Suggests how to fix issues

### 4. **Backup Verification**
- Ensures backups exist before deployment
- Warns about outdated backups

### 5. **Production Safety**
- Only additive migrations allowed
- Production data always protected

---

## 🎯 Quick Reference

### Before Pushing Database Changes

```bash
# Option 1: Let AI handle it automatically (recommended)
# Just push normally, AI will run checks

# Option 2: Run checks manually first
pnpm run pre-push:safety

# Option 3: Individual checks
pnpm run db:check-safety      # Check database environment
pnpm run validate:migrations  # Validate migrations
pnpm run build                # Verify build
```

### If Validation Fails

```bash
# 1. Check what's wrong
pnpm run validate:migrations

# 2. Fix migrations
# Edit prisma/migrations/[NAME]/migration.sql

# 3. Re-validate
pnpm run validate:migrations

# 4. Create backup if needed
pnpm run backup:production

# 5. Push when all checks pass
git push origin main
```

---

## 🔒 Safety Guarantees

With these checks in place:

✅ **No destructive migrations** can be pushed
✅ **Production data** is always protected
✅ **Backups** are verified before deployment
✅ **Only additive changes** are allowed
✅ **Clear errors** help fix issues quickly

---

## 📚 Related Documentation

- **Database Safety Rules**: `CURSOR_DATABASE_SAFETY_RULE.md`
- **Migration Guide**: `DATABASE_MIGRATION_EXPLAINED.md`
- **Production Migration**: `PRODUCTION_MIGRATION_GUIDE.md`

---

## 🎉 Summary

You now have **automatic protection** against unsafe database changes:

1. ✅ AI automatically detects database changes
2. ✅ AI runs safety checks before push
3. ✅ Validation script checks all migrations
4. ✅ Backup verification ensures recovery possible
5. ✅ Push blocked if any check fails

**Your production database is now automatically protected!** 🛡️

---

_Last Updated: January 2025_
