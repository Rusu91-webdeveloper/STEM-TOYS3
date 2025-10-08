# Quick Test Guide for Inngest Background Jobs

## 🚀 Quick Start (5 minutes)

### Step 1: Start Inngest Dev Server

```bash
# In Terminal 1
npx inngest-cli@latest dev
```

This will start the Inngest dev server at http://localhost:8288

### Step 2: Start Next.js Dev Server

```bash
# In Terminal 2
pnpm dev
```

Your app will be at http://localhost:3000

### Step 3: Test Blog Generation

1. Go to http://localhost:3000/admin/blog
2. Click "Generate Blog with AI"
3. Enter a prompt like "Write a blog about STEM toys for kids"
4. Click "Generate"
5. You should see:
   - Immediate response (job created)
   - Progress indicator showing "Blog generation in progress..."
   - After 2-3 minutes, the generated blog appears

### Step 4: Monitor Jobs

While the blog is generating, visit http://localhost:8288 to see:

- Job execution status
- Function runs
- Event history
- Any errors

## ✅ What to Verify

### In Your App

- [ ] Blog generation starts immediately (no timeout)
- [ ] Progress indicator shows during generation
- [ ] Blog appears after completion
- [ ] No timeout errors

### In Inngest Dev Server (http://localhost:8288)

- [ ] Event `blog/generate.requested` appears
- [ ] Function `generate-blog` is executing
- [ ] Function completes successfully
- [ ] Result is saved

### In Database

Check the `AiJob` table to verify:

```sql
SELECT * FROM "AiJob" ORDER BY "createdAt" DESC LIMIT 5;
```

You should see:

- Job record with status transitions: PENDING → PROCESSING → COMPLETED
- Input JSON with your prompt
- Result JSON with generated blog
- Timestamps for created/started/completed

## 🐛 Common Issues

### Issue: Inngest dev server not showing jobs

**Fix:** Make sure both servers are running and check
http://localhost:3000/api/inngest

### Issue: Jobs stuck in PENDING

**Fix:** Check Inngest dev server logs for errors. Make sure
`OptimizedBlogGenerationService` is working.

### Issue: TypeScript errors about `db.aiJob`

**Fix:** Restart dev server. The Prisma types should reload automatically.

## 📊 Expected Behavior

### Timing

- API response: < 1 second (returns job ID)
- Job processing: 150-210 seconds (full quality blog)
- Polling interval: Every 5 seconds
- Total user wait: 2-3 minutes with progress updates

### User Experience

```
[0s]   User clicks "Generate Blog"
[0s]   "Starting blog generation..." (0%)
[1s]   "Blog generation in progress..." (25%)
[30s]  "Generating high-quality blog content..." (40%)
[60s]  "Generating high-quality blog content..." (60%)
[90s]  "Generating high-quality blog content..." (80%)
[150s] "Blog generated successfully!" (100%)
[151s] Blog content appears
```

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ API returns immediately with job ID
2. ✅ Progress updates every 5 seconds
3. ✅ Inngest dev server shows active function execution
4. ✅ Blog appears after 2-3 minutes
5. ✅ Database has completed job record
6. ✅ **NO TIMEOUT ERRORS!**

## 📝 Notes

- First generation might take longer as OpenAI API warms up
- Check OpenAI API key is valid in .env
- Free Inngest tier: 1000 jobs/month
- Each blog generation = 1 job

## 🚢 Ready for Production?

Once local testing works:

1. Sign up at https://www.inngest.com/
2. Add environment variables to Vercel:
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`
3. Deploy to Vercel
4. Test in production
5. Monitor jobs at https://app.inngest.com/

---

**Happy Testing! 🎉**

If you see the blog generate without timeout errors, your implementation is
successful!
