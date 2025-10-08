# Railway Deployment - Step by Step Guide

## ✅ Step 1: Create Railway Account (2 minutes)

1. **Go to Railway:** https://railway.app
2. **Click "Login"** in the top right
3. **Sign up with GitHub** (recommended - easier deployment)
4. **Authorize Railway** to access your GitHub repos
5. You'll get **500 hours/month free** (enough for your blog generation)

## ✅ Step 2: Create New Project (3 minutes)

1. **Click "New Project"** button (top right in Railway dashboard)
2. **Select "Deploy from GitHub repo"**
3. **Choose your repository:** `STEM-TOYS3`
4. **Railway will scan your repo** - wait a few seconds

## ✅ Step 3: Configure Service (2 minutes)

After Railway imports your repo:

1. **Set Root Directory:**
   - Click on the deployed service
   - Go to "Settings" tab
   - Scroll to "Root Directory"
   - Enter: `inngest-server`
   - Click "Update"

2. **Set Start Command** (if not auto-detected):
   - In Settings, find "Start Command"
   - Enter: `node server.js`
   - Click "Update"

## ✅ Step 4: Add Environment Variables (5 minutes)

This is **critical** - the server won't work without these.

1. **Click on your service** in Railway dashboard
2. **Go to "Variables" tab**
3. **Click "New Variable"** for each of these:

### Required Variables:

Copy these values from your Vercel dashboard or `.env.local`:

```bash
# Database (from Vercel or your Neon dashboard)
DATABASE_URL=postgresql://...your-actual-database-url...
DIRECT_URL=postgresql://...same-as-DATABASE_URL...

# Inngest (from your .env.local)
INNGEST_EVENT_KEY=vv0IWLw...your-actual-key...
INNGEST_SIGNING_KEY=signkey-prod-...your-actual-key...

# OpenAI (from your .env.local)
OPENAI_API_KEY=sk-proj-...your-actual-key...

# AI Configuration
AI_PRIMARY_MODEL=gpt-4o-mini
AI_SECONDARY_MODEL=gpt-4o-mini
AI_TEMPERATURE=0.7

# Environment
NODE_ENV=production
```

**Important Notes:**

- Copy the EXACT values from your working local setup
- Don't add quotes around values
- Railway will restart automatically after adding variables

## ✅ Step 5: Wait for Deployment (2-3 minutes)

1. **Go to "Deployments" tab**
2. **Watch the build logs** - you'll see:

   ```
   Building...
   Installing dependencies...
   Starting server...
   ✓ Deployed successfully
   ```

3. **Check for errors** - if build fails:
   - Check the logs for error messages
   - Verify environment variables are set correctly
   - Make sure root directory is set to `inngest-server`

## ✅ Step 6: Get Your Railway URL (1 minute)

1. **Go to "Settings" tab**
2. **Scroll to "Domains"**
3. **Click "Generate Domain"**
4. **Copy the URL** - it will look like:

   ```
   https://your-app-production-xxxx.up.railway.app
   ```

5. **Test the health endpoint:**

   ```bash
   curl https://your-app-production-xxxx.up.railway.app/health
   ```

   Should return:

   ```json
   {
     "status": "ok",
     "service": "inngest-server",
     "timestamp": "2025-10-08T...",
     "environment": "production"
   }
   ```

## ✅ Step 7: Update Inngest Dashboard (3 minutes)

Now we need to tell Inngest Cloud to call Railway instead of Vercel:

1. **Go to Inngest Dashboard:** https://app.inngest.com/

2. **Find your app:** `stem-toys-blog-generation`

3. **Click on Settings** (or Manage App)

4. **Update App URL:**
   - Old URL: `https://www.techtots.ro/api/inngest`
   - New URL: `https://your-app-production-xxxx.up.railway.app/api/inngest`
   - (Use the Railway URL from Step 6)

5. **Click "Sync"** to register functions

6. **Verify functions are synced:**
   - You should see 3 functions:
     - `generate-blog`
     - `enhance-products`
     - `bulk-upload-products`

## ✅ Step 8: Test Blog Generation (5 minutes)

Now let's test if everything works:

1. **Go to your admin panel:**

   ```
   https://www.techtots.ro/admin/blog
   ```

2. **Click "AI Generate Blog"**

3. **Enter a test prompt:**

   ```
   STEM toys help children learn mathematics
   ```

4. **Click "Generate"**

5. **Watch Inngest Dashboard:**

   ```
   https://app.inngest.com/env/production/stream
   ```

