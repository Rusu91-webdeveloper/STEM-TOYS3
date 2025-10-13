# Production Cache Fix - Products Not Showing

## 🔍 Problem Diagnosis

**Issue**: Production `/products` page shows only books and displays "Coding
Robot for beginners" (which doesn't exist in production database). The 3
APPROVED products (LEGO Mindstorms, Arduino Starter Kit, Snap Circuits) don't
appear on the products page, even though they're:

- ✅ Visible in `/admin/products`
- ✅ Accessible via direct slug URLs
  (`/products/lego-mindstorms-robot-inventor`)
- ✅ Properly configured in database (status: APPROVED, isActive: true)

**Root Cause**: Multiple layers of stale cache serving outdated product data:

1. **Next.js ISR Cache** (5-minute revalidation)
2. **Application Redis/Memory Cache** (2-minute duration)
3. **CDN/Edge Cache** (if using Vercel/Railway)

## ✅ Fixes Applied

### 1. Created Cache Revalidation Endpoint

**File**: `app/api/revalidate/products/route.ts`

This endpoint allows manual cache clearing:

```bash
curl -X POST "https://your-domain.com/api/revalidate/products?secret=YOUR_SECRET"
```

Features:

- Clears Next.js ISR cache for `/products` page
- Invalidates cache tags (`products`, `books`)
- Clears Redis/memory cache patterns
- Protected with secret token

### 2. Created Cache Debugging Endpoint

**File**: `app/api/debug/cache-status/route.ts`

Provides diagnostic information:

```bash
curl "https://your-domain.com/api/debug/cache-status?secret=YOUR_DEBUG_SECRET"
```

Shows:

- Products count by status (APPROVED, PENDING, etc.)
- Recent products added (last 24h)
- Category information
- Cache configuration
- Actionable recommendations

### 3. Temporarily Forced Dynamic Rendering

**File**: `app/products/page.tsx` (Line 34)

Changed from:

```typescript
export const revalidate = 300; // ISR with 5-minute cache
```

To:

```typescript
export const dynamic = "force-dynamic"; // No caching
export const revalidate = 0;
```

**⚠️ Important**: This is temporary to immediately fix the issue. After cache is
stable, revert to ISR for better performance.

### 4. Reduced API Cache Duration

**File**: `app/api/products/route.ts` (Line 24-28)

Reduced cache times:

- Featured products: 1 hour → 30 minutes
- Category products: 30 minutes → 1 minute
- Search results: 2 minutes → 30 seconds
- General listing: 2 minutes → 30 seconds

### 5. Created Production Cache Clear Script

**File**: `scripts/clear-production-cache.sh`

Automated script to clear all caches in production.

## 🚀 Deployment Steps

### Step 1: Set Environment Variables

Add these to your production environment (Vercel/Railway/etc.):

```bash
# Required for cache revalidation
REVALIDATION_SECRET=your-secure-random-token-here

# Optional for debugging (remove in final production)
DEBUG_SECRET=your-debug-token-here
```

Generate secure tokens:

```bash
# On Mac/Linux
openssl rand -base64 32
```

### Step 2: Deploy Changes

```bash
# Commit the changes
git add .
git commit -m "fix: implement cache clearing and force dynamic rendering for products page"

# Push to production
git push origin main
```

### Step 3: Clear Production Cache

After deployment, run the cache clear script:

```bash
# Set environment variables
export PRODUCTION_URL="https://your-domain.com"
export REVALIDATION_SECRET="your-secret-from-step-1"
export DEBUG_SECRET="your-debug-secret"  # Optional

# Run the script
./scripts/clear-production-cache.sh
```

Or manually:

```bash
curl -X POST "https://your-domain.com/api/revalidate/products?secret=YOUR_SECRET"
```

### Step 4: Verify Fix

1. **Check Debug Endpoint**:

   ```bash
   curl "https://your-domain.com/api/debug/cache-status?secret=YOUR_DEBUG_SECRET"
   ```

   Verify:
   - `products.approved` should be 3
   - All 3 products should appear in `approvedProducts` array

2. **Check API Response**:

   ```bash
   curl "https://your-domain.com/api/products?featured=false&limit=20"
   ```

   Verify:
   - Response includes all 3 products
   - "Coding Robot for beginners" is NOT present

