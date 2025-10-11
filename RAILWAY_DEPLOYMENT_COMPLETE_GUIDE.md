# Complete Railway Deployment Guide - From Scratch

**Last Updated:** October 11, 2025 - 04:15 AM  
**Status:** Ready for deployment (TypeScript fixes applied - server.ts)

---

## 📋 Project Analysis Summary

### What We're Deploying:

A **standalone Inngest server** (`inngest-server/`) that runs 5 AI-powered
background jobs:

1. **`generate-blog`** - AI blog generation (90-120s)
2. **`enhance-products`** - Batch product enhancement (60-90s)
3. **`bulk-upload-products`** - Admin bulk uploads with AI
4. **`supplier-bulk-upload-products`** - Supplier bulk uploads with AI
5. **`single-product-enhancement`** - Single product AI enhancement with preview
   (30-60s)

### Why Railway?

- ✅ **No timeout limits** (Vercel Hobby = 60s max, Railway = unlimited)
- ✅ **Handles long-running AI jobs** (up to 5+ minutes)
- ✅ **Simple deployment** from GitHub
- ✅ **Built-in monitoring** and logs
- ✅ **Free tier:** 500 hours/month

---

## 🔍 Project Dependencies Analysis

### Core Dependencies:

```javascript
// inngest-server/server.js imports:
- express (web server)
- inngest (job orchestration)
- dotenv (environment variables)

// Inngest functions import:
- @prisma/client (database access)
- All AI services (OpenAI/Gemini/Anthropic)
- lib/* (utils, db, AI services)
```

### Critical Environment Variables Required:

**Database (MUST HAVE):**

- `DATABASE_URL` - PostgreSQL connection (Neon/Vercel Postgres)
- `DIRECT_URL` - Direct database connection (same as DATABASE_URL for Neon)

**Inngest (MUST HAVE):**

- `INNGEST_EVENT_KEY` - For sending events (starts with `evt_`)
- `INNGEST_SIGNING_KEY` - For webhook verification (starts with `signkey_`)

**AI Services (MUST HAVE at least one):**

- `OPENAI_API_KEY` - For AI enhancements (starts with `sk-`)
- `ANTHROPIC_API_KEY` - Optional alternative (starts with `sk-ant-`)
- `GEMINI_API_KEY` - Optional alternative

**AI Configuration (REQUIRED):**

- `AI_PRIMARY_PROVIDER` - Main AI provider (`openai`, `anthropic`, or `gemini`)
- `AI_PRIMARY_MODEL` - Model to use (e.g., `gpt-4o-mini`)
- `AI_SECONDARY_PROVIDER` - Fallback provider
- `AI_SECONDARY_MODEL` - Fallback model
- `AI_FALLBACK_MODEL` - Final fallback

**Environment:**

- `NODE_ENV` - Set to `production`
- `PORT` - Railway sets automatically, defaults to `3001`

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Fresh Railway Project

1. **Go to Railway:**
   - https://railway.app/dashboard
   - Login with GitHub

2. **Create New Project:**
   - Click **"+ New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose repository: `Rusu91-webdeveloper/STEM-TOYS3`
   - Click **"Deploy Now"**

3. **Initial Deployment Will Fail** (this is expected!)
   - Railway will build successfully
   - But healthcheck will fail (missing environment variables)
   - This is normal - we'll fix it next

---

### Step 2: Configure Docker Build

1. **In Railway Dashboard:**
   - Click on your service
   - Go to **"Settings"** tab

2. **Set Build Configuration:**
   - **Builder:** Docker
   - **Dockerfile Path:** `Dockerfile.railway`
   - **Root Directory:** `/` (leave empty or set to root)
   - **Watch Paths:** `inngest-server/**`, `inngest/**`, `lib/**`, `prisma/**`

3. **Save Settings**

---

### Step 3: Add Environment Variables (CRITICAL!)

Go to **"Variables"** tab and add each variable:

#### Database (Get from Neon):

```bash
# Go to: https://console.neon.tech/
# Select your project → "Connection string"
# Copy BOTH pooled and direct connections

DATABASE_URL=postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/database?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/database?sslmode=require
```

