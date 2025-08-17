# Troubleshooting Guide

## Overview

This guide provides solutions for common issues encountered while developing,
testing, and deploying the STEM Toys e-commerce platform. Issues are organized
by category for quick reference.

## Quick Diagnosis

### System Health Check

Run this quick diagnostic script to identify common issues:

```bash
#!/bin/bash
# Quick health check script

echo "🔍 STEM Toys Platform Health Check"
echo "=================================="

# Check Node.js version
echo "Node.js version: $(node --version)"

# Check npm version
echo "npm version: $(npm --version)"

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo "✅ .env.local file exists"
else
  echo "❌ .env.local file missing"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo "✅ node_modules directory exists"
else
  echo "❌ node_modules directory missing - run 'npm install'"
fi

echo "=================================="
echo "Health check complete!"
```

## Development Environment Issues

### Node.js and npm Problems

#### Issue: Wrong Node.js Version

```bash
# Error: Node.js version is not supported
# Solution: Install correct Node.js version
nvm install 18
nvm use 18
```

#### Issue: npm Install Fails

```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables

#### Issue: Missing Environment Variables

```bash
# Check if .env.local exists
ls -la .env*

# Copy from template if missing
cp .env.example .env.local
```

### Database Issues

#### Issue: Database Connection Failed

```bash
# Test direct database connection
psql $DATABASE_URL

# Check if PostgreSQL is running
brew services list | grep postgresql
brew services start postgresql
```

#### Issue: Prisma Migration Errors

```bash
# Reset migrations (development only!)
npx prisma migrate reset

# Force push schema changes (development only!)
npx prisma db push --force-reset
```

## Build and Development Issues

### Next.js Build Problems

#### Issue: TypeScript Compilation Errors

```bash
# Check specific errors
npm run type-check

# Clear Next.js cache
rm -rf .next
```

#### Issue: Module Resolution Errors

```bash
# Clear module cache
rm -rf node_modules/.cache
rm -rf .next

# Restart development server
npm run dev
```

### Authentication Issues

#### Issue: NextAuth Session Not Working

```bash
# Check NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET

# Verify NEXTAUTH_URL matches your domain
# Local: http://localhost:3000
# Production: https://your-domain.com
```

## Testing Issues

### Unit Test Problems

#### Issue: Jest Configuration Errors

```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm run test -- --verbose
```

### E2E Test Problems

#### Issue: Playwright Tests Failing

```bash
# Install browsers
npx playwright install

# Run in headed mode for debugging
npx playwright test --headed
```

## Production Issues

### Deployment Failures

#### Issue: Vercel Build Failing

```bash
# Check build logs in Vercel dashboard
# Build locally to test
npm run build
```

#### Issue: Database Connection in Production

```bash
# Check DATABASE_URL format
# Should include SSL for production:
# postgresql://user:pass@host:5432/db?sslmode=require
```

## Common Error Messages

### "Module not found" Errors

```bash
# Check import paths
# Use absolute imports with @/ prefix

# Clear module cache
rm -rf node_modules/.cache
rm -rf .next
npm install
```

### "Hydration failed" Errors

```bash
# Common causes:
# 1. Server/client render mismatch
# 2. Using browser APIs during SSR

# Solutions:
# Use useEffect for client-only code
useEffect(() => {
  // Client-only code here
}, [])
```

## Useful Commands Reference

### Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run type-check       # Check TypeScript errors
npm run lint             # Run linting
npm run test             # Run tests
```

### Database

```bash
npx prisma studio        # Open database GUI
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Create and apply migration
```

### Cache Clearing

```bash
rm -rf .next                     # Clear Next.js cache
rm -rf node_modules/.cache       # Clear module cache
npm cache clean --force          # Clear npm cache
```

Remember: When in doubt, restart your development server and clear caches. Many
issues are resolved by a fresh start!
