#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
    echo "✅ Loaded environment variables from .env.local"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.local"
    exit 1
fi

echo "🚀 Starting Prisma Studio with DATABASE_URL from .env.local"
echo "📍 Prisma Studio will be available at: http://localhost:5555"

# Start Prisma Studio with explicit environment variables
NODE_ENV=development DATABASE_URL="$DATABASE_URL" npx prisma studio 