**⚠️ IMPORTANT:**

- Must end with `?sslmode=require`
- Both URLs can be the same for Neon
- Railway MUST be able to reach this database

#### Inngest (Get from Inngest Dashboard):

```bash
# Go to: https://app.inngest.com/
# Settings → Keys

INNGEST_EVENT_KEY=evt_...your_event_key...
INNGEST_SIGNING_KEY=signkey_...your_signing_key...
```

#### OpenAI (Get from OpenAI Platform):

```bash
# Go to: https://platform.openai.com/api-keys
# Create new key or copy existing

OPENAI_API_KEY=sk-...your_openai_key...
```

#### AI Configuration (REQUIRED):

```bash
# Primary AI provider configuration
AI_PRIMARY_PROVIDER=openai
AI_PRIMARY_MODEL=gpt-4o-mini

# Secondary AI provider (can be same as primary)
AI_SECONDARY_PROVIDER=openai
AI_SECONDARY_MODEL=gpt-4o-mini

# Fallback model
AI_FALLBACK_MODEL=gpt-4o-mini

# Enable AI enhancement
AI_ENHANCEMENT_ENABLED=true

# Optional: Model-specific settings
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

#### Environment:

```bash
NODE_ENV=production
```

**Note:** Railway automatically sets `PORT` - do NOT set it manually

---

### Step 4: Generate Railway Domain

1. **In Railway Dashboard:**
   - Go to **"Settings"** tab
   - Find **"Domains"** section
   - Click **"Generate Domain"**
   - Copy the URL (e.g., `https://stem-toys-inngest-production.up.railway.app`)

2. **Save this URL** - you'll need it for Inngest configuration

---

### Step 5: Trigger Deployment

**Option A: Automatic (Recommended)**

- Railway auto-deploys when you push to GitHub
- Should already be deploying from Step 1

**Option B: Manual**

- Click **"Deployments"** tab
- Click **"Deploy"** button

**Watch the deployment:**

- **Build Phase:** 3-5 minutes (building Docker image)
- **Deploy Phase:** 30 seconds (starting container)
- **Healthcheck:** 10 seconds (checking `/health` endpoint)

---

### Step 6: Verify Deployment Success

#### Test 1: Check Railway Logs

1. **Go to "Logs" tab** in Railway Dashboard
2. **Look for success pattern:**

```
🔄 Starting Inngest Server...
📦 Loading environment variables...
📦 Loading Inngest functions...
✅ Loaded inngest client
✅ Loaded generate-blog function
✅ Loaded enhance-products function
✅ Loaded bulk-upload-products function
✅ Loaded supplier-bulk-upload-products function
✅ Loaded single-product-enhancement function
🚀 Inngest Server Started
📍 Port: 3001
🌐 Environment: production
💚 Health: http://0.0.0.0:3001/health
🔧 Inngest: http://0.0.0.0:3001/api/inngest

📦 Registered 5 Inngest Functions:
  - generate-blog: Generate Blog with AI
  - enhance-products: Enhance Products with AI
  - bulk-upload-products: Bulk Upload Products (Admin)
  - supplier-bulk-upload-products: Bulk Upload Products (Supplier)
  - single-product-enhancement: Single Product Enhancement with Preview

✅ Server ready to receive Inngest function calls
```

#### Test 2: Health Check

```bash
# Replace with your Railway URL
curl https://your-railway-url.railway.app/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "inngest-server",
  "timestamp": "2025-10-11T...",
  "environment": "production"
}
```

#### Test 3: Functions List

```bash
curl https://your-railway-url.railway.app/
```

**Expected Response:**

```json
{
  "name": "Inngest Server",
  "description": "Standalone Inngest endpoint for AI-powered background jobs",
  "functions": [
    "generate-blog",
    "enhance-products",
    "bulk-upload-products",
    "supplier-bulk-upload-products",
    "single-product-enhancement"
  ],
  "endpoints": {
    "health": "/health",
    "inngest": "/api/inngest"
  }
}
```

---

### Step 7: Connect Inngest to Railway

**IMPORTANT:** This step switches Inngest from Vercel (60s timeout) to Railway
(unlimited).

