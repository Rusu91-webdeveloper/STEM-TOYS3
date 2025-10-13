# 🔒 DATABASE SAFETY RULE FOR CURSOR AI

**Copy this entire rule and paste it into your Cursor Settings → Rules for AI**

---

## 🚨 CRITICAL DATABASE SAFETY PROTOCOL

**This rule MUST be followed for ALL database-related operations.**

### 1. BEFORE ANY DATABASE CHANGES

**MANDATORY CHECKS - Execute in this order:**

```bash
# Step 1: ALWAYS run safety check first
pnpm run db:check-safety

# Step 2: Verify you're using LOCAL database
echo $DATABASE_URL
# MUST show: postgresql://postgres:postgres@localhost:5432/stemtoys_dev
# If it shows neon.tech, railway.app, or any cloud provider → STOP IMMEDIATELY

# Step 3: Export local database URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
```

**If ANY check fails, DO NOT proceed with database changes!**

---

### 2. ALLOWED DATABASE OPERATIONS

**ONLY these operations are permitted:**

#### ✅ SAFE - Additive Changes Only

- **Adding new columns** (must be nullable or have default value)

  ```prisma
  model User {
    phoneNumber String?  // ✅ SAFE - nullable
    createdAt DateTime @default(now())  // ✅ SAFE - has default
  }
  ```

- **Adding new tables**

  ```prisma
  model Wishlist {  // ✅ SAFE - new table
    id String @id @default(cuid())
    // ... fields
  }
  ```

- **Adding indexes**

  ```prisma
  @@index([email])  // ✅ SAFE - adds index
  ```

- **Adding relations**
  ```prisma
  user User @relation(fields: [userId], references: [id])  // ✅ SAFE
  ```

#### ❌ FORBIDDEN - Destructive Changes

- **Removing columns**

  ```prisma
  // ❌ FORBIDDEN - deletes data
  // phoneNumber String?  // Commented out = DELETION
  ```

- **Removing tables**

  ```prisma
  // ❌ FORBIDDEN - deletes entire table
  // model OldTable { ... }
  ```

- **Making existing columns required without migration strategy**

  ```prisma
  phoneNumber String  // ❌ FORBIDDEN if previously String?
  ```

- **Changing column types without data migration**

  ```prisma
  age String  // ❌ FORBIDDEN if previously Int
  ```

- **Renaming columns without proper migration**
  ```prisma
  fullName String  // ❌ FORBIDDEN if previously 'name' (data loss)
  ```

---

### 3. MIGRATION CREATION PROTOCOL

**When creating Prisma migrations:**

```bash
# STEP 1: Ensure local database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# STEP 2: Run safety check
pnpm run db:check-safety
# MUST show: "✓ Local database detected - Safe to proceed"

# STEP 3: Create migration with descriptive name
npx prisma migrate dev --name add_specific_descriptive_name

# STEP 4: REVIEW THE GENERATED SQL
cat prisma/migrations/latest_migration/migration.sql

# STEP 5: Verify SQL contains ONLY safe operations
# ✅ Look for: ALTER TABLE ... ADD COLUMN
# ✅ Look for: CREATE TABLE
# ✅ Look for: CREATE INDEX
# ❌ REJECT if contains: DROP TABLE
# ❌ REJECT if contains: DROP COLUMN
# ❌ REJECT if contains: ALTER TABLE ... DROP
# ❌ REJECT if contains: DELETE FROM
# ❌ REJECT if contains: TRUNCATE

# STEP 6: Test locally
pnpm run dev
pnpm run test

# STEP 7: Build to verify
pnpm run build
```

**If migration contains forbidden operations, STOP and ask user for
clarification!**

---

### 4. BEFORE DEPLOYING TO PRODUCTION

**Pre-deployment checklist - ALL items required:**

```bash
# ☐ 1. Verify changes tested locally
pnpm run dev  # Application works?
pnpm run test # All tests pass?
pnpm run build # Build successful?

# ☐ 2. Review migration SQL one final time
cat prisma/migrations/*/your_migration_name/migration.sql
# Confirm: NO DROP statements, NO destructive changes

# ☐ 3. BACKUP PRODUCTION DATABASE (CRITICAL!)
pnpm run backup:production
# Wait for: "✓ Backup created: backups/backup_production_TIMESTAMP.sql.gz"

# ☐ 4. Verify migration file is committed to git
git status
# Should show: prisma/migrations/your_migration_name/migration.sql

# ☐ 5. Document the change
git commit -m "feat: descriptive message about database change

Migration: your_migration_name
Changes: List specific tables/columns affected
Safety: Additive only, no data deletion
Tested: Local environment verified"
```

