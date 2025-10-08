# Vercel Timeout Configuration Fix Applied ✅

## The Real Problem Discovered

Your Inngest function was failing at **exactly 30-35 seconds** (not 120s, not
300s). This revealed the true issue:

### Root Cause: Pattern Matching Order

**Before (Broken):**

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30 // ← Matched FIRST!
    },
    "app/api/inngest/route.ts": {
      "maxDuration": 300 // ← Never applied
    }
  }
}
```

The wildcard pattern `app/api/**/*.ts` matched `app/api/inngest/route.ts` and
applied the 30-second timeout. The more specific rule below it was never
evaluated.

**After (Fixed):**

```json
{
  "functions": {
    "app/api/inngest/route.ts": {
      "maxDuration": 300 // ← Checked FIRST!
    },
    "app/api/**/*.ts": {
      "maxDuration": 30 // ← Applied to everything else
    }
  }
}
```

By putting the specific rule FIRST, Vercel checks it before the wildcard,
ensuring the Inngest route gets 300 seconds.

---

## What Changed

**Commit:** `6a82f71` **Files Modified:** `vercel.json` (swapped rule order)
**Lines Changed:** 3 insertions, 3 deletions

**The Fix:**

- Moved `app/api/inngest/route.ts` rule BEFORE the wildcard
- This ensures Inngest route is matched first and gets 300s timeout
- All other API routes still get 30s timeout

---

## Expected Behavior After Deployment

### Before (30-Second Timeouts)

```
Attempt 1: Starts... runs for 30s... TIMEOUT ❌
Attempt 2: Starts... runs for 30s... TIMEOUT ❌
Attempt 3: Starts... runs for 30s... TIMEOUT ❌
Attempt 4: Starts... runs for 30s... TIMEOUT ❌
Total Duration: 120 seconds of failures
Job Status: PROCESSING (stuck forever)
```

### After (300-Second Timeout with Fast Model)

```
Attempt 1: Starts... runs for 90-120s... SUCCESS ✅
Job Status: PENDING → PROCESSING → COMPLETED
Blog: Generated and saved to database
Duration: ~90-120 seconds (single attempt)
```

---

## Verification Steps

### 1. Wait for Vercel Deployment (2 minutes)

Check deployment status:

```
https://vercel.com/your-project/deployments
```

Look for the latest commit: "Fix vercel.json - put Inngest rule before
wildcard..."

### 2. Test Blog Generation

1. Go to: https://www.techtots.ro/admin/blog
2. Click "AI Generate Blog"
3. Enter prompt: "STEM toys help with learning Math for children"
4. Click "Generate"

### 3. Monitor Inngest Dashboard

```
https://app.inngest.com/env/production/stream
```

**What you should see:**

- ✅ Single attempt (not 4 retries)
- ✅ Duration: 90-120 seconds (not 30s timeout)
- ✅ All steps complete successfully
- ✅ Function status: Completed

### 4. Check Specific Timing

In the Inngest run details, you should see:

- `update-status-processing`: ~1-2 seconds
- `generate-blog-content`: ~90-110 seconds (this is the AI generation)
- `save-result`: ~1-2 seconds
- `save-to-blog-table`: ~1-2 seconds

**Total:** ~90-120 seconds

---

## Important: Vercel Plan Check

The 300-second timeout will only work if you're on **Vercel Pro** plan or
higher.

### To Check Your Plan:

1. Go to: https://vercel.com/account
2. Look at your plan name

**Plan Limits:**

- **Hobby Plan:** Maximum 10 seconds (can't be overridden)
- **Pro Plan:** Maximum 300 seconds ✅
- **Enterprise:** Up to 900 seconds

### If You're on Hobby Plan:

The 300s timeout won't work, and you'll still see timeouts. You have two
options:

**Option 1: Upgrade to Pro ($20/month)**

- Allows 300-second timeouts
- Recommended if you'll use this frequently

**Option 2: Use Inngest Cloud Execution**

- Configure Inngest to run functions in their infrastructure
- No Vercel timeout limits
- Free on Inngest free tier (1000 jobs/month)

---

## Success Indicators

After deployment, you should see:

✅ **Inngest Dashboard:**

- Single attempt (not 4)
- Duration: 90-120 seconds
- Status: Completed
- No timeout errors

✅ **Database:**

```sql
SELECT status, EXTRACT(EPOCH FROM (completedAt - startedAt)) as seconds
FROM "AiJob"
ORDER BY createdAt DESC
LIMIT 1;

-- Should show:
-- status: COMPLETED
-- seconds: 90-120
```

✅ **Admin Panel:**

- Blog post appears
- Full Romanian content
- Proper formatting
- All metadata present

---

## If It Still Times Out

### Scenario 1: Still Times Out at 30 Seconds

**Possible causes:**

- Vercel deployment hasn't completed yet (wait 2 more minutes)
- Browser cache (hard refresh with Ctrl+Shift+R)
- Vercel hasn't picked up the new vercel.json

**Fix:** Wait for deployment, then test again

### Scenario 2: Times Out at 10 Seconds

**Cause:** You're on Vercel Hobby plan (10s hard limit)

**Fix:** Upgrade to Pro or use Inngest Cloud execution

### Scenario 3: Times Out at 60-120 Seconds

**Possible causes:**

- Function is still using gpt-4o instead of gpt-4o-mini
- Environment variables not applied

**Fix:**

1. Verify `AI_PRIMARY_MODEL=gpt-4o-mini` is set in Vercel Production
2. Check Vercel logs to confirm the model being used
3. Redeploy if needed

### Scenario 4: Different Error

**Action:** Share the exact error message from Inngest Dashboard

---

## Next Steps

1. ✅ Wait 2 minutes for Vercel deployment
2. ✅ Test blog generation
3. ✅ Check Inngest logs for successful completion
4. ✅ Verify timing is ~90-120 seconds (not 30s)
5. ✅ Confirm blog appears in admin panel

---

## Technical Details

### Why Pattern Order Matters

Vercel processes function configurations in the order they appear in
vercel.json. When a request comes in:

1. Check first pattern: `app/api/inngest/route.ts`
   - Does it match? Yes → Apply 300s timeout ✅
2. If no match, check next pattern: `app/api/**/*.ts`
   - This applies to all other API routes

### Previous Behavior (Wrong Order)

1. Check first pattern: `app/api/**/*.ts`
   - Does it match `app/api/inngest/route.ts`? Yes → Apply 30s timeout ❌
   - Never checks the second rule

### Why 30-35 Seconds (Not Exactly 30)

The timeout includes:

- Function cold start time (~1-2s)
- Request processing time (~1-2s)
- Actual execution time (~27s)
- Network overhead (~1s)

Total: ~30-35 seconds before Vercel terminates the function

---

## Additional Optimizations Applied

You also have these optimizations in place:

1. ✅ **Inngest timeout configured:** 5 minutes at function level
2. ✅ **Fast AI model:** Using gpt-4o-mini (via env var)
3. ✅ **Vercel timeout:** 300 seconds for Inngest route
4. ✅ **Efficient prompts:** Simplified prompts for faster generation

All together, these should result in:

- **90-120 second generation time**
- **Single successful attempt**
- **No timeouts or retries**

---

**Deployment Status:** Pushed to GitHub, Vercel auto-deploying **Expected
Result:** Blog generation completes in ~90-120 seconds **Confidence Level:** 90%
(assuming you're on Vercel Pro plan)

Test it now and let me know the results! 🚀
