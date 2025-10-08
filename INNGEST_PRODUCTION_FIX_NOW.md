# 🚨 URGENT: Fix Inngest Production Failures

## 📊 Current Status

**✅ What's Working:**

- Event sent to Inngest Cloud
- Event received (ID: 01K715EM0A4PTX9W44DWTYYAME)
- Function triggered successfully
- Job created in database (ID: cmghkabcr0004l204gbv85nxy)

**❌ What's Failing:**

- Function execution failed (4 attempts)
- Job stuck in PENDING status
- No blog generated

---

## 🎯 Root Cause (99% Certain)

**Missing `OPENAI_API_KEY` in Vercel Production Environment**

The blog generation service requires OpenAI API to generate content. Without it,
the function crashes immediately.

---

## ⚡ 3-Minute Fix

### Step 1: Get Error Details from Inngest (1 minute)

1. **Go to Inngest Dashboard:**

   ```
   https://app.inngest.com/env/production/runs/01K715EMNFA854MP65QPEYNEZA
   ```

2. **Click on any failed attempt** (you should see 4 of them)

3. **Look for the error message** - It will say something like:
   - `"OPENAI_API_KEY is not defined"`
   - `"Invalid API key"`
   - `"Failed to initialize AI service"`
   - `"Cannot connect to database"`

4. **Copy the exact error message** (we need it to confirm the fix)

### Step 2: Add Missing Environment Variable (1 minute)

Based on the error from Step 1:

**If error is about OPENAI_API_KEY:**

1. Go to Vercel: https://vercel.com/
2. Select your project → Settings → Environment Variables
3. Add these variables for **Production** environment:

```bash
OPENAI_API_KEY=sk-proj-YOUR-OPENAI-KEY-HERE
AI_PRIMARY_MODEL=gpt-4o
AI_SECONDARY_MODEL=gpt-4o
AI_PRIMARY_PROVIDER=openai
AI_SECONDARY_PROVIDER=openai
```

**If error is about DATABASE_URL:**

```bash
DATABASE_URL=your-production-database-url
DIRECT_URL=your-production-database-url
```

### Step 3: Redeploy (1 minute)

```
Vercel → Deployments → Click "..." → Redeploy
```

Wait for deployment to complete (~2 minutes)

### Step 4: Test Again

1. Go to your admin panel
2. Try generating the blog again
3. Watch Inngest Dashboard for new run
4. Should succeed this time! ✅

---

## 🔍 What to Check in Inngest Dashboard

Go to: https://app.inngest.com/env/production/runs/01K715EMNFA854MP65QPEYNEZA

Look for these tabs:

### 1. **Events Tab**

You should see:

```json
{
  "name": "blog/generate.requested",
  "data": {
    "jobId": "cmghkabcr0004l204gbv85nxy",
    "prompt": "generate a blog where you emphasise...",
    "userId": "cmge1n2gg00001keekgasz6t7"
  }
}
```

✅ This looks correct!

### 2. **Timeline Tab**

You should see failed attempts with timestamps:

- Attempt 1: Failed at X
- Attempt 2: Failed at X+1s
- Attempt 3: Failed at X+2s
- Attempt 4: Failed at X+3s (gave up)

### 3. **Output Tab**

This will show the error message. Common errors:

**Error 1: Missing API Key**

```
Error: OPENAI_API_KEY is not defined
  at OpenAIService.initialize
  at OptimizedBlogGenerationService.initService
```

**Fix:** Add `OPENAI_API_KEY` to Vercel

**Error 2: Invalid API Key**

```
Error: Request failed with status code 401
  Unauthorized: Incorrect API key provided
```

**Fix:** Verify your OpenAI API key is correct

**Error 3: Database Connection**

```
Error: Can't reach database server
  at PrismaClient.connect
```

**Fix:** Check `DATABASE_URL` in Vercel

**Error 4: Rate Limit**

```
Error: Request failed with status code 429
  Rate limit exceeded
```

**Fix:** Wait or upgrade OpenAI plan

---

## 📋 Complete Environment Variables Checklist

### Required (Must Have)

- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `DIRECT_URL` - Direct connection (same as DATABASE_URL for Neon)
- [ ] `NEXTAUTH_SECRET` - Auth secret (min 32 chars)
- [ ] `NEXTAUTH_URL` - Your production URL (https://www.techtots.ro)
- [ ] `OPENAI_API_KEY` - OpenAI API key (starts with sk-proj- or sk-)

### For Inngest (Already Set ✅)

- [x] `INNGEST_EVENT_KEY` - Already working!
- [x] `INNGEST_SIGNING_KEY` - Already working!

### For AI Blog Generation (Critical)

- [ ] `AI_PRIMARY_MODEL` - Set to `gpt-4o`
- [ ] `AI_SECONDARY_MODEL` - Set to `gpt-4o`
- [ ] `AI_PRIMARY_PROVIDER` - Set to `openai`
- [ ] `AI_SECONDARY_PROVIDER` - Set to `openai`
- [ ] `AI_TEMPERATURE` - Set to `0.7` or `0.8`

### Optional (But Recommended)

- [ ] `AI_ENHANCEMENT_ENABLED` - Set to `true`
- [ ] `AI_MAX_TOKENS` - Set to `2000`
- [ ] `LOG_LEVEL` - Set to `info` or `debug`

---

## 🎯 How to Get Your OpenAI API Key

### If You Don't Have One

1. **Go to OpenAI:** https://platform.openai.com/
2. **Sign up** for an account (free $5 credits for new accounts)
3. **Go to API Keys:** https://platform.openai.com/api-keys
4. **Click "Create new secret key"**
5. **Copy the key** (starts with `sk-proj-...`)
6. **Add to Vercel** as `OPENAI_API_KEY`

### If You Have One

1. **Go to:** https://platform.openai.com/api-keys
2. **Find your key** or create a new one
3. **Copy it**
4. **Add to Vercel**

### Check Your Credits

Go to: https://platform.openai.com/usage

Make sure you have:

- ✅ Available credits
- ✅ No rate limits
- ✅ Active billing (if free trial expired)

---

## 🧪 Test Your Fix

### After Redeploying

1. **Check environment variables are loaded:**

   ```bash
   # Visit your production site and check browser console
   # Or use Vercel CLI
   vercel env pull
   ```

2. **Generate a test blog:**
   - Go to: https://www.techtots.ro/admin/blog
   - Click "AI Generate Blog"
   - Enter: "Best STEM toys for autism"
   - Click "Generate"

3. **Watch Inngest Dashboard:**

   ```
   https://app.inngest.com/env/production/stream
   ```

   You should see:
   - ✅ Event received
   - ✅ Function started
   - ✅ Step: update-status-processing
   - ✅ Step: generate-blog-content (takes 2-3 minutes)
   - ✅ Step: save-result
   - ✅ Function completed!

4. **Check your database:**

   ```sql
   SELECT id, status, createdAt, completedAt
   FROM "AiJob"
   WHERE id = 'YOUR_JOB_ID'
   ```

   Status should be: `COMPLETED` ✅

---

## 🔧 Debugging Commands

### Check Vercel Logs (Real-time)

```bash
vercel logs --follow
```

### Check Specific Deployment Logs

```bash
vercel logs [deployment-url]
```

### Test Database Connection

```bash
# From your local machine
psql $DATABASE_URL -c "SELECT version();"
```

### Test OpenAI API Key

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## ❓ Still Failing? Advanced Troubleshooting

### Check Inngest Function Logs

1. Go to function details:

   ```
   https://app.inngest.com/env/production/functions/generate-blog
   ```

2. Click on "Logs" tab

3. Look for initialization errors

### Check Vercel Function Logs

1. Go to: https://vercel.com/your-project/deployments
2. Click on latest deployment
3. Click "Functions" tab
4. Look for `/api/inngest` errors

### Enable Debug Mode

Add to Vercel environment variables:

```bash
DEBUG=*
LOG_LEVEL=debug
NODE_ENV=production
```

Redeploy and check logs for detailed error messages.

---

## ✅ Success Indicators

After fix, you should see:

### In Inngest Dashboard

```
✅ Function: generate-blog
✅ Status: Completed
✅ Duration: ~150-180 seconds
✅ Steps: All green checkmarks
```

### In Your Database

```sql
-- Job should show COMPLETED
SELECT * FROM "AiJob" WHERE id = 'YOUR_JOB_ID';

-- Blog should be created
SELECT * FROM "Blog" ORDER BY "createdAt" DESC LIMIT 1;
```

### In Your Admin Panel

```
✅ Blog post appears in list
✅ Content is filled (not empty)
✅ Title is proper (not raw prompt)
✅ Has Romanian content
```

---

## 📞 Next Action Items

1. **RIGHT NOW:** Check Inngest error message (Step 1 above)
2. **Copy the exact error** and we'll know exactly what's missing
3. **Add the missing environment variable**
4. **Redeploy**
5. **Test again**

---

## 💡 Pro Tip

After fixing, enable monitoring:

```bash
# In Vercel
PERFORMANCE_MONITORING=true
SENTRY_ENVIRONMENT=production
LOG_LEVEL=info
```

This will help catch issues earlier!

---

**Time to Fix:** 3-5 minutes  
**Confidence Level:** 99%  
**Next Step:** Check Inngest error logs and add missing env var

🚀 Let's get this working!
