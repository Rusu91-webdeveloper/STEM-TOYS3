# 🚀 START HERE: Railway Deployment for Inngest Server

**Quick Start Guide** | Last Updated: October 11, 2025

---

## ⚡ What You're Deploying

A **standalone Inngest server** that runs your AI-powered background jobs without Vercel's 60-second timeout limit.

**5 Functions:**
1. Blog generation (90-120s)
2. Product enhancement (60-90s)  
3. Bulk uploads (60-180s)
4. Supplier uploads (60-180s)
5. Single product enhancement (30-60s)

---

## 📚 Documentation Files

I've created 4 guides for you:

### 1. **RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md** ⭐ START HERE
- Full step-by-step instructions
- Complete project analysis
- All environment variables explained
- Troubleshooting for every issue
- **📖 READ THIS FIRST**

### 2. **RAILWAY_DEPLOYMENT_CHECKLIST.md** ✅ USE WHILE DEPLOYING
- Quick checklist format
- Check boxes for each step
- Perfect for tracking progress
- **📋 USE THIS DURING DEPLOYMENT**

### 3. **TROUBLESHOOTING_INNGEST_PRODUCTION.md** 🔧 IF PROBLEMS
- Runtime log analysis
- Common error patterns
- Quick fixes
- **🆘 USE IF HEALTHCHECK FAILS**

### 4. **RAILWAY_DEPLOYMENT_GUIDE.md** 📝 REFERENCE
- Original deployment guide
- Additional troubleshooting
- Railway-specific tips
- **📖 USE AS REFERENCE**

---

## 🎯 Quick Start (3 Steps)

### Step 1: Open the Complete Guide
```
Open: RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md
```

### Step 2: Prepare Your Keys

Gather these before starting:

**Database (Neon):**
- https://console.neon.tech/ → Your project → Connection string
- Copy BOTH pooled and direct URLs

**Inngest:**
- https://app.inngest.com/ → Settings → Keys
- Copy Event Key and Signing Key

**OpenAI:**
- https://platform.openai.com/api-keys
- Copy or create API key

### Step 3: Follow the Guide + Use Checklist

1. Open `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md` in one window
2. Open `RAILWAY_DEPLOYMENT_CHECKLIST.md` in another window
3. Follow guide step-by-step
4. Check off boxes as you complete each step

---

## 🔍 What's Already Fixed

Your code already has these critical fixes applied:

✅ **Server binding to 0.0.0.0** (Railway requirement)
```javascript
// inngest-server/server.js line 88
app.listen(PORT, "0.0.0.0", () => { ... });
```

✅ **Detailed startup logging** (catches errors)
```javascript
console.log("🔄 Starting Inngest Server...");
console.log("✅ Loaded inngest client");
// ... logs each function load
```

✅ **Proper error handling** (shows exact errors)
```javascript
try {
  // Load functions
} catch (error) {
  console.error("❌ Failed:", error.message);
  process.exit(1);
}
```

✅ **Docker configuration** (Dockerfile.railway)
- Prisma client generation
- All dependencies installed
- Correct build order

---

## ⚠️ Critical Requirements

**MUST HAVE these environment variables in Railway:**

```bash
# Database
DATABASE_URL=postgresql://...?sslmode=require
DIRECT_URL=postgresql://...?sslmode=require

# Inngest
INNGEST_EVENT_KEY=evt_...
INNGEST_SIGNING_KEY=signkey_...

# OpenAI
OPENAI_API_KEY=sk-...

# AI Config
AI_PRIMARY_PROVIDER=openai
AI_PRIMARY_MODEL=gpt-4o-mini
AI_SECONDARY_PROVIDER=openai
AI_SECONDARY_MODEL=gpt-4o-mini
AI_FALLBACK_MODEL=gpt-4o-mini

# Environment
NODE_ENV=production
```

**Missing ANY of these = Server will crash!**

---

## 🎬 Deployment Flow

```
1. Create Railway Project
   └── Connect GitHub repo
   └── Initial build (will fail - expected)

2. Configure Build Settings
   └── Set Dockerfile path
   └── Generate domain

3. Add Environment Variables ⚠️ CRITICAL
   └── All variables from list above
   └── Double-check each one

4. Redeploy
   └── Watch logs for success messages
   └── Verify healthcheck passes

5. Update Inngest
   └── Point to Railway URL
   └── Sync functions

6. Test
   └── Single product enhancement
   └── Blog generation
   └── Check database updates
```

