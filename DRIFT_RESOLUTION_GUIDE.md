# 🔧 Resolving Migration Drift - Step by Step

## What Happened

Prisma detected that your **database schema doesn't match your migration
history**. This means:

- Your database has tables/columns that aren't in migration files
- This likely happened from using `prisma db push` or manual SQL changes
- Prisma needs to sync the migration history with the actual database

## ✅ Solution: Create Baseline Migration

We'll create a **baseline migration** that captures the current database state,
then add your new changes.

---

## Step 1: Create Baseline Migration

This captures everything currently in your database:

```bash
# Ensure local database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# Create baseline migration from current database state
npx prisma migrate diff \
  --from-empty \
  --to-url $DATABASE_URL \
  --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_baseline/migration.sql
```

**OR use the simpler approach:**

```bash
# Create baseline migration
npx prisma migrate dev --name baseline_capture_current_state --create-only
```

This creates a migration file but doesn't apply it (since it's already in the
database).

---

## Step 2: Mark Baseline as Applied

Since the database already has all these changes, we mark the migration as
applied:

```bash
# Mark the baseline migration as applied (without running it)
npx prisma migrate resolve --applied baseline_capture_current_state
```

**OR if you created the migration file manually:**

```bash
# Find the migration folder name
ls -lt prisma/migrations/ | head -5

# Mark it as applied (replace TIMESTAMP with actual timestamp)
npx prisma migrate resolve --applied $(ls -t prisma/migrations/ | head -1 | cut -d'_' -f1-2)
```

---

## Step 3: Verify Drift is Resolved

```bash
# Check migration status
npx prisma migrate status

# Should show: "Database schema is up to date!"
```

---

## Step 4: Create Your New Migration

Now you can create the migration for blog fields and A/B testing:

```bash
# Create migration for your new changes
npx prisma migrate dev --name add_blog_fields_and_ab_testing
```

This should now work without drift errors!

---

## Alternative: Simpler Approach (Recommended for Local Dev)

If you're okay with resetting your local database (you can reseed it):

```bash
# 1. Backup any important local data first (if needed)
# 2. Reset and sync
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

npx prisma migrate reset --force
npx prisma db push --accept-data-loss

# 3. Create baseline migration
npx prisma migrate dev --name baseline_all_current_schema

# 4. Now create your new migration
npx prisma migrate dev --name add_blog_fields_and_ab_testing

# 5. Reseed if needed
pnpm run seed
```

---

## 🎯 Recommended: Use `prisma migrate diff` Approach

This is the safest way to create a baseline:

```bash
# Step 1: Create baseline migration folder
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_baseline

# Step 2: Generate SQL from current database
npx prisma migrate diff \
  --from-empty \
  --to-url $DATABASE_URL \
  --script > prisma/migrations/$(ls -t prisma/migrations/ | grep baseline | head -1)/migration.sql

# Step 3: Mark as applied
npx prisma migrate resolve --applied $(ls -t prisma/migrations/ | grep baseline | head -1 | cut -d'_' -f1-2)

# Step 4: Verify
npx prisma migrate status

# Step 5: Create your new migration
npx prisma migrate dev --name add_blog_fields_and_ab_testing
```

---

## ⚠️ Important Notes

1. **This is for LOCAL development only** - Never do this on production!
2. **Baseline migration** captures current state - it's a snapshot
3. **After baseline**, all future changes should use `migrate dev`
4. **Production** should never have drift - always use migrations

---

## 🚀 Quick Fix (If You Just Want to Move Forward)

If you want the fastest solution and don't mind resetting local data:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"

# Nuclear option - clean slate
npx prisma migrate reset --force --skip-seed
npx prisma db push --accept-data-loss
npx prisma migrate dev --name baseline_all_schema
npx prisma migrate dev --name add_blog_fields_and_ab_testing
pnpm run seed
```

This will:

1. Reset database
2. Push current schema (creates all tables)
3. Create baseline migration
4. Create your new migration
5. Seed with test data

---

## 📋 After Resolving Drift

Once drift is resolved, you can:

1. ✅ Create new migrations normally
2. ✅ Deploy to production safely
3. ✅ Keep migration history clean

**Remember**: Always use `prisma migrate dev` for schema changes, never
`prisma db push` in production!
