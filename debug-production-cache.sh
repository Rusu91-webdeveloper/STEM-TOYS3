#!/bin/bash

# Debug script for production cache issues
# Usage: ./debug-production-cache.sh <your-production-url>

PROD_URL="${1:-https://your-production-domain.com}"

echo "🔍 Debugging Production Cache Issues"
echo "====================================="
echo ""

# 1. Check API endpoint directly
echo "1️⃣ Checking API endpoint /api/products directly..."
echo "URL: $PROD_URL/api/products?featured=false&sort=created&limit=20"
echo ""
curl -s "$PROD_URL/api/products?featured=false&sort=created&limit=20" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\nX-Cache Header: %{header_x-cache}\nCache-Control: %{header_cache-control}\n" \
  | jq '.products[] | {id, name, createdAt, status: .status // "N/A"}' 2>/dev/null || echo "Failed to parse JSON"

echo ""
echo "---"
echo ""

# 2. Check what the database has
echo "2️⃣ What's in your database (from /admin/products perspective)?"
echo "You should manually check /admin/products page to see what's really in DB"
echo ""

# 3. Check cache headers
echo "3️⃣ Checking cache headers on /products page..."
curl -I "$PROD_URL/products" 2>/dev/null | grep -i "cache\|age\|x-cache"
echo ""

# 4. Try with cache-busting
echo "4️⃣ Testing with cache-busting parameter..."
TIMESTAMP=$(date +%s)
curl -s "$PROD_URL/api/products?featured=false&sort=created&limit=5&_t=$TIMESTAMP" \
  -H "Cache-Control: no-cache" \
  | jq '.products[] | .name' 2>/dev/null || echo "Failed to parse"
echo ""

echo "---"
echo ""
echo "💡 Key Information:"
echo "- If X-Cache shows 'HIT', the API is serving cached data"
echo "- If X-Cache shows 'MISS', the API fetched fresh data"
echo "- Compare API results with what you see in /admin/products"
echo ""
echo "🔧 Next Steps:"
echo "1. Check if deployment finished (verify commit hash in production)"
echo "2. Clear Redis cache using the flush endpoint"
echo "3. Check if there's a CDN cache layer"

