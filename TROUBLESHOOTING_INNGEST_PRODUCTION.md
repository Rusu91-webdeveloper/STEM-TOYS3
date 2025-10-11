# Troubleshooting Railway Deployment - Healthcheck Failures

## What Just Happened

✅ **Build succeeded** - Docker image created successfully  
❌ **Healthcheck failed** - Application not responding at `/health`

## Critical Fixes Applied (Just Pushed)

1. ✅ **Server now binds to `0.0.0.0`** (Railway requirement)
2. ✅ **Added detailed startup logging** to catch crashes
3. ✅ **Better error handling** for module loading

## Next Steps: Check Railway Application Logs

### IMPORTANT: You showed me BUILD logs, but I need RUNTIME logs!

The build succeeded, so the issue is at **runtime** (when the app tries to start).

### How to Get Runtime Logs:

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard

2. **Find Your Service:**
   - Click on your project
   - Click on the `inngest-server` service

3. **View RUNTIME Logs (not Build logs):**
   - Click the **"Logs"** tab
   - Look for **application logs** (not build logs)
   - You should see our new startup messages

### What to Look For in Runtime Logs:

#### ✅ Success Pattern:
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
```

#### ❌ Failure Pattern #1: Missing Environment Variables
```
❌ Failed to load Inngest functions:
Error: INNGEST_SIGNING_KEY is not defined
```

**Fix:** Add missing environment variable in Railway

#### ❌ Failure Pattern #2: Database Connection
```
❌ Failed to load Inngest functions:
Error: P1001: Can't reach database server
```

**Fix:** Check DATABASE_URL is correct

#### ❌ Failure Pattern #3: Missing Dependencies
```
❌ Failed to load Inngest functions:
Error: Cannot find module '@prisma/client'
```

**Fix:** Dockerfile issue (but we already fixed this)

---

## Required Environment Variables in Railway

### Go to: Railway Dashboard → Your Project → Variables Tab

Click **"+ New Variable"** and add these **ONE BY ONE**:

### 1. Database (CRITICAL)
```bash
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**How to Get:**
- Go to https://console.neon.tech/
- Select your project
- Click "Connection string"
- Copy **Pooled connection** for DATABASE_URL
- Copy **Direct connection** for DIRECT_URL

### 2. Inngest Keys (CRITICAL)
```bash
INNGEST_EVENT_KEY=evt_...your_key...
INNGEST_SIGNING_KEY=signkey_...your_key...
```

**How to Get:**
- Go to https://app.inngest.com/
- Click "Settings" → "Keys"
- Copy both keys

### 3. OpenAI (CRITICAL for AI features)
```bash
OPENAI_API_KEY=sk-...your_key...
```

**How to Get:**
- Go to https://platform.openai.com/api-keys
- Create new key or copy existing

### 4. AI Configuration (REQUIRED)
```bash
AI_PRIMARY_MODEL=gpt-4o-mini
AI_SECONDARY_MODEL=gpt-4o-mini
AI_PRIMARY_PROVIDER=openai
AI_SECONDARY_PROVIDER=openai
```

### 5. Environment Settings
```bash
NODE_ENV=production
PORT=3001
```

---

## After Adding Environment Variables

1. **Redeploy:**
   - Railway will auto-redeploy when you push changes
   - OR manually click "Deploy" in Railway Dashboard

2. **Watch Runtime Logs:**
   - Go to "Logs" tab
   - Look for our startup messages
   - Should see all 5 functions loading

3. **Test Health Endpoint:**
   ```bash
   curl https://your-railway-url.railway.app/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "service": "inngest-server",
     "timestamp": "2025-10-11T...",
     "environment": "production"
   }
   ```

---

## Common Issues and Solutions

### Issue 1: "Connection refused" in logs
**Cause:** Database URL is wrong or database is down  
**Fix:** Verify DATABASE_URL in Railway matches Neon exactly

### Issue 2: "INNGEST_SIGNING_KEY is not defined"
**Cause:** Environment variable not set  
**Fix:** Add INNGEST_SIGNING_KEY in Railway Variables tab

### Issue 3: "Cannot find module"
**Cause:** Dependency missing or Prisma not generated  
**Fix:** Already fixed in Dockerfile.railway - just redeploy

### Issue 4: Healthcheck still fails after all fixes
**Cause:** Server crashed before binding to port  
**Fix:** Check runtime logs for the EXACT error message

---

## Quick Debugging Commands

### 1. Test if service is accessible:
```bash
curl -v https://your-railway-url.railway.app/health
```

### 2. Check Railway service status:
```bash
# Via Railway Dashboard
# Look for "Running" or "Crashed" status indicator
```

### 3. Force redeploy:
```bash
# In Railway Dashboard
# Click "Deployments" → "Redeploy"
```

---

## What Changed in Latest Code Push

### Before (Broken):
```javascript
app.listen(PORT, () => {
  // Binds to localhost by default
  // Railway can't reach it
});
```

### After (Fixed):
```javascript
app.listen(PORT, "0.0.0.0", () => {
  // Explicitly binds to 0.0.0.0
  // Railway can now reach it
});
```

**Plus:** Added detailed logging at every startup step to catch errors

---

## Next Steps for You

1. ✅ **Check Railway Runtime Logs** (not build logs)
   - Go to Dashboard → Service → "Logs" tab
   - Look for our new startup messages
   - Screenshot any errors you see

2. ✅ **Verify Environment Variables**
   - Go to Dashboard → Service → "Variables" tab
   - Make sure ALL required variables are set
   - Especially: DATABASE_URL, INNGEST_SIGNING_KEY, OPENAI_API_KEY

3. ✅ **Wait for New Deployment**
   - Railway auto-deploys when you push to GitHub
   - Should trigger within 1-2 minutes
   - Watch the deployment progress

4. ✅ **Test Health Endpoint**
   - Once deployed, test: `curl https://your-url.railway.app/health`
   - Should return JSON with `"status": "ok"`

---

## If Still Failing

**Send me:**
1. Screenshot of Railway **Runtime Logs** (not build logs)
2. Screenshot of Railway **Variables** tab (hide sensitive values)
3. The exact error message from logs

**DO NOT send build logs again** - we need runtime logs to see why the app crashes when it tries to start!

---

## Expected Timeline

- **Push to GitHub:** ✅ Done
- **Railway detects push:** ~30 seconds
- **Railway builds:** ~3-5 minutes
- **Railway deploys:** ~30 seconds
- **Healthcheck:** ~10 seconds

**Total:** Should be live in 5-6 minutes from now

Check Railway dashboard now to see if new deployment has started!