**If ANY item is unchecked, DO NOT deploy!**

---

### 5. PRODUCTION DEPLOYMENT SAFETY

**What happens during deployment:**

```bash
# Automatic process (Vercel/Railway):
# 1. Build application
# 2. Run: npx prisma migrate deploy
# 3. Start application

# What MUST be true:
# ✅ Migration contains ONLY additive changes
# ✅ No DROP TABLE statements
# ✅ No DROP COLUMN statements
# ✅ No data deletion queries
# ✅ Production backup exists

# What will happen to production database:
# ✅ Existing tables remain intact
# ✅ Existing columns remain intact
# ✅ Existing data remains intact
# ✅ New columns added (with NULL or default values)
# ✅ New tables added (empty, ready for data)
# ✅ NOTHING IS DELETED
```

---

### 6. FORBIDDEN ACTIONS

**AI MUST NEVER:**

1. ❌ Run migrations without checking `pnpm run db:check-safety` first
2. ❌ Use production database URL in local development
3. ❌ Create migrations with DROP TABLE or DROP COLUMN
4. ❌ Deploy without backup (`pnpm run backup:production`)
5. ❌ Make columns required without two-step migration strategy
6. ❌ Rename columns without three-step migration strategy
7. ❌ Change column types without explicit data migration plan
8. ❌ Skip testing migrations locally before deploying
9. ❌ Commit migrations without reviewing generated SQL
10. ❌ Use `prisma db push` in production (only in local development)

---

### 7. REQUIRED WORKFLOW FOR DATABASE CHANGES

**Every database change MUST follow this exact workflow:**

```bash
# === LOCAL DEVELOPMENT (SAFE ZONE) ===

# 1. Safety check
pnpm run db:check-safety
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# 2. Edit schema
# File: prisma/schema.prisma
# Make ONLY additive changes

# 3. Create migration
npx prisma migrate dev --name descriptive_name

# 4. Review SQL
cat prisma/migrations/*/descriptive_name/migration.sql
# Verify: ONLY ALTER TABLE...ADD COLUMN or CREATE TABLE

# 5. Test thoroughly
pnpm run dev     # Manual testing
pnpm run test    # Automated tests
pnpm run build   # Production build test

# === PRODUCTION DEPLOYMENT (DANGER ZONE) ===

# 6. Backup production (MANDATORY!)
pnpm run backup:production

# 7. Deploy
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: description"
git push origin main

# 8. Monitor deployment
# Watch for: "Migration applied successfully"

# 9. Verify production
# Test: Login, product viewing, checkout, etc.
```

---

### 8. RISKY OPERATIONS - SPECIAL HANDLING

**If user requests these changes, use special migration strategies:**

#### Making Column Required (Two-Step Process)

```prisma
// WRONG (will fail):
model User {
  phoneNumber String  // ❌ Can't make required if existing rows have NULL
}

// RIGHT (two steps):
// Step 1: Add with default
model User {
  phoneNumber String @default("PENDING")
}
// Deploy, let users update their data

// Step 2: Remove default after data populated
model User {
  phoneNumber String  // Now safe, all rows have values
}
```

#### Renaming Column (Three-Step Process)

```prisma
// WRONG (data loss):
model User {
  // name String?       // ❌ Removing old
  fullName String?      // ❌ New column = lost data
}

// RIGHT (three steps):
// Step 1: Add new column
model User {
  name String?
  fullName String?
}
// Deploy

// Step 2: Copy data
// Run script: UPDATE "User" SET "fullName" = "name"
// Deploy

// Step 3: Remove old column
model User {
  fullName String?
}
// Deploy
```

#### Changing Column Type

```prisma
// WRONG (data loss):
model Product {
  price String  // ❌ Was Int, now String = data corruption
}

// RIGHT (three steps):
// Step 1: Add new column with new type
model Product {
  price Int
  priceNew String?
}

// Step 2: Migrate data
// Run script: UPDATE "Product" SET "priceNew" = CAST("price" AS TEXT)

// Step 3: Remove old, rename new
model Product {
  price String  // Renamed from priceNew
}
```

