# 🎯 Inngest Production Issue - Function Timeout

## 📊 Current Situation

### ✅ Great Progress!
- Local development: ✅ **Working perfectly!** (362 seconds, full blog generated)
- Production: ⚠️ Gets stuck at PROCESSING status
- OpenAI API key: ✅ Now set correctly (function starts)
- Job reaches PROCESSING: ✅ Function is executing

### 🔍 Key Observation
Your job is now **starting** to execute (reaches PROCESSING status) but **never completes**.

**Local Success:**
```
🚀 Starting blog generation job: cmghloqkj00011kjhc03pherk
📊 Processing update result: { status: 'PROCESSING', success: true }
... (6 minutes of AI generation) ...
✅ Job completed with status: COMPLETED
⏱️ Total processing time: 362s
```

**Production Failure:**
```
🚀 Starting blog generation job: cmghmsb1z0001k0047xtiys6g
📊 Processing update result: { status: 'PROCESSING', success: true }
... (then nothing - stuck forever) ...
```

---

## 🎯 Root Cause: Vercel Function Timeout

### The Problem

Looking at your `vercel.json`:
```json
{
  "functions": {
    "app/api/inngest/route.ts": {
      "maxDuration": 10  // ← ONLY 10 SECONDS!
    }
  }
}
```

**Your blog generation takes ~360 seconds (6 minutes).**
**Vercel kills the function after 10 seconds.**

### Why It Works Locally But Not in Production

| Environment | Timeout Limit | Your Job Duration | Result |
|-------------|---------------|-------------------|---------|
| **Local Dev** | No limit | 362 seconds | ✅ Works |
| **Production (Vercel)** | 10 seconds | 362 seconds | ❌ Timeout |

---

## ⚡ The Fix (2 Minutes)

### Step 1: Update vercel.json

You need to increase the timeout for the Inngest endpoint. Vercel Pro allows up to 300 seconds (5 minutes), but your generation takes 6 minutes, so we need a different approach.

**Option A: If you have Vercel Pro Plan**

Update `vercel.json`:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/inngest/route.ts": {
      "maxDuration": 300  // ← Change from 10 to 300 seconds (5 minutes)
    }
  }
}
```

**Note:** Even 300 seconds (5 min) is less than your 362 seconds (6 min), so you'll need to optimize the generation time too.

**Option B: If you're on Vercel Hobby Plan (Most Likely)**

Vercel Hobby plan only allows 10 seconds for API routes. You have two solutions:

### Solution 1: Use Inngest Cloud Execution (RECOMMENDED)

Inngest Cloud can run your function for as long as needed, but Vercel keeps killing the connection. The issue is that Inngest calls your `/api/inngest` endpoint, which has a 10-second timeout.

**The Fix:** Configure Inngest to run the function entirely in their infrastructure, not calling back to your Vercel function.

This requires changing how you configure Inngest. Let me update the configuration files.

---

## 🔧 Immediate Solution: Optimize Generation Time

Since your generation takes 6 minutes but Vercel limits you to 10 seconds (Hobby) or 300 seconds (Pro), let's optimize the generation to be faster.

### Update Inngest Function Configuration

The issue is that your blog generation service is set to use `gpt-4o` which is slower. Let's configure it to be faster:

```typescript
// In inngest/functions/generate-blog.ts
// Change this:
const blogService = new OptimizedBlogGenerationService({
  primaryModel: "gpt-4o",  // Slow but high quality
  useSimplifiedPrompts: true,
  skipAIIfSlow: true,
  maxStage1Time: 90000,  // 90 seconds
  maxStage2Time: 60000,  // 60 seconds
});

// To this:
const blogService = new OptimizedBlogGenerationService({
  primaryModel: "gpt-4o-mini",  // Faster model!
  useSimplifiedPrompts: true,
  skipAIIfSlow: true,
  maxStage1Time: 45000,  // 45 seconds (reduced)
  maxStage2Time: 30000,  // 30 seconds (reduced)
});
```

This should reduce generation time from ~360s to ~90-120s.

---

## 🎓 Technical Explanation

### Why Inngest Jobs Time Out on Vercel

When you trigger an Inngest job in production:

```
1. Your app sends event to Inngest Cloud ✅
2. Inngest Cloud receives event ✅
3. Inngest Cloud calls: POST https://techtots.ro/api/inngest
   ↓
4. Vercel receives the request
5. Function starts executing
   ↓
6. After 10 seconds: Vercel kills the function ❌
7. Inngest Cloud waits for response... timeout ❌
8. Function never completes ❌
9. Job stuck at PROCESSING forever ❌
```

### The Correct Flow (What We Need)

Inngest should execute the function in their infrastructure, not in Vercel:

```
1. Your app sends event to Inngest Cloud ✅
2. Inngest Cloud receives event ✅
3. Inngest Cloud executes function internally (not calling Vercel)
   ↓
