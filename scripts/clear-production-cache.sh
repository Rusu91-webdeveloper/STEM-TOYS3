#!/bin/bash

# Production Cache Clear Script
# This script helps clear all caches in production to fix stale data issues

echo "🚀 Production Cache Clear Script"
echo "================================="
echo ""

# Check if PRODUCTION_URL is set
if [ -z "$PRODUCTION_URL" ]; then
  echo "⚠️  PRODUCTION_URL environment variable not set"
  echo "Please set it first: export PRODUCTION_URL=https://your-domain.com"
  exit 1
fi

# Check if REVALIDATION_SECRET is set
if [ -z "$REVALIDATION_SECRET" ]; then
  echo "⚠️  REVALIDATION_SECRET environment variable not set"
  echo "Please set it first: export REVALIDATION_SECRET=your-secret-token"
  exit 1
fi

echo "📍 Production URL: $PRODUCTION_URL"
echo "🔐 Secret: ${REVALIDATION_SECRET:0:4}****"
echo ""

# Step 1: Clear Next.js ISR cache via revalidation endpoint
echo "1️⃣  Clearing Next.js ISR cache..."
REVALIDATE_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/revalidate/products?secret=$REVALIDATION_SECRET")
REVALIDATE_SUCCESS=$(echo "$REVALIDATE_RESPONSE" | grep -o '"success":true')

if [ -n "$REVALIDATE_SUCCESS" ]; then
  echo "✅ Next.js cache cleared successfully"
else
  echo "❌ Failed to clear Next.js cache"
  echo "Response: $REVALIDATE_RESPONSE"
fi
echo ""

# Step 2: Check cache status
echo "2️⃣  Checking current cache status..."
if [ -n "$DEBUG_SECRET" ]; then
  CACHE_STATUS=$(curl -s "$PRODUCTION_URL/api/debug/cache-status?secret=$DEBUG_SECRET")
  echo "$CACHE_STATUS" | jq '.' 2>/dev/null || echo "$CACHE_STATUS"
else
  echo "⚠️  DEBUG_SECRET not set, skipping cache status check"
  echo "Set it with: export DEBUG_SECRET=your-debug-secret"
fi
echo ""

# Step 3: Verify products are visible
echo "3️⃣  Verifying products are visible..."
PRODUCTS_RESPONSE=$(curl -s "$PRODUCTION_URL/api/products?featured=false&limit=10")
PRODUCTS_COUNT=$(echo "$PRODUCTS_RESPONSE" | grep -o '"itemsCount":[0-9]*' | grep -o '[0-9]*')

if [ -n "$PRODUCTS_COUNT" ]; then
  echo "✅ Found $PRODUCTS_COUNT products in API response"
else
  echo "❌ Could not determine product count"
  echo "Response preview: $(echo "$PRODUCTS_RESPONSE" | head -c 200)"
fi
echo ""

# Step 4: Instructions for manual verification
echo "4️⃣  Manual verification steps:"
echo "   1. Open $PRODUCTION_URL/products in your browser"
echo "   2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)"
echo "   3. Verify all 3 products are visible"
echo "   4. Check that 'Coding Robot for beginners' is NOT visible"
echo ""

# Step 5: CDN Cache (if using Vercel/Railway)
echo "5️⃣  CDN Cache Clearing:"
echo "   If using Vercel:"
echo "     - Go to your Vercel dashboard"
echo "     - Navigate to your project"
echo "     - Go to 'Data Cache' section"
echo "     - Click 'Purge Everything'"
echo ""
echo "   If using Railway:"
echo "     - Railway doesn't have a built-in CDN cache"
echo "     - The revalidation above should be sufficient"
echo ""

echo "✅ Cache clear process completed!"
echo ""
echo "⚠️  If products still don't appear:"
echo "   1. Check production logs for errors"
echo "   2. Verify database contains APPROVED products"
echo "   3. Run: curl $PRODUCTION_URL/api/debug/cache-status?secret=\$DEBUG_SECRET"
echo "   4. Redeploy the application with latest code"
echo ""