3. **Check Products Page**:
   - Open `https://your-domain.com/products`
   - Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
   - Verify all 3 products are visible
   - Verify "Coding Robot for beginners" is NOT visible

### Step 5: Clear CDN Cache (if applicable)

**For Vercel**:

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to "Data Cache" section
4. Click "Purge Everything"

**For Railway**:

- No CDN cache to clear (Railway doesn't have built-in CDN)

## 🔄 Reverting to ISR (After Cache is Stable)

Once the cache is working properly (wait 24-48 hours), revert to ISR for better
performance:

**File**: `app/products/page.tsx`

Change back to:

```typescript
// 🚀 PERFORMANCE: Use ISR for better caching
export const revalidate = 60; // Revalidate every 1 minute (conservative)
```

Remove the force-dynamic line.

## 📊 Monitoring

### Check Cache Status Regularly

```bash
# Check what's in production cache
curl "https://your-domain.com/api/debug/cache-status?secret=$DEBUG_SECRET" | jq '.'
```

### Monitor for Stale Cache

Signs of stale cache:

- Products not appearing after approval
- Old product data showing
- New products not visible for > 5 minutes

Action: Run cache clear script

## 🔧 Permanent Solution

For long-term cache management, implement:

### 1. Automatic Cache Invalidation on Product Updates

**File**: `app/api/admin/products/[id]/route.ts`

Add after product update:

```typescript
import { revalidatePath, revalidateTag } from "next/cache";

// After updating product
await db.product.update({ ... });

// Clear cache
revalidatePath("/products");
revalidateTag("products");
```

### 2. Webhook for Cache Clearing

Create webhook endpoint that external systems can call when products change.

### 3. Scheduled Cache Clearing

Use a cron job or scheduled task to clear cache periodically:

```bash
# Every 5 minutes
*/5 * * * * curl -X POST "https://your-domain.com/api/revalidate/products?secret=$SECRET"
```

## 🐛 Troubleshooting

### Products Still Not Showing?

1. **Check Database**:

   ```sql
   SELECT id, name, status, "isActive", "createdAt"
   FROM "Product"
   WHERE status = 'APPROVED' AND "isActive" = true;
   ```

2. **Check Categories**:

   ```sql
   SELECT p.id, p.name, c.name as category, p."stemDiscipline"
   FROM "Product" p
   LEFT JOIN "Category" c ON p."categoryId" = c.id
   WHERE p.status = 'APPROVED' AND p."isActive" = true;
   ```

3. **Check API Directly**:

   ```bash
   curl "https://your-domain.com/api/products" | jq '.products[].name'
   ```

4. **Check Logs**:
   - Look for database query errors
   - Check for cache-related warnings
   - Verify environment variables are set

### "Coding Robot for beginners" Still Appears?

This product only exists in your local database. If it appears in production:

1. Check you're viewing the correct environment
2. Clear browser cache completely
3. Use incognito mode to verify
4. Run the cache clear script again

### Performance Issues After Force Dynamic?

The `force-dynamic` flag disables all caching, which may impact performance:

1. Monitor response times
2. If acceptable, keep it
3. If too slow, revert to ISR with shorter revalidation (30-60 seconds)

## 📝 Environment Variables Reference

Add to your production environment:

```bash
# Required for production
REVALIDATION_SECRET=<generate-secure-token>

# Optional for debugging (remove after stable)
DEBUG_SECRET=<generate-secure-token>

# Existing variables (verify they're set)
DATABASE_URL=<your-production-database-url>
REDIS_URL=<your-redis-url>  # If using Redis
REDIS_TOKEN=<your-redis-token>  # If using Redis
```

## ✅ Success Criteria

Your fix is successful when:

1. ✅ All 3 APPROVED products visible on `/products` page
2. ✅ "Coding Robot for beginners" does NOT appear in production
3. ✅ Books continue to display correctly
4. ✅ Product detail pages load correctly
5. ✅ Admin panel shows correct products
6. ✅ Cache can be cleared on-demand via API
7. ✅ Page load time is acceptable (< 3 seconds)

## 📞 Support

If issues persist after following this guide:

1. Check production logs for errors
2. Run the debug endpoint and save the output
3. Verify all environment variables are set
4. Consider reaching out with the debug output

---

**Last Updated**: 2025-10-13 **Status**: ✅ Fixes Applied - Awaiting Deployment
