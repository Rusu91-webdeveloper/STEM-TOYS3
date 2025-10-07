# ⚡ Quick Test Commands - Blog Generation

## 🚀 SETUP (Run Once)

### Step 1: Update .env

```bash
./update-env-for-optimized-blogs.sh
```

### Step 2: Restart Server

```bash
npm run dev
```

---

## 🧪 TEST COMMANDS

### Test 1: Basic Blog Generation

**Via Admin Panel:**

1. Go to: `http://localhost:3000/admin/blog`
2. Click "Generate with AI"
3. Use prompt: "STEM toys vs classic toys for Romanian kids"
4. Wait 90-130 seconds
5. Check result!

---

### Test 2: Check What's Running

**Look for this in terminal:**

```bash
# If you see this → Optimized service is active:
"Starting Two-Stage Blog Generation"
"STAGE 1: Core Content Generation"
"STAGE 2: SEO & Viral Enhancement"

# If you see this → Old service (will timeout):
"Attempting AI blog generation with 3-minute timeout"
```

---

## 📊 SUCCESS INDICATORS

### ✅ **Optimized Service Working:**

```
Terminal shows:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 STAGE 1: Core Content Generation
   Prompt size: 2,145 characters (vs ~11,000)
✅ Stage 1 complete: Generated 12,847 characters
   Title: "Jucării STEM vs Clasice: Ghidul Părinților 2025"
✅ Stage 1 Success: 1,950 words generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 STAGE 2: SEO & Viral Enhancement
📊 Stage 2: Current word count: 1950 words
✅ Content expanded to 2,450 words
✅ FAQ section expanded
✅ Internal links added
✅ CTAs added
✅ Stage 2 complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TWO-STAGE GENERATION COMPLETE
⏱️  Total processing time: 110s
📊 Final word count: 2,450 words
🎯 Quality: SEO Enhanced
```

**This means:** ✅ Everything working perfectly!

---

### ❌ **Old Service (Will Timeout):**

```
Terminal shows:
Attempting AI blog generation with 3-minute timeout...
(long wait)
OpenAI API request timed out after 180 seconds
```

**This means:** ❌ Need to update .env file

---

## 🔧 IF OPTIMIZED SERVICE NOT ACTIVE

### Check .env File:

```bash
# Must have this:
USE_SIMPLIFIED_BLOG_PROMPTS=true
AI_PRIMARY_MODEL=gpt-4o
AI_SECONDARY_MODEL=gpt-4o
```

### Update and Restart:

```bash
# Fix .env:
./update-env-for-optimized-blogs.sh

# Restart:
npm run dev
```

---

## 🎯 PERFORMANCE TARGETS

### **After Implementation:**

| Metric              | Target      | How to Verify                             |
| ------------------- | ----------- | ----------------------------------------- |
| **Generation Time** | 90-130s     | Check terminal: "Total processing time"   |
| **Word Count**      | 2,200-2,800 | Check response: `generatedBlog.wordCount` |
| **FAQ Questions**   | 15+         | Count "1." "2." etc in FAQ section        |
| **Internal Links**  | 8-10        | Count `[text](/url)` in content           |
| **Quality Score**   | 95-100/100  | Check response: `seoScore`                |
| **Success Rate**    | 95%+        | No timeout errors                         |

---

## 🎉 SUCCESS CHECKLIST

After testing, you should have:

- [ ] ✅ Blog generated successfully (no timeout)
- [ ] ✅ Generation time: 90-130 seconds
- [ ] ✅ Word count: 2,200-2,800
- [ ] ✅ FAQ questions: 15+
- [ ] ✅ Internal links: 8-10
- [ ] ✅ CTAs: 5+
- [ ] ✅ Romanian content: Natural and fluent
- [ ] ✅ SEO metadata: Complete
- [ ] ✅ Quality score: 95-100/100

**If all checked → YOUR SYSTEM IS WORKING PERFECTLY!** 🎉

---

## 📞 NEED HELP?

### **Terminal shows timeout:**

→ Run: `./update-env-for-optimized-blogs.sh`  
→ Restart server

### **No "Two-Stage" message in terminal:**

→ Check .env has: `USE_SIMPLIFIED_BLOG_PROMPTS=true`  
→ Restart server

### **Want instant generation:**

→ Add to .env: `FORCE_BLOG_FALLBACK=true`  
→ Restart server

---

**Test Guide Created:** October 7, 2025  
**Status:** ✅ READY TO TEST  
**Expected Result:** Perfect blogs in 90-130 seconds!
