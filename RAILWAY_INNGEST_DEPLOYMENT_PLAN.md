# Deploy Inngest Endpoint to Railway - Implementation Plan

## Goal

Deploy the `/api/inngest` endpoint to Railway (free tier) to bypass Vercel Hobby
plan's 60-second timeout limit, allowing blog generation to complete in 90-120
seconds.

## Architecture Overview

**Before (Current):**

```
User → Vercel (techtots.ro) → Creates Job
                              ↓
Inngest Cloud ← Calls /api/inngest on Vercel
                ↓
        Times out after 60s ❌
```

**After (New):**

```
User → Vercel (techtots.ro) → Creates Job
                              ↓
Inngest Cloud ← Calls /api/inngest on Railway
                ↓
        Completes in 90-120s ✅
```

## Implementation Steps

### Step 1: Create Standalone Inngest Server

Create a new directory `inngest-server/` with a minimal Express server that only
serves the Inngest endpoint.

**Files to create:**

1. **inngest-server/package.json**

```json
{
  "name": "inngest-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "inngest": "^3.15.0",
    "@prisma/client": "^5.7.1"
  }
}
```

2. **inngest-server/server.js**

```javascript
import express from "express";
import { serve } from "inngest/express";
import { inngest } from "../inngest/client.js";
import { generateBlogJob } from "../inngest/functions/generate-blog.js";
import { enhanceProductsJob } from "../inngest/functions/enhance-products.js";
import { bulkUploadProductsJob } from "../inngest/functions/bulk-upload-products.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "inngest-server" });
});

// Inngest endpoint
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [generateBlogJob, enhanceProductsJob, bulkUploadProductsJob],
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

app.listen(PORT, () => {
  console.log(`Inngest server running on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/inngest`);
});
```

3. **inngest-server/.env.example**

```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
INNGEST_EVENT_KEY=vv0IWLw...
INNGEST_SIGNING_KEY=signkey-prod-...
OPENAI_API_KEY=sk-proj-...
AI_PRIMARY_MODEL=gpt-4o-mini
AI_SECONDARY_MODEL=gpt-4o-mini
NODE_ENV=production
```

4. **inngest-server/railway.json** (Railway configuration)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

### Step 2: Modify Imports for Standalone Server

The server needs to import your existing Inngest functions. We'll need to ensure
they can be imported in a standalone Node.js environment (not Next.js).

**Options:**

- Use TypeScript compilation for the standalone server
- Or convert imports to work with plain Node.js

### Step 3: Set Up Railway Project

1. **Sign up for Railway**: https://railway.app (free - 500 hours/month)
2. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   ```
3. **Create new project** in Railway dashboard
4. **Link to GitHub repo** or deploy directly

### Step 4: Configure Environment Variables in Railway

Add these environment variables in Railway dashboard:

**Required:**

- `DATABASE_URL` - Your Neon Postgres connection string
- `DIRECT_URL` - Same as DATABASE_URL for Neon
- `INNGEST_EVENT_KEY` - From Inngest dashboard
- `INNGEST_SIGNING_KEY` - From Inngest dashboard
- `OPENAI_API_KEY` - Your OpenAI key
- `AI_PRIMARY_MODEL=gpt-4o-mini`
- `AI_SECONDARY_MODEL=gpt-4o-mini`
- `NODE_ENV=production`
- `PORT=3001`

### Step 5: Deploy to Railway

**Option A: Via Railway Dashboard**

1. Click "New Project" → "Deploy from GitHub repo"
2. Select your repo
3. Set root directory: `inngest-server/`
4. Railway auto-detects Node.js and deploys
5. Get deployment URL: `https://your-app.railway.app`

**Option B: Via Railway CLI**

```bash
cd inngest-server
railway login
railway init
railway up
```

### Step 6: Configure Inngest to Use Railway Endpoint

