#!/bin/bash

# Script to start Prisma Studio with proper DATABASE_URL
# This solves the issue where Prisma Studio doesn't load .env.local properly

echo "🚀 Starting Prisma Studio with explicit environment variables..."

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
    echo "✅ Loaded environment variables from .env.local"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Verify the environment variable is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

echo "✅ DATABASE_URL is properly configured"
echo "📍 Prisma Studio will be available at: http://localhost:5555"
echo "🔧 Press Ctrl+C to stop Prisma Studio"

# Start Prisma Studio with explicit environment variables
NODE_ENV=development DATABASE_URL="$DATABASE_URL" npx prisma studio 