1. **Go to Inngest Dashboard:**
   - https://app.inngest.com/

2. **Navigate to Your App:**
   - Click **"Apps"** in sidebar
   - Find: `stem-toys-blog-generation`
   - Click on it

3. **Update Serve API URL:**

   **OLD (Vercel - Remove):**

   ```
   https://www.techtots.ro/api/inngest
   ```

   **NEW (Railway - Add):**

   ```
   https://your-railway-url.railway.app/api/inngest
   ```

4. **Click "Sync":**
   - Inngest will call your Railway endpoint
   - It will discover all 5 functions
   - Wait for sync to complete (~10 seconds)

5. **Verify Functions:**
   - Go to **"Functions"** tab in Inngest
   - You should see ALL 5 functions:
     - ✅ generate-blog
     - ✅ enhance-products
     - ✅ bulk-upload-products
     - ✅ supplier-bulk-upload-products
     - ✅ **single-product-enhancement** ← NEW!

---

### Step 8: Test End-to-End

1. **Go to Production:**

   ```
   https://www.techtots.ro/admin/products
   ```

2. **Test Single Product Enhancement:**
   - Select any product
   - Click **"Enhance with AI"**
   - Check Inngest Dashboard → "Runs" tab
   - Should see: `single-product-enhancement` **TRIGGERED**

3. **Test Blog Generation:**
   - Go to `/admin/blogs/new`
   - Generate a blog with AI
   - Check Inngest Dashboard
   - Should see: `generate-blog` **TRIGGERED**

4. **Monitor Railway Logs:**
   - Watch real-time function execution
   - Check for errors
   - Verify database updates

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Healthcheck Fails (Most Common)

**Symptoms:**

- Build succeeds
- Deployment shows "Application Error"
- Healthcheck times out

**Causes & Fixes:**

#### A. Server Not Binding to 0.0.0.0

✅ **Already Fixed** in `inngest-server/server.js` (line 88)

```javascript
app.listen(PORT, "0.0.0.0", () => { ... });
```

#### B. Missing Environment Variables

Check Railway logs for:

```
❌ Failed to load Inngest functions:
Error: INNGEST_SIGNING_KEY is not defined
```

**Fix:** Add missing variable in Railway Dashboard → Variables

#### C. Database Connection Failed

Check Railway logs for:

```
Error: P1001: Can't reach database server
```

**Fix:**

1. Verify DATABASE_URL is correct
2. Check if Neon database is accessible
3. Ensure Railway IP is not blocked

#### D. OpenAI API Key Invalid

Check Railway logs for:

```
Error: OpenAI API key not configured
```

**Fix:**

1. Verify OPENAI_API_KEY is set
2. Check key is valid: https://platform.openai.com/api-keys
3. Ensure key has sufficient credits

---

### Issue 2: Functions Not Appearing in Inngest

**Symptoms:**

- Railway deployment successful
- Inngest sync completes
- But only shows 0-3 functions instead of 5

**Causes & Fixes:**

#### A. Inngest Pointing to Vercel

Check Inngest Dashboard → Apps → Your App → Serve API

```
OLD: https://www.techtots.ro/api/inngest
NEW: https://your-railway-url.railway.app/api/inngest
```

**Fix:** Update Serve API URL to Railway

#### B. Signing Key Mismatch

**Fix:**

1. Get signing key from Inngest Dashboard
2. Copy EXACT value to Railway variables
3. Restart Railway service

---

### Issue 3: Functions Timeout During Execution

**Symptoms:**

- Function starts
- Runs for 60 seconds
- Then fails with timeout

**Cause:** Inngest still pointing to Vercel (not Railway)

**Fix:** Verify Inngest Dashboard → Apps → Serve API URL points to Railway

---

### Issue 4: Build Fails

**Symptoms:**

- Railway shows build error
- Docker build fails

**Common Causes:**

#### A. Prisma Generation Failed

Check logs for:

```
Error: Cannot find module '@prisma/client'
```

✅ **Already Fixed** in `Dockerfile.railway` (lines 17-18)

#### B. Missing Dependencies

