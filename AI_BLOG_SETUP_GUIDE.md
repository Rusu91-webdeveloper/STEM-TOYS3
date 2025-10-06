# AI Blog Generation Setup Guide

## 🚀 Quick Setup for AI Blog Generation

Your AI blog generation system is **already properly configured** and ready to
use! Here's how to ensure it works perfectly with your environment variables.

## 📋 Required Environment Variables

Add these to your `.env.local` file:

```bash
# =============================================================================
# AI CONFIGURATION FOR BLOG GENERATION
# =============================================================================

# Primary AI Provider (choose one)
OPENAI_API_KEY=sk-your-openai-api-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
# OR
GEMINI_API_KEY=your-gemini-api-key

# AI Provider Selection
AI_PROVIDER=openai
AI_MODEL=gpt-4o
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_ENHANCEMENT_ENABLED=true

# Dual-Provider Configuration for Blog Generation (✅ ACTIVE)
# These enable cost optimization and quality improvement
AI_PRIMARY_PROVIDER=openai
AI_PRIMARY_MODEL=gpt-5-mini
AI_SECONDARY_PROVIDER=openai
AI_SECONDARY_MODEL=gpt-5-mini
AI_FALLBACK_MODEL=gpt-4o
```

## 🔧 How to Set Up

### 1. **Create/Update `.env.local`**

```bash
# Copy from env.example and add your API keys
cp env.example .env.local

# Edit .env.local and add your actual API keys
nano .env.local
```

### 2. **Get Your API Keys**

#### For OpenAI (Recommended):

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local`: `OPENAI_API_KEY=sk-your-actual-key`

#### For Gemini (Alternative):

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local`: `GEMINI_API_KEY=your-actual-key`

### 3. **Verify Configuration**

Run this command to check your setup:

```bash
npm run dev
```

Then visit: `http://localhost:3000/admin/blog`

## 🎯 How to Use AI Blog Generation

### In Admin Panel (`/admin/blog`):

1. **Click "AI Generate Blog"** button (blue button with AI icon)
2. **Enter your prompt**:
   - Example: "jucării STEM pentru copii cu autism"
   - Example: "cum să fac copilul să iubească matematica"
   - Example: "beneficiile roboticei pentru copii"

3. **Configure options**:
   - ✅ Include SEO (recommended)
   - ✅ Include Call to Action
   - Choose STEM category
   - Set tone (educational, conversational, etc.)

4. **Click "Generate Blog"**
5. **Review and edit** the generated content
6. **Save to database** or copy for manual use

## 🔍 System Architecture

```
Your Admin Blog Page (/admin/blog)
    ↓
AIBlogGenerator Component
    ↓
/api/admin/blog/ai-generate API
    ↓
DualProviderBlogEnhancementService (✅ ACTIVE)
    ↓
Primary Provider (AI_PRIMARY_PROVIDER) → Initial Generation
    ↓
Secondary Provider (AI_SECONDARY_PROVIDER) → Refinement & Quality
    ↓
blog-generation-prompts.ts (✅ CONFIGURED)
    ↓
AI Models with your API keys (Cost Optimized!)
```

## ✅ What's Already Working

- ✅ **Prompt System**: Romanian-optimized prompts for viral content
- ✅ **Environment Integration**: Uses your `.env.local` variables
- ✅ **Dual-Provider System**: Cost-optimized AI generation (✅ ACTIVE)
- ✅ **Admin Interface**: Integrated into `/admin/blog` page
- ✅ **SEO Optimization**: Generates meta tags, keywords, structured data
- ✅ **Romanian Language**: Perfect Romanian language optimization
- ✅ **Cultural Context**: Romanian education system integration
- ✅ **Conversion Optimization**: Built-in CTAs and urgency elements

## 🎯 Generated Content Features

Your AI will generate:

1. **Viral Titles**: Romanian-optimized, SEO-friendly titles
2. **Compelling Content**: 800-1200 words, mobile-optimized
3. **SEO Metadata**: Meta titles, descriptions, keywords
4. **Structured Data**: JSON-LD for Google
5. **Social Media**: Open Graph and Twitter Cards
6. **Romanian Context**: Cultural references, local examples
7. **Conversion Elements**: CTAs, urgency, social proof

## 🔧 Troubleshooting

### If AI Generation Fails:

1. **Check API Keys**: Ensure your API keys are valid and have credits
2. **Check Environment**: Restart your dev server after changing `.env.local`
3. **Check Console**: Look for error messages in browser console
4. **Check Network**: Verify API calls in Network tab

### Common Issues:

```bash
# Error: "No AI API keys configured"
# Solution: Add your API key to .env.local

# Error: "API key not found for provider"
# Solution: Check AI_PROVIDER matches your API key

# Error: "Request timeout"
# Solution: Check your internet connection and API credits
```

## 📊 Environment Variable Reference

| Variable                 | Description                | Default  | Required                 |
| ------------------------ | -------------------------- | -------- | ------------------------ |
| `OPENAI_API_KEY`         | OpenAI API key             | -        | Yes (if using OpenAI)    |
| `ANTHROPIC_API_KEY`      | Anthropic API key          | -        | Yes (if using Anthropic) |
| `GEMINI_API_KEY`         | Gemini API key             | -        | Yes (if using Gemini)    |
| `AI_PROVIDER`            | Primary AI provider        | `openai` | Yes                      |
| `AI_MODEL`               | AI model to use            | `gpt-4o` | Yes                      |
| `AI_MAX_TOKENS`          | Maximum tokens per request | `2000`   | No                       |
| `AI_TEMPERATURE`         | Creativity level (0-1)     | `0.7`    | No                       |
| `AI_ENHANCEMENT_ENABLED` | Enable AI features         | `true`   | No                       |
| `AI_PRIMARY_PROVIDER`    | Primary provider (dual)    | `openai` | No (for optimization)    |
| `AI_PRIMARY_MODEL`       | Primary model (dual)       | `gpt-4o` | No (for optimization)    |
| `AI_SECONDARY_PROVIDER`  | Secondary provider (dual)  | `openai` | No (for optimization)    |
| `AI_SECONDARY_MODEL`     | Secondary model (dual)     | `gpt-4o` | No (for optimization)    |
| `AI_FALLBACK_MODEL`      | Fallback model (dual)      | `gpt-4o` | No (for error recovery)  |

## 🚀 Ready to Use!

Your AI blog generation system is **fully configured** and ready to create viral
Romanian STEM content. Just add your API keys to `.env.local` and start
generating!

### Next Steps:

1. Add your API keys to `.env.local`
2. Restart your development server
3. Visit `/admin/blog`
4. Click "AI Generate Blog"
5. Create amazing Romanian STEM content!

---

**Need Help?** Check the console for error messages or verify your API keys are
working.
