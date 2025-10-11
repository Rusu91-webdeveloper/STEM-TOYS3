# Railway Deployment Guide - Step by Step

## Current Situation

- ❌ Railway deployment FAILED
- ⚠️ Inngest pointing to Vercel: `https://www.techtots.ro/api/inngest`
- ⚠️ Vercel has 60-second timeout (causes issues with long AI tasks)
- ✅ Need Railway deployed for unlimited execution time

## Goal

Deploy the `inngest-server` to Railway successfully and point Inngest to it.

---

## Step 1: Check Railway Logs to See Why It Failed

### Via Railway Dashboard:

1. Go to https://railway.app/
2. Login with your GitHub account
3. Find your project (look for `inngest-server` or `stem-toys`)
4. Click on the failed deployment
5. Click **"View Logs"** or **"Deployments"** → Click the failed one
6. **Copy the error message** - This tells us what went wrong

### Common Railway Failure Reasons:

#### Error 1: "Module not found"

```
Error: Cannot find module '@prisma/client'
```

**Cause:** Prisma client not generated **Fix:** See Step 2

#### Error 2: "Connection refused" or "Database timeout"

```
Error: Can't reach database server at ...
```

**Cause:** DATABASE_URL not set or wrong **Fix:** See Step 3

#### Error 3: "INNGEST_SIGNING_KEY is not defined"

```
Error: INNGEST_SIGNING_KEY is required
```

**Cause:** Missing environment variables **Fix:** See Step 3

#### Error 4: "Build failed" or "npm install failed"

```
Error: npm ERR! code ERESOLVE
```

**Cause:** Dependency conflicts **Fix:** See Step 4

---

## Step 2: Fix Dockerfile (If Prisma Issues)

The Dockerfile should build Prisma correctly. Let's verify it's using the latest
version:

**File:** `Dockerfile.railway`

```dockerfile
FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies first (including dev dependencies for build)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy necessary source directories
COPY inngest ./inngest/
COPY lib ./lib/
COPY types ./types/
COPY inngest-server ./inngest-server/

# Install inngest-server dependencies
WORKDIR /app/inngest-server
RUN npm install

# Back to root for runtime
WORKDIR /app

# Expose port
EXPOSE ${PORT:-3001}

# Start the server
CMD ["node", "inngest-server/server.js"]
```

---

## Step 3: Set Railway Environment Variables

### Required Variables:

Go to Railway Dashboard → Your Project → **Variables** tab

Click **"+ New Variable"** and add each of these:

```bash
# Database (CRITICAL - Must be accessible from Railway)
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host.neon.tech:5432/database?sslmode=require

# Inngest (Get from Inngest Dashboard)
INNGEST_EVENT_KEY=evt_...your_event_key...
INNGEST_SIGNING_KEY=signkey_...your_signing_key...

# OpenAI (CRITICAL for AI enhancement)
OPENAI_API_KEY=sk-...your_openai_key...

# AI Configuration
AI_PRIMARY_MODEL=gpt-4o-mini
AI_SECONDARY_MODEL=gpt-4o-mini
AI_PRIMARY_PROVIDER=openai
AI_SECONDARY_PROVIDER=openai

# Environment
NODE_ENV=production

# Port (Railway sets this automatically, but you can set default)
PORT=3001
```

### How to Get Environment Variables:

#### Database URL (Neon):

1. Go to https://console.neon.tech/
2. Select your project
3. Click **"Connection string"**
4. Copy the connection string
5. Make sure it ends with `?sslmode=require`

#### Inngest Keys:

1. Go to https://app.inngest.com/
2. Click **"Settings"** or your profile
3. Go to **"Keys"** section
4. Copy **Event Key** (starts with `evt_`)
5. Copy **Signing Key** (starts with `signkey_`)

#### OpenAI Key:

1. Go to https://platform.openai.com/api-keys
2. Create new key if needed
3. Copy the key (starts with `sk-`)

---

## Step 4: Deploy to Railway

### Option A: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard

2. **Create New Project (if needed):**
   - Click **"+ New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository: `STEM-TOYS3`

