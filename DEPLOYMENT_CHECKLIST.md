# Railway Deployment Checklist

Use this checklist to track your progress deploying to Railway.

## Pre-Deployment ✅ 
- [x] Standalone server created
- [x] Code pushed to GitHub
- [x] Ready to deploy

## Railway Setup

### Account & Project
- [ ] Created Railway account (https://railway.app)
- [ ] Logged in with GitHub
- [ ] Created new project
- [ ] Selected STEM-TOYS3 repository

### Configuration
- [ ] Set root directory to `inngest-server`
- [ ] Verified start command: `node server.js`

### Environment Variables (Critical!)
- [ ] `DATABASE_URL` added
- [ ] `DIRECT_URL` added
- [ ] `INNGEST_EVENT_KEY` added
- [ ] `INNGEST_SIGNING_KEY` added
- [ ] `OPENAI_API_KEY` added
- [ ] `AI_PRIMARY_MODEL=gpt-4o-mini` added
- [ ] `AI_SECONDARY_MODEL=gpt-4o-mini` added
- [ ] `NODE_ENV=production` added

### Deployment
- [ ] Build completed successfully
- [ ] Server started (check logs)
- [ ] Generated domain
- [ ] Copied Railway URL: `https://__________________.up.railway.app`

### Testing
- [ ] Health check works: `curl https://your-url.railway.app/health`
- [ ] Returns `{"status":"ok"}`

## Inngest Configuration

### Update Dashboard
- [ ] Opened Inngest dashboard (https://app.inngest.com)
- [ ] Found app: `stem-toys-blog-generation`
- [ ] Updated app URL to Railway URL
- [ ] Clicked "Sync" button
- [ ] Verified 3 functions synced:
  - [ ] `generate-blog`
  - [ ] `enhance-products`
  - [ ] `bulk-upload-products`

## Final Testing

### Blog Generation Test
- [ ] Opened admin panel: https://www.techtots.ro/admin/blog
- [ ] Clicked "AI Generate Blog"
- [ ] Entered test prompt
- [ ] Started generation
- [ ] Watched Inngest dashboard (https://app.inngest.com/env/production/stream)
- [ ] Function executed (no timeout)
- [ ] Duration: 90-120 seconds
- [ ] Status reached COMPLETED
- [ ] Blog appeared in admin panel

### Database Verification
- [ ] Checked AiJob table
- [ ] Latest job status: COMPLETED
- [ ] Duration: 90-120 seconds
- [ ] Result field has content (not empty)

## 🎉 Success Criteria

All these should be true:
- [ ] Railway server is running (health check returns 200)
- [ ] Inngest functions are synced to Railway URL
- [ ] Blog generation completes in 90-120 seconds
- [ ] No timeout errors
- [ ] Job status changes to COMPLETED
- [ ] Full blog content is saved
- [ ] Blog appears in admin panel

---

## If Something Fails

**Deployment fails:**
- Check Railway logs for build errors
- Verify root directory is correct
- Ensure all files are in GitHub

**Health check fails:**
- Check Railway logs for startup errors
- Verify environment variables are set
- Test DATABASE_URL connectivity

**Functions don't sync:**
- Verify INNGEST_SIGNING_KEY matches
- Check Railway URL is correct in Inngest
- Click "Sync" again

**Generation still times out:**
- Verify Inngest points to Railway (not Vercel)
- Check AI_PRIMARY_MODEL is gpt-4o-mini
- Review Railway logs during generation

---

## Quick Commands

**Test health:**
```bash
curl https://YOUR-RAILWAY-URL.railway.app/health
```

**Check database:**
```sql
SELECT status, COUNT(*) FROM "AiJob" GROUP BY status;
```

**View Railway logs:**
Go to Railway dashboard → Your service → Logs tab

---

**Status:** Ready to deploy
**Estimated Time:** 20-25 minutes
**Next Step:** Follow RAILWAY_DEPLOYMENT_STEPS.md

