# 🚨 Production Migration Fix - URGENT

## Problem

The production deployment is failing because:

1. **`ABTest` table doesn't exist** in production database
2. **`Blog.viralScore` column doesn't exist** in production database

The migration was created locally and committed, but **Vercel is not applying
it** during the build.

## Root Cause

Vercel's build command runs:

```bash
prisma generate && next build
```

But it's **missing** `prisma migrate deploy` which applies pending migrations to
the production database.

## Solution

### Option 1: Update Vercel Build Command (Recommended)

In your Vercel dashboard:

1. Go to **Project Settings** → **Build & Development Settings**
2. Update **Build Command** to:
   ```bash
   pnpm install autoprefixer postcss tailwindcss && prisma generate && prisma migrate deploy && next build
   ```
3. Save and redeploy

### Option 2: Use Production Build Script

I've added a `build:production` script to `package.json`. Configure Vercel to
use it:

**Build Command:**

```bash
pnpm run build:production
```

### Option 3: Manual Migration (Quick Fix)

If you need to fix this immediately:

```bash
# Connect to production database
export DATABASE_URL="your_production_database_url"

# Apply migrations manually
npx prisma migrate deploy
```

Then redeploy (the build should succeed).

## Verification

After applying the fix, check Vercel build logs for:

```
✓ Migration applied successfully
```

The build should then succeed and the application should work.

## Next Steps

1. ✅ Update Vercel build command (Option 1 or 2)
2. ✅ Redeploy
3. ✅ Verify build succeeds
4. ✅ Test production site

---

**Status**: Migration file exists and is committed, just needs to be applied to
production database.