1. **Go to Inngest Dashboard**: https://app.inngest.com/
2. **Navigate to your app**: `stem-toys-blog-generation`
3. **Update app URL**:
   - Old: `https://www.techtots.ro/api/inngest`
   - New: `https://your-app.railway.app/api/inngest`
4. **Sync functions**: Click "Sync" to register functions from new endpoint

### Step 7: Update Main App (Vercel)

Your main app on Vercel still sends events to Inngest Cloud (no change needed).
But you can optionally add monitoring:

**app/api/admin/blog/ai-generate/route.ts** - Add a comment:

```typescript
// Note: Inngest functions execute on Railway (https://your-app.railway.app)
// not on Vercel, to avoid timeout limits
```

### Step 8: Test the Integration

1. **Check Railway deployment**:

   ```bash
   curl https://your-app.railway.app/health
   # Should return: {"status":"ok","service":"inngest-server"}
   ```

2. **Generate a blog post** from admin panel

3. **Monitor in Inngest Dashboard**:
   - Event should be received
   - Function should execute from Railway
   - Should complete in 90-120 seconds
   - No timeout errors

4. **Verify in database**:
   ```sql
   SELECT status, EXTRACT(EPOCH FROM (completedAt - startedAt)) as duration
   FROM "AiJob"
   ORDER BY createdAt DESC
   LIMIT 1;
   ```

## Alternative Approach: Simpler (If Above is Complex)

If the standalone server is too complex, here's a simpler option:

### Use gpt-3.5-turbo (Fits in 60s Vercel limit)

**Change in production environment variable:**

```bash
AI_PRIMARY_MODEL=gpt-3.5-turbo
AI_SECONDARY_MODEL=gpt-3.5-turbo
```

**Pros:**

- No new deployment needed
- Works with current Vercel setup
- Generation time: 30-40 seconds (well under 60s limit)
- Cheaper than gpt-4o-mini

**Cons:**

- Slightly lower quality content
- Still better than gpt-3.5-turbo-instruct

## Cost Comparison

| Option                 | Setup Time | Monthly Cost   | Quality | Reliability |
| ---------------------- | ---------- | -------------- | ------- | ----------- |
| Railway + gpt-4o-mini  | 30 min     | $0 (free tier) | High    | Excellent   |
| Vercel Pro             | 5 min      | $20            | High    | Excellent   |
| gpt-3.5-turbo on Hobby | 2 min      | $0             | Good    | Good        |

## Recommended Approach

**Start with Railway deployment:**

1. Best quality (gpt-4o-mini)
2. No cost
3. No timeout limits
4. Scalable for future

**If too complex, use gpt-3.5-turbo** as interim solution while you learn
Railway.

## Files to Create/Modify

**New Files:**

1. `inngest-server/package.json`
2. `inngest-server/server.js`
3. `inngest-server/.env.example`
4. `inngest-server/railway.json`
5. `inngest-server/.gitignore`
6. `inngest-server/README.md`

**Modified Files:** None in main app (only configuration in Inngest dashboard)

## Testing Checklist

After deployment:

- [ ] Railway server health check returns 200
- [ ] Railway server responds to /api/inngest GET
- [ ] Inngest dashboard shows Railway URL
- [ ] Functions are synced in Inngest
- [ ] Blog generation completes (not timeout)
- [ ] Job status reaches COMPLETED
- [ ] Blog content is saved
- [ ] Duration is 90-120 seconds

## Rollback Plan

If Railway deployment fails:

1. Keep Inngest pointing to Vercel
2. Switch to gpt-3.5-turbo model
3. Blog generation will work (with slightly lower quality)

## Next Steps

Would you like me to:

1. Implement the Railway deployment (recommended)
2. Switch to gpt-3.5-turbo as quick fix
3. Explore other free platforms (Render, Fly.io)

---

**Estimated Implementation Time:**

- Railway setup: 15-20 minutes
- Testing: 5-10 minutes
- Total: ~30 minutes

**Recommended Action:** Start with Railway deployment for best long-term
solution.
