# Phone Number Unification Audit

## Problem
JSON-LD on www.techtots.ro emits **BOTH** phone numbers:
- ❌ +40742552233 (old, should be removed)
- ✅ +40771248029 (canonical, correct)

## Root Cause Analysis

### ✅ Code audit (CLEAN)
All code correctly uses +40771248029 as the default:
- `lib/config/app-config.ts` → defaults to +40771248029
- `lib/seo/advanced-schema.ts` → uses `appConfig.storePhone`
- `lib/seo/local-seo-romania.ts` → uses `appConfig.storePhone`
- `app/metadata.ts` → uses `appConfig.storePhone`
- `app/contact/metadata.ts` → uses `appConfig.storePhone`
- `app/about/metadata.ts` → uses `appConfig.storePhone`
- `app/HomePageClient.tsx` → uses `publicConfig.storePhone`
- `app/contact/page.tsx` → uses `publicConfig.storePhoneFormatted`
- `features/checkout/components/GuestOrderTracking.tsx` → hardcoded fallback to +40771248029

**No instances of +40742552233 found in codebase.**

### ⚠️ Production Environment Check Required

The old phone number must be coming from:

#### 1. Environment Variables
Check production environment for these variables:
```bash
FANCOURIER_SENDER_PHONE=+40742552233  # ← If this exists, update to +40771248029
NEXT_PUBLIC_STORE_PHONE=+40742552233  # ← If this exists, update to +40771248029
```

#### 2. Database `storeSettings` Table
Check the database:
```sql
SELECT "contactPhone" FROM "storeSettings" WHERE id = 1;
```

If it returns +40742552233, update it:
```sql
UPDATE "storeSettings" 
SET "contactPhone" = '+40771248029' 
WHERE id = 1;
```

#### 3. Cache / CDN
After fixing env vars or database:
- Clear Next.js cache: Delete `.next/` directory and rebuild
- Clear Vercel edge cache (if deployed on Vercel)
- Wait for CDN cache expiration or manually purge

## Verification Steps

### On Production:

1. **Check Environment Variables**
   ```bash
   # SSH into production or check hosting dashboard
   echo $FANCOURIER_SENDER_PHONE
   echo $NEXT_PUBLIC_STORE_PHONE
   ```

2. **Check Database**
   ```bash
   # Connect to production database
   psql $DATABASE_URL -c "SELECT * FROM \"storeSettings\" LIMIT 1;"
   ```

3. **Check Live Site JSON-LD**
   ```bash
   curl https://www.techtots.ro | grep -o '+40[0-9]\{9\}' | sort -u
   ```
   Should only return: `+40771248029`

4. **Check API Response**
   ```bash
   curl https://www.techtots.ro/api/store-settings | jq '.contactPhone'
   ```
   Should return: `"+40771248029"`

## Action Items

- [ ] Verify production environment variables
- [ ] Verify database `storeSettings.contactPhone`
- [ ] Update any incorrect values to +40771248029
- [ ] Clear application cache
- [ ] Clear CDN cache
- [ ] Verify live site only shows +40771248029

## Canonical Phone Number
**+40771248029** (Emanuel's locked canonical public contact)

## Email (already unified, keep as-is)
**info@techtots.ro** ✅