**For all risky operations:**

1. Ask user to confirm they understand the multi-step process
2. Explain why single-step would cause data loss
3. Implement the safe multi-step approach
4. Test each step locally before deploying

---

### 9. AI RESPONSE PROTOCOL

**When user requests database changes, AI MUST:**

1. **First Response:**

   ```
   🔒 DATABASE SAFETY CHECK REQUIRED

   Before proceeding, I need to verify:
   1. Are you in local development environment? (running db:check-safety)
   2. Is this an additive change (new column/table)?
   3. Is production database backed up?

   Let me run the safety checks first...
   ```

2. **After Safety Check:**

   ```
   ✅ Safety Check Passed: Local database detected

   I will now:
   1. Make additive changes to prisma/schema.prisma
   2. Create migration with descriptive name
   3. Review generated SQL for safety
   4. Test locally

   Production safety guarantee: NO data will be deleted
   ```

3. **Before Deployment:**

   ```
   ⚠️ PRODUCTION DEPLOYMENT CHECKLIST

   Before pushing to production:
   ☐ Migration tested locally ✓
   ☐ Migration SQL reviewed (no DROP statements) ✓
   ☐ Production backup created
   ☐ Build successful ✓

   Shall I create the production backup now?
   ```

4. **If Forbidden Operation Requested:**

   ```
   🚨 DESTRUCTIVE OPERATION DETECTED

   The requested change would DELETE data:
   [Explain what would be deleted]

   Safe alternatives:
   1. [Suggest safe alternative]
   2. [Suggest multi-step migration]

   Do you want to proceed with the safe alternative?
   ```

---

### 10. EMERGENCY ROLLBACK PROCEDURE

**If production deployment causes issues:**

```bash
# IMMEDIATE ACTIONS:

# 1. Restore from backup
ls -lt backups/  # Find latest backup
./scripts/restore-database.sh backups/backup_production_TIMESTAMP.sql.gz production
# Type: RESTORE PRODUCTION

# 2. Revert deployment in Vercel/Railway dashboard

# 3. Fix issue locally
# 4. Re-test thoroughly
# 5. Re-deploy with fix
```

---

### 11. VERIFICATION COMMANDS

**AI should use these to verify safety:**

```bash
# Check current database URL
echo $DATABASE_URL | grep -q "localhost" && echo "✅ LOCAL" || echo "❌ PRODUCTION"

# Check for production indicators
echo $DATABASE_URL | grep -E "(neon\.tech|railway\.app|aws\.com)" && echo "⚠️ PRODUCTION DATABASE!" || echo "✅ Safe"

# Verify migration content
grep -E "(DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM)" prisma/migrations/*/migration.sql && echo "❌ DESTRUCTIVE" || echo "✅ SAFE"

# Count products (verify database has data)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Product\";"

# Test database connection
psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1 && echo "✅ Connected" || echo "❌ Connection failed"
```

---

## 📋 SUMMARY CHECKLIST

**For every database operation, verify ALL items:**

### Pre-Change

- [ ] Ran `pnpm run db:check-safety`
- [ ] Verified DATABASE_URL points to localhost
- [ ] Exported local DATABASE_URL

### During Change

- [ ] Changes are additive only (no deletions)
- [ ] Migration created with descriptive name
- [ ] Migration SQL reviewed (no DROP statements)
- [ ] Tested locally with `pnpm run dev`
- [ ] Tests pass with `pnpm run test`
- [ ] Build succeeds with `pnpm run build`

### Pre-Deployment

- [ ] Production backup created (`pnpm run backup:production`)
- [ ] Migration files committed to git
- [ ] Deployment monitored
- [ ] Production verified after deployment

### Post-Deployment

- [ ] Critical features tested (login, checkout, etc.)
- [ ] No errors in production logs
- [ ] Data integrity verified

---

## 🎯 CORE PRINCIPLE

**THE GOLDEN RULE:**

> When in doubt, ALWAYS ask the user before making destructive changes. ALWAYS
> backup before deploying. ALWAYS test locally first. NEVER delete production
> data.

**Production database changes should ONLY add new things, NEVER remove existing
things.**

---

**End of Database Safety Rule**