3. **Configure Service:**
   - Railway will auto-detect the `Dockerfile.railway`
   - If not, manually set:
     - **Builder:** Docker
     - **Dockerfile Path:** `Dockerfile.railway`
     - **Root Directory:** `/` (leave empty or set to root)

4. **Set Environment Variables:**
   - Go to **"Variables"** tab
   - Add all variables from Step 3

5. **Deploy:**
   - Click **"Deploy"** or it will auto-deploy
   - Wait for build to complete (2-5 minutes)

6. **Get Railway URL:**
   - After successful deployment, go to **"Settings"** tab
   - Under **"Domains"**, click **"Generate Domain"**
   - Copy the URL (e.g., `https://stem-toys-inngest-production.up.railway.app`)

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to existing project OR create new
railway link

# Set environment variables (one by one)
railway variables set DATABASE_URL="your_database_url"
railway variables set INNGEST_EVENT_KEY="your_event_key"
railway variables set INNGEST_SIGNING_KEY="your_signing_key"
railway variables set OPENAI_API_KEY="your_openai_key"
railway variables set AI_PRIMARY_MODEL="gpt-4o-mini"
railway variables set NODE_ENV="production"

# Deploy
railway up

# Get URL
railway domain
```

---

## Step 5: Verify Railway Deployment

### Test 1: Health Check

```bash
curl https://your-railway-url.railway.app/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "inngest-server",
  "timestamp": "2025-10-10T...",
  "environment": "production"
}
```

### Test 2: Check Functions List

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

✅ If you see all 5 functions, Railway is working!

### Test 3: Check Railway Logs

In Railway Dashboard → Your Service → **"Logs"**

Look for:

```
🚀 Inngest Server Started
📍 Port: 3001
🌐 Environment: production
💚 Health: http://localhost:3001/health
🔧 Inngest: http://localhost:3001/api/inngest

📦 Registered 5 Inngest Functions:
  - generate-blog: Generate Blog with AI
  - enhance-products: Enhance Products with AI
  - bulk-upload-products: Bulk Upload Products (Admin)
  - supplier-bulk-upload-products: Bulk Upload Products (Supplier)
  - single-product-enhancement: Single Product Enhancement with Preview

✅ Server ready to receive Inngest function calls
```

---

## Step 6: Update Inngest Dashboard to Point to Railway

### IMPORTANT: Change from Vercel to Railway URL

1. **Go to Inngest Dashboard:**
   - https://app.inngest.com/

2. **Navigate to Your App:**
   - Click **"Apps"** in sidebar
   - Find: `stem-toys-blog-generation`
   - Click on it

3. **Update Serve API URL:**
   - Look for **"Sync"** or **"Serve API"** section
   - You'll see current URL: `https://www.techtots.ro/api/inngest`
4. **Change to Railway URL:**

   ```
   OLD (Vercel - 60s timeout):
   https://www.techtots.ro/api/inngest

   NEW (Railway - No timeout):
   https://your-railway-url.railway.app/api/inngest
   ```

5. **Click "Sync":**
   - Inngest will call your Railway endpoint
   - It will discover all 5 functions

6. **Verify Functions:**
   - Go to **"Functions"** tab
   - You should now see ALL 5 functions:
     - ✅ generate-blog
     - ✅ enhance-products
     - ✅ bulk-upload-products
     - ✅ supplier-bulk-upload-products
     - ✅ **single-product-enhancement** ← This is the new one!

---

## Step 7: Test Single Product Enhancement

1. **Go to Production:**

   ```
   https://www.techtots.ro/admin/products
   ```

2. **Select Any Product**

3. **Click "Enhance with AI"**

4. **Check Inngest Dashboard:**
   - Go to **"Runs"** or **"Stream"** tab
   - You should see:
     - ✅ Event: `products/single-product-enhancement.requested`
     - ✅ Function: `single-product-enhancement` **TRIGGERED**
     - ✅ Status: Running → Completed

5. **Check Railway Logs:**
   - Should show function execution
   - AI processing logs
   - Database updates

---

## Troubleshooting Specific Railway Errors

### ⚠️ MOST COMMON ISSUE: Healthcheck Fails But Build Succeeds

**Symptom:** Build completes successfully, but healthcheck keeps failing with "service unavailable"

**Cause:** Server not binding to `0.0.0.0` (Railway requirement)

