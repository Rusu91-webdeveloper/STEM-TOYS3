# Railway Deployment Checklist ✅

Quick reference checklist for deploying Inngest server to Railway.

---

## 🚀 Pre-Deployment

- [ ] Railway account created and logged in
- [ ] GitHub repository connected to Railway
- [ ] Neon database accessible and connection string available
- [ ] Inngest account active with keys ready
- [ ] OpenAI API key with sufficient credits
- [ ] Latest code pushed to GitHub (with `0.0.0.0` binding fix)

---

## 🔧 Railway Configuration

### Build Settings

- [ ] Builder set to: **Docker**
- [ ] Dockerfile path set to: **Dockerfile.railway**
- [ ] Root directory set to: **/** (or empty)
- [ ] Generated Railway domain and saved URL

### Environment Variables

**Database:**

- [ ] `DATABASE_URL` added (from Neon, ends with `?sslmode=require`)
- [ ] `DIRECT_URL` added (same as DATABASE_URL for Neon)

**Inngest:**

- [ ] `INNGEST_EVENT_KEY` added (starts with `evt_`)
- [ ] `INNGEST_SIGNING_KEY` added (starts with `signkey_`)

**AI:**

- [ ] `OPENAI_API_KEY` added (starts with `sk-`)
- [ ] `AI_PRIMARY_PROVIDER` set to `openai`
- [ ] `AI_PRIMARY_MODEL` set to `gpt-4o-mini`
- [ ] `AI_SECONDARY_PROVIDER` set to `openai`
- [ ] `AI_SECONDARY_MODEL` set to `gpt-4o-mini`
- [ ] `AI_FALLBACK_MODEL` set to `gpt-4o-mini`
- [ ] `AI_ENHANCEMENT_ENABLED` set to `true`

**Environment:**

- [ ] `NODE_ENV` set to `production`

---

## ✅ Deployment Verification

### Railway Logs Check

- [ ] Logs show: "🔄 Starting Inngest Server..."
- [ ] Logs show: "📦 Loading environment variables..."
- [ ] Logs show: "✅ Loaded inngest client"
- [ ] Logs show: "✅ Loaded generate-blog function"
- [ ] Logs show: "✅ Loaded enhance-products function"
- [ ] Logs show: "✅ Loaded bulk-upload-products function"
- [ ] Logs show: "✅ Loaded supplier-bulk-upload-products function"
- [ ] Logs show: "✅ Loaded single-product-enhancement function"
- [ ] Logs show: "🚀 Inngest Server Started"
- [ ] Logs show: "📦 Registered 5 Inngest Functions"
- [ ] Logs show: "✅ Server ready to receive Inngest function calls"
- [ ] No error messages in logs

### Endpoint Tests

- [ ] Health check works: `curl https://your-url.railway.app/health`
- [ ] Returns: `{"status":"ok","service":"inngest-server"}`
- [ ] Functions list works: `curl https://your-url.railway.app/`
- [ ] Returns: JSON with 5 functions

---

## 🔗 Inngest Configuration

- [ ] Opened Inngest Dashboard: https://app.inngest.com/
- [ ] Found app: `stem-toys-blog-generation`
- [ ] Updated Serve API URL to Railway:
      `https://your-url.railway.app/api/inngest`
- [ ] Clicked "Sync" button
- [ ] Sync completed successfully
- [ ] Functions tab shows all 5 functions:
  - [ ] generate-blog
  - [ ] enhance-products
  - [ ] bulk-upload-products
  - [ ] supplier-bulk-upload-products
  - [ ] single-product-enhancement

---

## 🧪 End-to-End Testing

### Test Single Product Enhancement

- [ ] Opened: https://www.techtots.ro/admin/products
- [ ] Selected a product
- [ ] Clicked "Enhance with AI"
- [ ] Inngest Dashboard shows function triggered
- [ ] Function status: "Running" → "Completed"
- [ ] Product updated in database
- [ ] Railway logs show function execution
- [ ] No errors in logs

### Test Blog Generation

- [ ] Opened: https://www.techtots.ro/admin/blogs/new
- [ ] Created blog with AI
- [ ] Inngest Dashboard shows function triggered
- [ ] Function status: "Running" → "Completed"
- [ ] Blog created in database
- [ ] Railway logs show function execution
- [ ] No errors in logs

### Test Bulk Upload (Optional)

- [ ] Uploaded products via admin bulk upload
- [ ] Inngest Dashboard shows function triggered
- [ ] All products processed successfully
- [ ] No errors in Railway logs

---

## 🎯 Final Verification

- [ ] Railway service status: **"Active"** (green indicator)
- [ ] Railway memory usage: < 500MB
- [ ] Railway CPU usage: < 50%
- [ ] All 5 Inngest functions showing as active
- [ ] No failed jobs in Inngest Dashboard
- [ ] Production app working normally
- [ ] AI enhancements processing correctly
- [ ] Database updates happening correctly

---

## 📊 Post-Deployment Monitoring

### First Hour

- [ ] Check Railway logs every 10 minutes
- [ ] Monitor memory usage
- [ ] Verify functions executing successfully

### First Day

- [ ] Test all AI features at least once
- [ ] Check for any error patterns in logs
- [ ] Verify no timeout issues
- [ ] Confirm Inngest showing all successful runs

### First Week

- [ ] Monitor Railway usage (stay under 500 hours/month)
- [ ] Check for any memory leaks
- [ ] Verify consistent performance
- [ ] Review all function execution times

---

## 🚨 If Something Goes Wrong

### Build Failed

1. [ ] Check Railway build logs for exact error
2. [ ] Verify Dockerfile.railway exists
3. [ ] Verify tsconfig.json is copied to container
4. [ ] Check package.json dependencies
5. [ ] Try redeploying

### Healthcheck Failed

1. [ ] Check Railway **runtime logs** (not build logs)
2. [ ] Look for startup error messages
3. [ ] Verify all environment variables are set
4. [ ] Check database connectivity
5. [ ] Verify OpenAI API key is valid

### Functions Not Appearing in Inngest

1. [ ] Verify Inngest Serve API URL points to Railway
2. [ ] Check INNGEST_SIGNING_KEY matches exactly
3. [ ] Try re-syncing in Inngest Dashboard
4. [ ] Check Railway logs for registration messages

### Functions Timeout

1. [ ] Verify Inngest pointing to Railway (not Vercel)
2. [ ] Check Railway logs for actual execution time
3. [ ] Verify OpenAI API not rate-limited
4. [ ] Check database query performance

---

## 📝 Quick Commands Reference

```bash
# Test health endpoint
curl https://your-railway-url.railway.app/health

# Test functions list
curl https://your-railway-url.railway.app/

# Test Inngest endpoint (should return function definitions)
curl https://your-railway-url.railway.app/api/inngest
```

---

## ✅ Deployment Complete!

When all checkboxes above are checked:

- ✅ Railway successfully deployed
- ✅ All 5 functions registered
- ✅ Inngest connected to Railway
- ✅ AI enhancements working
- ✅ Production tested and verified

**Your Inngest server is live and running on Railway! 🎉**

---

## 📞 Need Help?

If any checkbox fails, refer to:

- **Full guide:** `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md`
- **Troubleshooting:** `TROUBLESHOOTING_INNGEST_PRODUCTION.md`
- **Quick reference:** `RAILWAY_DEPLOYMENT_GUIDE.md`

AI_PRIMARY_PROVIDER="openai" AI_SECONDARY_PROVIDER="openai"
DIRECT_URL="postgres://neondb_owner:npg_kfr3JCK0uTqg@ep-small-union-a2e4pe5c-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
OPENAI_API_KEY="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"
AI_PRIMARY_MODEL="gpt-4o-mini" AI_SECONDARY_MODEL="gpt-4o-mini"
NODE_ENV="production"
DATABASE_URL="postgres://neondb_owner:npg_kfr3JCK0uTqg@ep-small-union-a2e4pe5c-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
AI_FALLBACK_MODEL="gpt-4o-mini" AI_ENHANCEMENT_ENABLED="true"
AI_MAX_TOKENS="2000" AI_TEMPERATURE="0.7"