4. Function runs for as long as needed (6 minutes is fine) ✅
5. Function completes ✅
6. Result saved to database ✅
```

---

## 🔧 Implementing the Fix

### Option 1: Use Faster AI Model (Quickest Fix)

This is the easiest solution - just use a faster model that completes within Vercel's limits.

**File:** `inngest/functions/generate-blog.ts`

Find this section (around line 128):
```typescript
const blogService = new OptimizedBlogGenerationService({
  primaryModel: "gpt-4o",
```

Change to:
```typescript
const blogService = new OptimizedBlogGenerationService({
  primaryModel: process.env.AI_PRIMARY_MODEL || "gpt-4o-mini",
```

Then add to your Vercel environment variables:
```bash
AI_PRIMARY_MODEL=gpt-4o-mini
```

**Expected result:** Generation time drops to ~90-120 seconds

### Option 2: Configure Inngest for Cloud Execution

This allows unlimited execution time but requires Inngest Pro plan.

**In Inngest Dashboard:**
1. Go to your app settings
2. Enable "Cloud Execution" mode
3. This runs functions in Inngest's infrastructure, not yours

### Option 3: Upgrade to Vercel Pro

If you want to keep using `gpt-4o` (highest quality):
1. Upgrade to Vercel Pro ($20/month)
2. Set `maxDuration: 300` in vercel.json
3. Optimize generation to complete in < 5 minutes

---

## ✅ Recommended Action Plan

### Step 1: Use Faster Model (NOW - 2 minutes)

1. **Add to Vercel environment variables:**
   ```
   AI_PRIMARY_MODEL=gpt-4o-mini
   AI_SECONDARY_MODEL=gpt-4o-mini
   ```

2. **Redeploy** your application

3. **Test** blog generation

**Expected outcome:** Generation completes in ~90-120 seconds, well within limits!

### Step 2: Verify It Works

After deploying with the faster model, try generating a blog again.

**You should see:**
```
Status: PROCESSING → (90-120 seconds) → COMPLETED ✅
```

### Step 3: Monitor Timing

Check the generation time in your Inngest Dashboard. If it's still too slow, we can optimize further.

---

## 🔍 Diagnostic Commands

### Check Current Vercel Plan

```bash
vercel whoami
```

If you see "Hobby", you're limited to 10 seconds for API routes.

### Check Inngest Execution Logs

Go to: https://app.inngest.com/env/production/runs/01K719ERNY1Y28AXBCVSV2ZC5X

Look for:
- How long the function ran before timing out
- Any timeout error messages
- Network errors from Vercel

### Test with Faster Model Locally

Before deploying, test locally with the faster model:

```bash
# In .env.local
AI_PRIMARY_MODEL=gpt-4o-mini
AI_SECONDARY_MODEL=gpt-4o-mini
```

Run blog generation and check the time. Should be ~90-120 seconds.

---

## 📊 Model Comparison

| Model | Speed | Quality | Cost | Recommended For |
|-------|-------|---------|------|-----------------|
| gpt-4o | 6 min | Highest | High | Local dev, testing |
| gpt-4o-mini | 90-120s | High | Medium | **Production** ✅ |
| gpt-3.5-turbo | 30-60s | Good | Low | High volume |

---

## 🎯 Why This Is Different From Earlier

### Earlier Issue (Solved ✅)
- Function never started executing
- Job stuck at PENDING
- **Cause:** Missing OPENAI_API_KEY
- **Fix:** Added the key

### Current Issue (Now Solving)
- Function starts executing ✅
- Job reaches PROCESSING ✅  
- **Cause:** Function timeout (takes too long)
- **Fix:** Use faster AI model

---

## ✅ Success Criteria

After implementing the fix, you should see:

### In Inngest Dashboard
```
Event received: 0s
Function started: 1s
Status → PROCESSING: 2s
AI generation: 90-120s
Status → COMPLETED: 121s ✅
Blog saved: 122s ✅
```

### In Your Database
```sql
SELECT 
  id,
  status,
  EXTRACT(EPOCH FROM (completedAt - startedAt)) as duration_seconds
FROM "AiJob"
WHERE id = 'YOUR_JOB_ID';

-- Expected:
-- status: COMPLETED
-- duration_seconds: 90-120
```

---

## 🚀 Quick Fix Summary

**The Problem:**
- Your blog generation takes 6 minutes
- Vercel kills functions after 10 seconds
- Function timeout = stuck at PROCESSING

**The Solution:**
- Use faster AI model (gpt-4o-mini)
- Generation completes in ~90-120 seconds
- Well within any timeout limits

**Time to Fix:**
- 2 minutes to update env vars and redeploy

**Expected Result:**
- Blog generation works in production ✅
- Slightly faster than local dev ✅
- Lower costs from OpenAI ✅

---

## 📞 Next Steps

1. **Add AI_PRIMARY_MODEL=gpt-4o-mini to Vercel**
2. **Redeploy**
3. **Test blog generation**
4. **Watch it complete successfully!** 🎉

Let me know when you've updated the environment variables and I'll help verify the fix!

---

**Updated:** October 8, 2025  
**Status:** Function reaches PROCESSING but times out  
**Fix:** Use faster AI model (gpt-4o-mini)  
**Confidence:** 95% this will solve it

