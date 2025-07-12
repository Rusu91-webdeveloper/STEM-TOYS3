# Products Page Production Fix Checklist

## Issue Summary

The `/products` page doesn't show products in production, while categories and
blogs work correctly. This indicates the database connection works but there's
an issue with API URL construction in production.

## Root Cause

The API calls from the products page are failing because the production
environment variables for constructing API URLs are not properly configured.

## Fix Applied

1. **Improved API URL Construction**: Created a centralized utility function
   (`lib/utils/api-url.ts`) that handles URL construction for all environments
   with proper fallbacks.

2. **Enhanced Error Logging**: Added detailed error messages and environment
   variable debugging to help identify issues in production.

3. **Updated API Functions**: Modified `lib/api/products.ts` and
   `lib/api/books.ts` to use the new utility function.

## Required Environment Variables in Vercel

You must set at least ONE of these environment variables in your Vercel project
settings:

### Option 1: NEXTAUTH_URL (Recommended)

```
NEXTAUTH_URL=https://your-domain.vercel.app
```

or if using custom domain:

```
NEXTAUTH_URL=https://www.yourdomain.com
```

### Option 2: NEXT_PUBLIC_SITE_URL

```
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Option 3: Let Vercel Auto-detect (Fallback)

If neither of the above is set, the code will use `VERCEL_URL` which is
automatically set by Vercel, but this may not work reliably for all deployment
types.

## Steps to Deploy

1. **Set Environment Variables in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add `NEXTAUTH_URL` with your production URL
   - Make sure all other required variables from `env.example` are set
     (DATABASE_URL, etc.)

2. **Verify Other Required Variables**:

   ```
   DATABASE_URL=your-production-database-url
   NEXTAUTH_SECRET=your-secure-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. **Redeploy**:

   ```bash
   vercel --prod
   ```

   or push to your main branch if you have automatic deployments enabled.

4. **Verify the Fix**:
   - Visit `/products` - should show all products
   - Check browser console for any errors
   - Test category filtering
   - Verify individual product pages work

## Debugging in Production

If issues persist after deployment, check the Vercel Functions logs:

1. Go to Vercel Dashboard → Functions tab
2. Look for logs from `/api/products` and `/api/books`
3. Check for URL construction logs that show which environment variable is being
   used

## Code Changes Summary

1. **New File**: `lib/utils/api-url.ts` - Centralized API URL construction
2. **Updated**: `lib/api/products.ts` - Uses new URL utility
3. **Updated**: `lib/api/books.ts` - Uses new URL utility
4. **Updated**: `app/products/page.tsx` - Better error handling and debugging

## Fallback Behavior

The URL construction now follows this priority:

1. `NEXTAUTH_URL` (if set)
2. `NEXT_PUBLIC_SITE_URL` (if set)
3. `https://${VERCEL_URL}` (automatically set by Vercel)
4. Hardcoded production URL (last resort)
5. `http://localhost:3000` (development only)

This ensures the app will work even if environment variables are misconfigured,
though setting them properly is strongly recommended.