Check logs for:

```
Cannot find module 'inngest'
```

**Fix:**

1. Verify `inngest-server/package.json` has all deps
2. Check root `package.json` has Prisma

---

## 📊 Monitoring & Maintenance

### Daily Checks:

1. **Railway Dashboard:**
   - Service status: "Active" (green)
   - Memory usage: < 500MB
   - CPU usage: < 50%

2. **Railway Logs:**
   - No error messages
   - Functions executing successfully
   - Response times < 2 minutes

3. **Inngest Dashboard:**
   - All 5 functions active
   - Recent runs successful
   - No failed jobs

### Weekly Checks:

1. **Test all AI features:**
   - Blog generation
   - Single product enhancement
   - Bulk uploads

2. **Check Railway usage:**
   - Hours used this month
   - Stay under 500 hours (free tier)

3. **Review logs for patterns:**
   - Slow queries
   - Memory leaks
   - API rate limits

---

## 🎯 Success Checklist

Before considering deployment complete:

- [ ] Railway deployment shows **"Active"** status
- [ ] Railway URL is accessible: `https://your-url.railway.app/health` returns
      200
- [ ] Railway logs show "📦 Registered 5 Inngest Functions"
- [ ] All 5 functions listed in Railway logs startup
- [ ] Inngest Dashboard points to Railway URL (not Vercel)
- [ ] Inngest "Functions" tab shows all 5 functions
- [ ] Test single product enhancement → Function triggers
- [ ] Test blog generation → Function triggers
- [ ] Function executes and completes successfully
- [ ] Results saved to database
- [ ] No errors in Railway logs

---

## 📝 Environment Variables Quick Reference

Copy this template and fill in your values:

```bash
# ===== DATABASE =====
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# ===== INNGEST =====
INNGEST_EVENT_KEY=evt_...
INNGEST_SIGNING_KEY=signkey_...

# ===== OPENAI =====
OPENAI_API_KEY=sk-...

# ===== AI CONFIGURATION =====
AI_PRIMARY_PROVIDER=openai
AI_PRIMARY_MODEL=gpt-4o-mini
AI_SECONDARY_PROVIDER=openai
AI_SECONDARY_MODEL=gpt-4o-mini
AI_FALLBACK_MODEL=gpt-4o-mini
AI_ENHANCEMENT_ENABLED=true

# ===== ENVIRONMENT =====
NODE_ENV=production
```

---

## 🔗 Important URLs

**Railway:**

- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app/

**Inngest:**

- Dashboard: https://app.inngest.com/
- Docs: https://www.inngest.com/docs

**Neon:**

- Console: https://console.neon.tech/
- Docs: https://neon.tech/docs

**OpenAI:**

- API Keys: https://platform.openai.com/api-keys
- Docs: https://platform.openai.com/docs

---

## 🆘 Getting Help

If deployment still fails after following this guide:

1. **Gather Information:**
   - Screenshot of Railway runtime logs (not build logs)
   - Screenshot of Railway variables tab (hide sensitive values)
   - Exact error message from logs
   - Railway service URL

2. **Check These First:**
   - All environment variables are set
   - Database is accessible from Railway
   - Inngest keys are valid
   - OpenAI API key has credits

3. **Common Quick Fixes:**
   - Redeploy: Railway Dashboard → Deployments → "Deploy" again
   - Restart: Railway Dashboard → Service → "Restart"
   - Check logs: Railway Dashboard → Service → "Logs" tab
   - Verify variables: Railway Dashboard → Service → "Variables" tab

---

## ✅ What's Different from Previous Attempts

**Previous Setup (Failed):**

```
❌ Server bound to localhost only
❌ No detailed startup logging
❌ Vercel still handling Inngest (60s timeout)
❌ Missing environment variables
```

**Current Setup (Fixed):**

```
✅ Server binds to 0.0.0.0 (Railway requirement)
✅ Detailed logging at every step
✅ Railway handles Inngest (unlimited timeout)
✅ Complete environment variable checklist
✅ Comprehensive error handling
```

---

**Ready to deploy?** Start with Step 1 and follow each step carefully. Good
luck! 🚀