**Total Time: 15-20 minutes** (mostly waiting for builds)

---

## ✅ Success Indicators

**Railway Logs Should Show:**
```
✅ Loaded inngest client
✅ Loaded generate-blog function
✅ Loaded enhance-products function
✅ Loaded bulk-upload-products function
✅ Loaded supplier-bulk-upload-products function
✅ Loaded single-product-enhancement function
🚀 Inngest Server Started
📦 Registered 5 Inngest Functions
✅ Server ready to receive Inngest function calls
```

**Inngest Dashboard Should Show:**
- All 5 functions listed
- Serve API URL: `https://your-railway-url.railway.app/api/inngest`
- Functions status: Active

**Tests Should Pass:**
```bash
curl https://your-url.railway.app/health
# Returns: {"status":"ok"}

curl https://your-url.railway.app/
# Returns: {"functions":[...5 functions...]}
```

---

## 🚨 If Healthcheck Fails

**DO NOT panic!** This is common and usually means:

1. **Missing environment variable** (most common)
   - Check Railway Variables tab
   - Compare with required list above

2. **Database can't connect**
   - Verify DATABASE_URL is correct
   - Check Neon database is running

3. **OpenAI key invalid**
   - Verify key at platform.openai.com
   - Check account has credits

**How to debug:**
1. Open `TROUBLESHOOTING_INNGEST_PRODUCTION.md`
2. Go to Railway Dashboard → Logs tab
3. Look for error messages
4. Match error with troubleshooting guide

---

## 📊 Expected Timeline

- **Setup:** 5 minutes (gather keys, create project)
- **Build:** 5 minutes (Railway builds Docker image)
- **Deploy:** 1 minute (start container)
- **Configure:** 3 minutes (add environment variables)
- **Test:** 5 minutes (verify everything works)

**Total: 20 minutes** for complete deployment

---

## 🎯 Your Action Items

### Right Now:
1. ✅ Read this file (you're here!)
2. 📖 Open `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md`
3. 📋 Open `RAILWAY_DEPLOYMENT_CHECKLIST.md`
4. 🔑 Gather your API keys (Neon, Inngest, OpenAI)

### Then:
5. 🚀 Follow the guide step by step
6. ✅ Check off each item in the checklist
7. 🧪 Test everything works
8. 🎉 Celebrate successful deployment!

---

## 💡 Pro Tips

1. **Keep the checklist open** while deploying - check off items as you go
2. **Don't skip environment variables** - add ALL of them, even optional ones
3. **Watch Railway logs closely** - they tell you exactly what's wrong
4. **Test immediately after deploy** - catch issues early
5. **Save your Railway URL** - you'll need it for Inngest config

---

## 🆘 Need Help?

**If something goes wrong:**

1. **Check Railway Logs First**
   - Railway Dashboard → Your Service → Logs tab
   - Look for error messages

2. **Check Troubleshooting Guide**
   - Open `TROUBLESHOOTING_INNGEST_PRODUCTION.md`
   - Find your error pattern

3. **Verify Environment Variables**
   - Railway Dashboard → Your Service → Variables tab
   - Compare with required list

4. **Common Quick Fixes**
   - Redeploy: Railway Dashboard → "Deploy" button
   - Restart: Railway Dashboard → "Restart" button
   - Re-sync: Inngest Dashboard → "Sync" button

---

## 🎉 Ready to Deploy?

**Open these 2 files and let's go:**

1. `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md` - Your main guide
2. `RAILWAY_DEPLOYMENT_CHECKLIST.md` - Track your progress

**The Inngest server will be live on Railway in 20 minutes!** 🚀

---

## 📞 Questions?

All answers are in:
- `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md` - Complete instructions
- `TROUBLESHOOTING_INNGEST_PRODUCTION.md` - Error solutions  
- `RAILWAY_DEPLOYMENT_CHECKLIST.md` - Quick checklist

**Good luck! You've got this! 💪**