6. **Expected behavior:**
   - ✅ Event received
   - ✅ Function starts (no timeout)
   - ✅ Runs for 90-120 seconds
   - ✅ Completes successfully
   - ✅ Status: COMPLETED

7. **Check Railway Logs:**
   - In Railway dashboard, go to "Logs" tab
   - You should see:
     ```
     🚀 [Inngest] Starting blog generation job: [id]
     🤖 [Inngest] Starting AI blog generation...
     ✅ [Inngest] Job completed with status: COMPLETED
     ```

## ✅ Step 9: Verify in Database (2 minutes)

Check that the job completed successfully:

```sql
SELECT
  id,
  status,
  EXTRACT(EPOCH FROM (completedAt - startedAt)) as duration_seconds,
  LENGTH(result) as result_length
FROM "AiJob"
ORDER BY createdAt DESC
LIMIT 1;
```

**Expected results:**

- `status`: COMPLETED
- `duration_seconds`: 90-120
- `result_length`: 10000+ (full blog content)

## 🎉 Success!

If you see:

- ✅ Health endpoint returns 200
- ✅ Inngest functions are synced
- ✅ Blog generation completes
- ✅ Job status is COMPLETED
- ✅ Blog appears in admin panel

**You're done!** Your Inngest functions now run on Railway with no timeout
limits!

---

## 🔧 Troubleshooting

### Issue: Build fails on Railway

**Check:**

1. Root directory is set to `inngest-server`
2. All environment variables are added
3. GitHub repo is accessible

**Fix:**

- Check Railway build logs for specific error
- Verify package.json is in inngest-server directory

### Issue: Server starts but health check fails

**Check:**

1. PORT environment variable (Railway sets this automatically)
2. Health endpoint path: `/health`

**Fix:**

- Check Railway logs for startup errors
- Verify server.js is starting correctly

### Issue: Inngest functions not syncing

**Check:**

1. Railway URL is correct in Inngest dashboard
2. INNGEST_SIGNING_KEY matches in both places
3. Functions are exported correctly

**Fix:**

- Click "Sync" again in Inngest dashboard
- Check Railway logs for Inngest connection errors
- Verify signing key is exact match

### Issue: Blog generation still times out

**Check:**

1. Inngest dashboard shows Railway URL (not Vercel)
2. AI_PRIMARY_MODEL is set to gpt-4o-mini
3. OPENAI_API_KEY has sufficient credits

**Fix:**

- Verify environment variables in Railway
- Check Railway logs for actual execution time
- Test OPENAI_API_KEY directly

### Issue: Database connection error

**Check:**

1. DATABASE_URL is accessible from Railway
2. Neon allows connections from Railway IP
3. Database credentials are correct

**Fix:**

- Test database connection from Railway logs
- Verify DATABASE_URL format
- Check Neon dashboard for connection limits

---

## 📊 Monitoring

### Railway Dashboard

- **Logs:** Real-time server logs
- **Metrics:** CPU, Memory, Network usage
- **Deployments:** History of deploys

### Inngest Dashboard

- **Stream:** Real-time function executions
- **Functions:** Success rates, durations
- **Logs:** Detailed execution logs

### Your Database

```sql
-- Check recent jobs
SELECT status, COUNT(*)
FROM "AiJob"
GROUP BY status;

-- Check average duration
SELECT AVG(EXTRACT(EPOCH FROM (completedAt - startedAt))) as avg_seconds
FROM "AiJob"
WHERE status = 'COMPLETED';
```

---

## 💰 Cost

**Railway Free Tier:**

- 500 hours/month
- For your use case (~2 min per blog):
  - 30 blogs/month = 60 minutes used
  - Well within free tier! ✅

**If you exceed free tier:**

- Railway charges $5/month for unlimited usage
- Still cheaper than Vercel Pro ($20/month)

---

## 🔄 Future Updates

To update the server:

1. **Make changes** to inngest-server/server.js
2. **Commit and push** to GitHub
3. **Railway auto-deploys** (no manual action needed!)

---

## 📞 Need Help?

**Stuck on a step?**

1. Check Railway logs for errors
2. Check Inngest dashboard for sync status
3. Test health endpoint: `curl https://your-url.railway.app/health`
4. Share the error message and I'll help debug!

---

**Estimated Total Time:** 20-25 minutes **Difficulty:** Easy (mostly
point-and-click) **Result:** Blog generation works perfectly with no timeouts!
🎉
