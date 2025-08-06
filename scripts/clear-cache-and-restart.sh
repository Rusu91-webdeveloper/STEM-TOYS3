#!/bin/bash

echo "🧹 Clearing cache and restarting application..."

# Stop any running development server
echo "🛑 Stopping development server..."
pkill -f "next dev" || true
pkill -f "pnpm dev" || true

# Clear Next.js cache
echo "🗑️  Clearing Next.js cache..."
rm -rf .next

# Clear node_modules cache (optional, uncomment if needed)
# echo "🗑️  Clearing node_modules cache..."
# rm -rf node_modules/.cache

# Clear any temporary files
echo "🧽 Clearing temporary files..."
find . -name "*.tmp" -delete
find . -name "*.log" -delete

# Clear Prisma cache
echo "🗄️  Clearing Prisma cache..."
npx prisma generate

# Restart the development server
echo "🚀 Starting development server..."
pnpm dev 