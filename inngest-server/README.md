# Inngest Server - Standalone Deployment

This is a standalone Express server that runs only the Inngest endpoint. It's
deployed separately to Railway to bypass Vercel Hobby plan's 60-second timeout
limit.

## Purpose

- Handles long-running Inngest functions (blog generation, product enhancement,
  bulk uploads)
- Bypasses Vercel's 60-second timeout on Hobby plan
- Uses Railway's free tier (500 hours/month)
- No timeout limits on function execution

## Registered Functions

This server handles 5 Inngest functions:

1. **generate-blog** - Generate Blog with AI
   - Event: `blog/generate.requested`
   - Duration: 90-120 seconds
   - Purpose: AI-powered blog post generation

2. **enhance-products** - Enhance Products with AI
   - Event: `products/enhance.requested`
   - Duration: 60-90 seconds
   - Purpose: Batch product enhancement with AI

3. **bulk-upload-products** - Bulk Upload Products (Admin)
   - Event: `products/bulk-upload.requested`
   - Duration: Variable (depends on product count)
   - Purpose: Admin bulk product uploads with optional AI enhancement

4. **supplier-bulk-upload-products** - Bulk Upload Products (Supplier)
   - Event: `products/supplier-bulk-upload.requested`
   - Duration: Variable (depends on product count)
   - Purpose: Supplier bulk product uploads with optional AI enhancement

5. **single-product-enhancement** - Single Product Enhancement with Preview
   - Event: `products/single-product-enhancement.requested`
   - Duration: 30-60 seconds
   - Purpose: AI enhancement for individual products with preview generation

## Architecture

```
Main App (Vercel) → Creates jobs, sends events to Inngest Cloud
                                    ↓
Inngest Cloud → Routes events to this Railway endpoint
                                    ↓
Railway Server (no timeout) → Executes Inngest functions (30-120s+)
                                    ↓
Database → Saves job results and updates status
```

**Flow Example (Single Product Enhancement):**

1. Admin clicks "Enhance with AI" in `/admin/products`
2. API route creates AiJob record and sends event to Inngest
3. Inngest Cloud routes `products/single-product-enhancement.requested` to
   Railway
4. Railway server executes `singleProductEnhancementJob` function
5. AI enhancement completes, results saved to database
6. Frontend polls job status and displays preview

## Local Development

1. **Install dependencies:**

   ```bash
   cd inngest-server
   npm install
   ```

2. **Set environment variables:** Create `.env` file based on `.env.example`

3. **Run server:**

   ```bash
   npm start
   ```

4. **Test health endpoint:**
   ```bash
   curl http://localhost:3001/health
   ```

## Deployment to Railway

### Option 1: Via Railway Dashboard (Recommended)

1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. **Important:** Do NOT set a root directory - leave it empty
7. Railway will detect `Dockerfile.railway` and use it automatically
8. Add environment variables (see below)
9. Set start command (if needed): `node inngest-server/server.js`
10. Click "Deploy"

### Option 2: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

## Environment Variables

Add these in Railway dashboard:

**Required:**

- `DATABASE_URL` - Your Neon Postgres connection string
- `DIRECT_URL` - Same as DATABASE_URL
- `INNGEST_EVENT_KEY` - From Inngest dashboard
- `INNGEST_SIGNING_KEY` - From Inngest dashboard
- `OPENAI_API_KEY` - Your OpenAI API key
- `AI_PRIMARY_MODEL` - Set to `gpt-4o-mini`
- `AI_SECONDARY_MODEL` - Set to `gpt-4o-mini`
- `NODE_ENV` - Set to `production`
- `PORT` - Railway will set this automatically

## After Deployment

1. **Get Railway URL:**
   - From Railway dashboard: `https://your-app.railway.app`

2. **Update Inngest Dashboard:**
   - Go to [Inngest Dashboard](https://app.inngest.com/)
   - Navigate to app: `stem-toys-blog-generation`
   - Update app URL from Vercel to Railway URL
   - Click "Sync" to register functions

3. **Test:**
   ```bash
   curl https://your-app.railway.app/health
   ```

## Monitoring

- **Railway Logs:** Available in Railway dashboard
- **Inngest Logs:**
  [Inngest Dashboard](https://app.inngest.com/env/production/stream)
- **Database:** Check `AiJob` table for job status

## Troubleshooting

**Server won't start:**

- Check Railway logs for errors
- Verify all environment variables are set
- Ensure DATABASE_URL is accessible from Railway

**Functions not executing:**

- Verify Inngest dashboard points to Railway URL
- Check INNGEST_SIGNING_KEY matches
- Ensure functions are synced in Inngest dashboard

**Timeouts still occurring:**

- Check Railway logs for actual execution time
- Verify AI_PRIMARY_MODEL is set to gpt-4o-mini
- Ensure OPENAI_API_KEY has sufficient credits

## Files

- `server.js` - Express server with Inngest endpoint
- `package.json` - Dependencies
- `railway.json` - Railway deployment configuration
- `.gitignore` - Git ignore rules
- `README.md` - This file

## Dependencies

- **express**: Web server framework
- **inngest**: Inngest SDK for function execution
- **@prisma/client**: Database access
- **dotenv**: Environment variable management

## Endpoints

- `GET /` - Server info
- `GET /health` - Health check
- `POST /api/inngest` - Inngest webhook endpoint (used by Inngest Cloud)
- `GET /api/inngest` - Inngest discovery endpoint (used by Inngest Cloud)
- `PUT /api/inngest` - Inngest function updates (used by Inngest Cloud)

## Cost

- **Railway Free Tier:** 500 hours/month ($0)
- **OpenAI (gpt-4o-mini):** ~$0.01 per blog ($0.30/month for 30 blogs)
- **Total:** Essentially free for moderate usage

## Security

- Never commit `.env` file (included in `.gitignore`)
- Environment variables stored securely in Railway
- INNGEST_SIGNING_KEY validates all requests from Inngest Cloud
- Database credentials encrypted in transit

## Maintenance

- **Updates:** Push to GitHub, Railway auto-deploys
- **Monitoring:** Check Railway dashboard for uptime/logs
- **Scaling:** Railway auto-scales based on usage
