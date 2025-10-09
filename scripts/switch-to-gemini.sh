#!/bin/bash

# Script to switch AI provider from OpenAI to Gemini
# This fixes the OpenAI API authentication errors

echo "🔄 Switching AI provider from OpenAI to Gemini..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Backup .env.local
cp .env.local .env.local.backup
echo "✅ Created backup: .env.local.backup"

# Update AI provider settings
sed -i.tmp 's/^AI_PRIMARY_PROVIDER=.*/AI_PRIMARY_PROVIDER=gemini/' .env.local
sed -i.tmp 's/^AI_SECONDARY_PROVIDER=.*/AI_SECONDARY_PROVIDER=gemini/' .env.local
sed -i.tmp 's/^AI_PRIMARY_MODEL=.*/AI_PRIMARY_MODEL=gemini-1.5-flash/' .env.local
sed -i.tmp 's/^AI_SECONDARY_MODEL=.*/AI_SECONDARY_MODEL=gemini-1.5-pro/' .env.local

# Clean up temp files
rm -f .env.local.tmp

echo "✅ Updated .env.local with Gemini configuration"
echo ""
echo "📋 Changes made:"
echo "   - AI_PRIMARY_PROVIDER: openai → gemini"
echo "   - AI_SECONDARY_PROVIDER: openai → gemini"
echo "   - AI_PRIMARY_MODEL: gpt-4o-mini → gemini-1.5-flash"
echo "   - AI_SECONDARY_MODEL: gpt-4o-mini → gemini-1.5-pro"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your Next.js server (Ctrl+C then 'pnpm run dev')"
echo "   2. Try uploading products with AI enhancement enabled"
echo "   3. Check Inngest dashboard: http://localhost:8288"
echo ""
echo "✨ Gemini is FREE and has generous rate limits!"
echo ""

