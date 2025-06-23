#!/bin/bash

echo "🚀 Quick Start - Fixing common startup issues"
echo "============================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local file..."
  node scripts/setup-env.js
else
  echo "✅ .env.local already exists"
fi

# Check if NEXTAUTH_SECRET is set and valid
if grep -q "NEXTAUTH_SECRET" .env.local; then
  SECRET_LENGTH=$(grep "NEXTAUTH_SECRET" .env.local | cut -d'"' -f2 | wc -c)
  if [ $SECRET_LENGTH -lt 32 ]; then
    echo "⚠️  NEXTAUTH_SECRET is too short, generating a new one..."
    # Generate a new secret
    NEW_SECRET=$(openssl rand -base64 32)
    # Update the .env.local file
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$NEW_SECRET\"/" .env.local
    else
      # Linux
      sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$NEW_SECRET\"/" .env.local
    fi
    echo "✅ Updated NEXTAUTH_SECRET"
  else
    echo "✅ NEXTAUTH_SECRET is valid"
  fi
else
  echo "⚠️  NEXTAUTH_SECRET not found, adding it..."
  NEW_SECRET=$(openssl rand -base64 32)
  echo "NEXTAUTH_SECRET=\"$NEW_SECRET\"" >> .env.local
  echo "✅ Added NEXTAUTH_SECRET"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed"
fi

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next

# Check Prisma
echo "🔧 Checking Prisma setup..."
npx prisma generate

echo ""
echo "✨ Setup complete! You can now run:"
echo "   npm run dev"
echo ""
echo "⚠️  If you still see errors:"
echo "   1. Check your database connection in .env.local"
echo "   2. Run 'npm run check:auth' to diagnose auth issues"
echo "   3. Check the logs above for any warnings" 