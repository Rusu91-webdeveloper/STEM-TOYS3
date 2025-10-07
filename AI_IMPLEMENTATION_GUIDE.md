# 🤖 AI Implementation Guide - Complete Reference

**Last Updated:** October 7, 2025  
**Purpose:** Single source of truth for AI implementation in STEM-TOYS3 project

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [AI for Blog Generation](#ai-for-blog-generation)
3. [AI for Product Enhancement](#ai-for-product-enhancement)
4. [Configuration & Environment](#configuration--environment)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [AI Service Architecture](#ai-service-architecture)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

### AI Providers Supported

- **OpenAI** (GPT-4o, GPT-5-mini) - Primary for blogs
- **Google Gemini** (gemini-1.5-pro, gemini-1.5-flash) - Primary for products
- **Anthropic** (Claude) - Planned support

### Architecture Pattern

```
Frontend Admin UI
    ↓
API Routes (/api/admin/blog|products/ai-*)
    ↓
AI Service Layer (DualProvider | Optimized | Batch)
    ↓
AI Service Factory
    ↓
Base AI Service → OpenAI | Gemini | Anthropic
    ↓
AI Provider APIs
    ↓
Database (Prisma) → PostgreSQL
```

---

## AI for Blog Generation

### Purpose

Generate SEO-optimized, viral Romanian blog posts about STEM education and toys.

### Services

#### 1. OptimizedBlogGenerationService (Recommended)

**File:** `lib/ai/optimized-blog-generation-service.ts`

**Two-Stage Approach:**

- **Stage 1 (60-80s):** Core content generation (title, content, excerpt)
- **Stage 2 (30-50s):** SEO enhancement (metadata, keywords, structured data)
- **Total Time:** 90-130 seconds
- **Success Rate:** 95%+

**Configuration:**

```typescript
{
  primaryModel: "gpt-4o",           // Recommended for Romanian
  useSimplifiedPrompts: true,       // Faster, more reliable
  skipAIIfSlow: true,               // Fallback if AI times out
  maxStage1Time: 90000,             // 90 seconds
  maxStage2Time: 60000              // 60 seconds
}
```

#### 2. ThreeStageBlogPerfectionService (Premium Quality)

**File:** `lib/ai/three-stage-blog-perfection-service.ts`

**Three-Stage Approach:**

- **Stage 1:** Core content generation
- **Stage 2:** SEO optimization
- **Stage 3:** Final perfection pass (grammar, engagement, virality)
- **Total Time:** 120-180 seconds
- **Quality Score:** 10/10

### API Endpoint

**Route:** `POST /api/admin/blog/ai-generate`

**Request:**

```json
{
  "prompt": "jucării STEM pentru copii cu autism",
  "options": {
    "includeSEO": true,
    "includeCoverImage": true,
    "targetStemCategory": "GENERAL",
    "targetAudience": "parents",
    "tone": "educational",
    "includeCallToAction": true,
    "keywordFocus": "jucării STEM autism",
    "usePerfectionMode": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "blog": {
    "title": "Jucării STEM pentru Copii cu Autism...",
    "slug": "jucarii-stem-pentru-copii-cu-autism",
    "content": "...",
    "excerpt": "...",
    "tags": ["autism", "STEM", "educație"],
    "stemCategory": "GENERAL",
    "readingTime": 5,
    "metadata": {
      "seo": {
        "metaTitle": "...",
        "metaDescription": "...",
        "metaKeywords": ["..."],
        "focusKeyword": "jucării STEM autism"
      },
      "ai": {
        "aiGenerated": true,
        "generatedBy": "OptimizedBlogGenerationService",
        "modelVersion": "gpt-4o",
        "processingTime": 95000
      }
    }
  }
}
```

### Database Schema (Blog)

**Table:** `Blog`

**Key Fields:**

```prisma
model Blog {
  id           String       @id @default(cuid())
  title        String       // AI-generated
  slug         String       @unique
  excerpt      String       // AI-generated summary
  content      String       // Full AI-generated content
  coverImage   String?      // Optional AI image
  tags         String[]     // AI-generated tags
  metadata     Json?        // SEO + AI metadata
  stemCategory StemCategory // AI-classified
  readingTime  Int?         // Auto-calculated
  socialShares Int?         @default(0)
  isPublished  Boolean      @default(false)
  publishedAt  DateTime?
}
```

**Metadata Structure:**

```typescript
{
  seo: {
    metaTitle: string;              // SEO title (60-70 chars)
    metaDescription: string;        // SEO description (150-160 chars)
    metaKeywords: string[];         // Romanian keywords
    focusKeyword: string;           // Primary keyword
    secondaryKeywords: string[];    // Related keywords
    structuredData: object;         // JSON-LD for Google
    openGraph: object;              // Facebook sharing
    twitterCards: object;           // Twitter sharing
  },
  ai: {
    aiGenerated: true;
    generatedBy: string;            // Service name
    generationTimestamp: string;    // ISO timestamp
    originalPrompt: string;         // User's prompt
    processingTime: number;         // Milliseconds
    modelVersion: string;           // "gpt-4o"
    refinementApplied: boolean;     // Stage 2 completed
    viralOptimizationApplied: boolean;
  }
}
```

---

## AI for Product Enhancement

### Purpose

Automatically enhance product listings with:

- Detailed Romanian descriptions
- SEO-optimized metadata
- Age group classification
- STEM discipline categorization
- Learning outcomes
- Romanian curriculum alignment

### Services

#### 1. DualProviderEnhancementService (Recommended)

**File:** `lib/ai/dual-provider-enhancement-service.ts`

**Dual-Provider Approach:**

- **Primary Provider:** Gemini 1.5 Pro (fast, cost-effective)
- **Secondary Provider:** OpenAI GPT-4o-mini (refinement, validation)
- **Process Time:** 15-30 seconds per product

**What It Does:**

1. Analyzes product name, description, images
2. Generates 400-700 word Romanian description
3. Creates SEO metadata (title, description, keywords)
4. Classifies age group, STEM discipline, product type
5. Identifies learning outcomes
6. Aligns with Romanian curriculum

#### 2. BatchEnhancementService

**File:** `lib/ai/batch-enhancement-service.ts`

**Batch Processing:**

- Processes multiple products in parallel
- Progress tracking
- Error handling per product
- Retry logic
- Max 100 products per batch

### API Endpoints

#### 1. AI Enhancement Only

**Route:** `POST /api/admin/products/ai-enhance`

**Request:**

```json
{
  "products": [
    {
      "name": "Robot Kit STEM",
      "price": 299,
      "category": "robotics",
      "description": "Educational robot kit",
      "images": ["https://..."],
      "sku": "ROBOT-001"
    }
  ],
  "options": {
    "includeRomanianOptimization": true,
    "includeSEOMetadata": true,
    "includeLearningOutcomes": true,
    "includeAgeGroup": true,
    "includeStemDiscipline": true,
    "includeProductType": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "enhancedProducts": [
    {
      "name": "Robot Kit STEM",
      "enhancedDescription": "Descoperă lumea fascinantă a roboticii...",
      "metaTitle": "Robot Kit STEM - Învățare Prin Joacă | 6-8 Ani",
      "metaDescription": "Kit educațional de robotică pentru copii...",
      "metaKeywords": ["robot educațional", "STEM", "programare copii"],
      "ageGroup": "ELEMENTARY_6_8",
      "stemDiscipline": "TECHNOLOGY",
      "productType": "ROBOTICS",
      "learningOutcomes": [
        "PROBLEM_SOLVING",
        "CRITICAL_THINKING",
        "CREATIVITY"
      ],
      "romanianEducationalLevel": "PRIMAR",
      "romanianCompetencies": [
        "Gândire computațională",
        "Rezolvare de probleme"
      ],
      "tags": ["robot", "programare", "STEM", "educație"]
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "processingTime": 18500
  }
}
```

#### 2. AI Enhancement + Database Save

**Route:** `POST /api/admin/products/ai-enhance-and-save`

**Same request format as above, but also saves to database**

#### 3. Dual Provider Enhancement

**Route:** `POST /api/admin/products/dual-enhance`

**Enhanced control over primary/secondary providers**

### Database Schema (Product)

**Table:** `Product`

**Key Fields:**

```prisma
model Product {
  id                  String        @id @default(cuid())
  name                String        // Original name
  slug                String        @unique
  description         String?       // AI-enhanced description
  price               Float
  sku                 String?
  images              String[]
  tags                String[]      // AI-generated
  attributes          Json?         // SEO metadata stored here
  ageGroup            String?       // AI-classified enum
  stemDiscipline      String?       // AI-classified enum
  // ... other fields
}
```

**Age Group Enum:**

```typescript
"TODDLERS_1_3" |
  "PRESCHOOL_3_5" |
  "ELEMENTARY_6_8" |
  "MIDDLE_SCHOOL_9_12" |
  "TEENS_13_PLUS";
```

**STEM Discipline Enum:**

```typescript
"SCIENCE" | "TECHNOLOGY" | "ENGINEERING" | "MATHEMATICS" | "GENERAL";
```

**Product Type Enum:**

```typescript
"ROBOTICS" |
  "PUZZLES" |
  "CONSTRUCTION_SETS" |
  "EXPERIMENT_KITS" |
  "BOARD_GAMES";
```

**Attributes JSON (SEO Metadata):**

```typescript
{
  metaTitle: string;          // Stored in attributes.metaTitle
  metaDescription: string;    // Stored in attributes.metaDescription
  metaKeywords: string[];     // Stored in attributes.metaKeywords
  // ... other metadata
}
```

---

## Configuration & Environment

### Required Environment Variables

**File:** `.env.local`

```bash
# =============================================================================
# AI CONFIGURATION
# =============================================================================

# OpenAI (Required for blogs)
OPENAI_API_KEY=sk-proj-your-key-here

# Google Gemini (Required for products)
GEMINI_API_KEY=your-gemini-key-here

# Anthropic Claude (Optional)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Primary AI Configuration
AI_PROVIDER=openai                    # Default provider
AI_MODEL=gpt-4o                       # Default model
AI_MAX_TOKENS=2000                    # Max response tokens
AI_TEMPERATURE=0.7                    # Creativity (0-2)
AI_ENHANCEMENT_ENABLED=true           # Enable AI features

# Dual-Provider Blog Configuration
AI_PRIMARY_PROVIDER=openai            # Stage 1 provider
AI_PRIMARY_MODEL=gpt-4o               # Stage 1 model
AI_SECONDARY_PROVIDER=openai          # Stage 2 provider
AI_SECONDARY_MODEL=gpt-4o             # Stage 2 model
AI_FALLBACK_MODEL=gpt-4o              # Fallback if primary fails
```

### Configuration Access

**File:** `lib/config/environment.ts`

```typescript
import { getAIConfig } from "@/lib/config/environment";

const config = getAIConfig();
// {
//   openaiApiKey: string,
//   provider: "openai" | "anthropic" | "gemini",
//   model: string,
//   maxTokens: number,
//   temperature: number,
//   enhancementEnabled: boolean,
//   primaryProvider: string,
//   primaryModel: string,
//   secondaryProvider: string,
//   secondaryModel: string,
//   isConfigured: boolean
// }
```

---

## AI Service Architecture

### Factory Pattern

**File:** `lib/ai/ai-service-factory.ts`

```typescript
import { AIServiceFactory } from "@/lib/ai/ai-service-factory";

// Get default service
const service = AIServiceFactory.getDefaultService();

// Get specific provider
const openai = AIServiceFactory.getService("openai");
const gemini = AIServiceFactory.getService("gemini");

// Check availability
const isAvailable = AIServiceFactory.isProviderAvailable("openai");

// Get health status
const health = await AIServiceFactory.getServiceHealth();
```

### Base Service Interface

**File:** `lib/ai/base-ai-service.ts`

All AI services extend `BaseAIService`:

```typescript
abstract class BaseAIService {
  // Generate content
  async generateContent(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<string>;

  // Generate with system + user prompts
  async generateWithSystemPrompt(
    systemPrompt: string,
    userPrompt: string,
    options?: AIRequestOptions
  ): Promise<string>;

  // Generate structured JSON
  async generateStructuredContent<T>(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<T>;

  // Test connection
  async testConnection(): Promise<boolean>;
}
```

### OpenAI Service

**File:** `lib/ai/openai-service.ts`

**Models:**

- `gpt-4o` - Recommended for Romanian blog generation
- `gpt-5-mini` - Faster, cheaper, but issues with Romanian long-form
- `gpt-4-turbo` - Older model

**Features:**

- Streaming support
- Token usage tracking
- Cost estimation
- Error handling
- Retry logic

### Gemini Service

**File:** `lib/ai/gemini-service.ts`

**Models:**

- `gemini-1.5-pro` - High quality, good for product descriptions
- `gemini-1.5-flash` - Fast, cost-effective

**Features:**

- Structured output support
- Token counting
- Safety settings
- Error handling

---

## Troubleshooting

### Blog Generation Issues

#### Problem: Timeout after 180 seconds

**Solution:**

- Ensure `USE_SIMPLIFIED_BLOG_PROMPTS=true` in `.env.local`
- Use `OptimizedBlogGenerationService` (2-stage approach)
- Check AI_PRIMARY_MODEL is set to `gpt-4o` (not `gpt-5-mini`)

#### Problem: Empty content returned

**Solution:**

- GPT-5-mini has issues with Romanian long-form content
- Switch to `gpt-4o`: `AI_PRIMARY_MODEL=gpt-4o`
- Check OPENAI_API_KEY is valid

#### Problem: SEO metadata missing

**Solution:**

- Metadata is stored in `blog.metadata.seo.*` (JSON field)
- Check API response includes `metadata` object
- Verify database save logic includes metadata

### Product Enhancement Issues

#### Problem: Wrong age group classification

**Solution:**

- Check product description includes age indicators
- Review age group determination rules in `dual-provider-enhancement-service.ts`
- Common patterns: "ages 6-8", "6+ years", "preschool", etc.

#### Problem: AI enhancement disabled

**Solution:**

```bash
# Check environment variables
AI_ENHANCEMENT_ENABLED=true
OPENAI_API_KEY=sk-proj-...  # or GEMINI_API_KEY
```

#### Problem: Batch processing fails partially

**Solution:**

- Check individual error messages in response
- Review `BatchEnhancementService` logs
- Reduce batch size if experiencing timeouts
- Ensure all products have minimum required fields (name, price, category)

### API Key Issues

#### Problem: 401 Unauthorized

**Solution:**

- Verify API key is correct and active
- Check environment variable name matches provider
- OpenAI: `OPENAI_API_KEY=sk-proj-...`
- Gemini: `GEMINI_API_KEY=...`

#### Problem: 429 Rate Limit

**Solution:**

- Implement exponential backoff (built into services)
- Reduce concurrent requests
- Upgrade API plan if needed
- Use batch processing with delays

---

## Best Practices

### Blog Generation

1. Use `gpt-4o` for Romanian content (best quality)
2. Enable simplified prompts for reliability
3. Set reasonable timeouts (90-130s total)
4. Always include SEO optimization
5. Use two-stage approach for 8/10 quality, three-stage for 10/10

### Product Enhancement

1. Use Gemini for primary (fast, cost-effective)
2. Use OpenAI for secondary refinement
3. Process in batches of 10-50 products
4. Always validate age group classification
5. Enable Romanian optimization for local market

### Cost Optimization

1. Use `gpt-5-mini` for simple tasks (not Romanian blogs)
2. Use `gemini-1.5-flash` for product descriptions
3. Batch process when possible
4. Cache common enhancements
5. Monitor token usage via API responses

### Performance

1. Use optimized/simplified prompts
2. Set appropriate timeout limits
3. Implement progress tracking for UX
4. Handle errors gracefully with fallbacks
5. Use parallel processing for batches

---

## Quick Reference

### Blog Generation

```typescript
// Route
POST / api / admin / blog / ai - generate;

// Service
import { OptimizedBlogGenerationService } from "@/lib/ai/optimized-blog-generation-service";

// Time: 90-130s
// Model: gpt-4o
// Output: Full blog with SEO metadata
```

### Product Enhancement

```typescript
// Route
POST / api / admin / products / ai - enhance;

// Service
import { DualProviderEnhancementService } from "@/lib/ai/dual-provider-enhancement-service";

// Time: 15-30s per product
// Models: gemini-1.5-pro + gpt-4o-mini
// Output: Enhanced product with Romanian content
```

### Configuration Check

```typescript
import { getAIConfig } from "@/lib/config/environment";

const config = getAIConfig();
if (!config.isConfigured) {
  console.error("AI not configured - check API keys");
}
```

---

## File Reference

### Core AI Services

- `lib/ai/ai-service-factory.ts` - Service factory
- `lib/ai/base-ai-service.ts` - Base interface
- `lib/ai/openai-service.ts` - OpenAI implementation
- `lib/ai/gemini-service.ts` - Gemini implementation

### Blog Services

- `lib/ai/optimized-blog-generation-service.ts` - 2-stage (recommended)
- `lib/ai/three-stage-blog-perfection-service.ts` - 3-stage (premium)
- `lib/ai/blog-types.ts` - Type definitions

### Product Services

- `lib/ai/dual-provider-enhancement-service.ts` - Dual AI (recommended)
- `lib/ai/product-enhancement-service.ts` - Single provider
- `lib/ai/batch-enhancement-service.ts` - Batch processing
- `lib/ai/enhanced-product-processor.ts` - Full pipeline

### API Routes

- `app/api/admin/blog/ai-generate/route.ts` - Blog generation
- `app/api/admin/products/ai-enhance/route.ts` - Product enhancement
- `app/api/admin/products/ai-enhance-and-save/route.ts` - Enhance + save
- `app/api/admin/products/dual-enhance/route.ts` - Dual provider

### Configuration

- `lib/config/environment.ts` - Environment config
- `.env.local` - Environment variables (not in git)
- `env.example` - Environment template

---

**End of AI Implementation Guide**

For questions or issues, check the codebase or create a GitHub issue.