**Fix:** Already implemented in latest code! The server must bind to `0.0.0.0`:

```javascript
// ✅ CORRECT (latest code)
app.listen(PORT, "0.0.0.0", () => { ... });

// ❌ WRONG (old code)
app.listen(PORT, () => { ... }); // Defaults to localhost
```

**Next Steps:**
1. Push latest code (already done)
2. Check Railway **RUNTIME logs** (not build logs)
3. Look for startup messages: "🔄 Starting Inngest Server..."
4. Verify all environment variables are set

### If Railway Shows "Application Error"

Check these in order:

1. **Server Binding (MOST COMMON):**

   **Symptom:** Healthcheck fails, logs show no errors
   
   **Fix:** Ensure server binds to `0.0.0.0` (already fixed in latest code)

2. **Missing Environment Variables:**

   ```bash
   # In Railway RUNTIME logs:
   "Error: INNGEST_SIGNING_KEY is not defined"
   "Error: DATABASE_URL is not defined"
   ```

   **Fix:** Add ALL required environment variables in Railway Dashboard → Variables

3. **Database Connection:**

   ```bash
   # In Railway logs:
   "Error: P1001: Can't reach database server"
   ```

   **Fix:** Update DATABASE_URL with correct Neon connection string

4. **Missing Dependencies:**

   ```bash
   # In Railway logs:
   "Cannot find module 'inngest'"
   ```

   **Fix:** Ensure `inngest-server/package.json` has all dependencies

5. **Prisma Not Generated:**

   ```bash
   # In Railway logs:
   "@prisma/client did not initialize yet"
   ```

   **Fix:** Update Dockerfile to run `npx prisma generate` earlier

6. **Port Binding Issues:**
   ```bash
   # In Railway logs:
   "Error: listen EADDRINUSE: address already in use"
   ```
   **Fix:** Ensure using `process.env.PORT` in server.js

### If Inngest Sync Fails

1. **Check Railway URL is accessible publicly:**

   ```bash
   curl https://your-railway-url.railway.app/api/inngest
   ```

   Should return JSON with function definitions

2. **Check INNGEST_SIGNING_KEY matches:**
   - Railway env var
   - Inngest dashboard key
   - They must be EXACTLY the same

3. **Check Railway logs during sync:**
   - Inngest will call `/api/inngest` GET endpoint
   - You should see request logs in Railway

---

## Quick Checklist

Before considering deployment successful:

- [ ] Railway deployment shows **"Active"** (not failed)
- [ ] Railway URL is accessible: `curl https://your-url.railway.app/health`
      returns 200
- [ ] Railway logs show "📦 Registered 5 Inngest Functions"
- [ ] Inngest dashboard points to Railway URL (not Vercel)
- [ ] Inngest "Functions" tab shows all 5 functions
- [ ] Test single product enhancement triggers function
- [ ] Function executes and completes successfully
- [ ] Result saved to database

---

## What Changed vs Before

**BEFORE (Failed Setup):**

```
Vercel (/api/inngest) → 60s timeout → Functions fail
      ↓
Only 3 functions registered
Single product enhancement missing
```

**AFTER (Working Setup):**

```
Railway (/api/inngest) → No timeout → Functions succeed
       ↓
All 5 functions registered
Single product enhancement works!
```

---

## Next Steps After Railway is Working

1. **Update your production app environment:**
   - You can keep Vercel for the main app
   - Only Inngest needs to point to Railway

2. **Monitor Railway:**
   - Check logs regularly
   - Railway free tier: 500 hours/month (plenty!)
3. **Test all AI features:**
   - Blog generation
   - Single product enhancement
   - Bulk product upload
   - Supplier uploads

---

## Need Help?

If Railway deployment still fails after following this guide:

1. **Share the Railway logs** - The exact error message
2. **Check environment variables** - All are set correctly?
3. **Verify database connection** - Can Railway reach Neon?
4. **Check Inngest keys** - Are they valid and match?

Common quick fixes:

- Redeploy: Railway Dashboard → Deployments → Click "Deploy" again
- Restart: Railway Dashboard → Your Service → Click "Restart"
- Check logs: Railway Dashboard → Your Service → "Logs" tab
