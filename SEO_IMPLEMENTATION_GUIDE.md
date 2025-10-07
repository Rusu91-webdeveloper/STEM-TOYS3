# 🔍 SEO Implementation Guide - Complete Reference

**Last Updated:** October 7, 2025  
**Purpose:** Single source of truth for SEO implementation in STEM-TOYS3 project

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Metadata Implementation](#metadata-implementation)
3. [Structured Data (JSON-LD)](#structured-data-json-ld)
4. [Google Search Console Integration](#google-search-console-integration)
5. [SEO Analytics & Tracking](#seo-analytics--tracking)
6. [Per-Page SEO Configuration](#per-page-seo-configuration)
7. [Romanian Market Optimization](#romanian-market-optimization)
8. [Technical SEO](#technical-seo)
9. [SEO Dashboard](#seo-dashboard)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### SEO Architecture

```
Page Component
    ↓
generateMetadata() / export metadata
    ↓
createMetadata() from lib/metadata.ts
    ↓
HTML Meta Tags + OpenGraph + Twitter Cards
    ↓
JSON-LD Structured Data
    ↓
Google Search Console Tracking
    ↓
SEO Analytics Database
```

### Key Components

1. **Metadata Factory** (`lib/metadata.ts`) - Centralized metadata creation
2. **SEO Utilities** (`lib/utils/seo.ts`) - Helper functions for specific page
   types
3. **Google Search Console Service** - Analytics and ranking data
4. **SEO Analytics Database** - Historical tracking
5. **Per-Page Metadata** - Page-specific SEO configuration
6. **Structured Data** - JSON-LD for rich results

---

## Metadata Implementation

### Core Metadata Factory

**File:** `lib/metadata.ts`

**Function:** `createMetadata()`

**Features:**

- Multilingual alternates (Romanian + English)
- Canonical URLs
- OpenGraph tags (Facebook)
- Twitter Cards
- Robots directives
- Geo-location meta (Romanian market)
- Structured data injection
- Keywords optimization

**Basic Usage:**

```typescript
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Jucării STEM Premium | TechTots",
  description: "Descoperă jucării educaționale STEM pentru copii...",
  keywords: ["jucării STEM", "educație STEM", "jucării educaționale"],
  pathWithoutLocale: "/products",
  ogImage: "/images/products-og.png",
});
```

### Advanced Usage with Translations

```typescript
export const metadata = createMetadata({
  title: "Default Title",
  description: "Default Description",
  keywords: ["romanian", "keywords"],
  pathWithoutLocale: "/about",

  // Multilingual support
  translations: {
    ro: {
      title: "Despre TechTots România",
      description: "Suntem liderul pieței de jucării STEM din România...",
    },
    en: {
      title: "About TechTots Romania",
      description: "We are Romania's leading STEM toy provider...",
    },
  },

  // Structured data
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TechTots România",
    url: "https://techtots.ro",
  },

  // SEO controls
  noindex: false,
  canonicalUrl: "https://techtots.ro/about",
});
```

### Generated HTML Output

```html
<!-- Title -->
<title>Jucării STEM Premium | TechTots</title>

<!-- Description -->
<meta name="description" content="Descoperă jucării educaționale STEM..." />

<!-- Keywords -->
<meta
  name="keywords"
  content="jucării STEM, educație STEM, jucării educaționale"
/>

<!-- Canonical -->
<link rel="canonical" href="https://techtots.ro/products" />

<!-- Robots -->
<meta name="robots" content="index, follow" />
<meta
  name="googlebot"
  content="index, follow, max-image-preview:large, max-snippet:-1"
/>

<!-- OpenGraph (Facebook) -->
<meta property="og:title" content="Jucării STEM Premium | TechTots" />
<meta
  property="og:description"
  content="Descoperă jucării educaționale STEM..."
/>
<meta
  property="og:image"
  content="https://techtots.ro/images/products-og.png"
/>
<meta property="og:url" content="https://techtots.ro/products" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="ro_RO" />
<meta property="og:site_name" content="TechTots" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Jucării STEM Premium | TechTots" />
<meta
  name="twitter:description"
  content="Descoperă jucării educaționale STEM..."
/>
<meta
  name="twitter:image"
  content="https://techtots.ro/images/products-og.png"
/>
<meta name="twitter:site" content="@TechTotsRO" />

<!-- Hreflang (Multilingual) -->
<link rel="alternate" hreflang="ro" href="https://techtots.ro/products" />
<link rel="alternate" hreflang="en" href="https://techtots.ro/en/products" />
<link
  rel="alternate"
  hreflang="x-default"
  href="https://techtots.ro/products"
/>

<!-- Geo Location (Romanian Market) -->
<meta name="geo.placename" content="București" />
<meta name="geo.region" content="RO" />
<meta name="geo.position" content="44.4268;26.1025" />
```

---

## Structured Data (JSON-LD)

### Purpose

Structured data helps Google understand your content and enables rich results in
search.

### Implementation

**1. Pass Structured Data to Metadata:**

```typescript
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TechTots România",
  url: "https://techtots.ro",
  logo: "https://techtots.ro/logo.png",
  description: "Jucării STEM educaționale pentru copii",
  address: {
    "@type": "PostalAddress",
    addressLocality: "București",
    addressCountry: "RO",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+40-XXX-XXX-XXX",
    contactType: "customer service",
    availableLanguage: ["Romanian", "English"],
  },
};

export const metadata = createMetadata({
  title: "TechTots România",
  structuredData: organizationSchema,
});
```

**2. Renders as:**

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TechTots România",
    "url": "https://techtots.ro",
    ...
  }
</script>
```

### Common Schema Types

#### Product Schema

```typescript
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Robot Kit STEM",
  description: "Kit robotică educațională pentru copii 6-8 ani",
  image: "https://techtots.ro/products/robot-kit.jpg",
  sku: "ROBOT-001",
  offers: {
    "@type": "Offer",
    url: "https://techtots.ro/products/robot-kit",
    priceCurrency: "RON",
    price: "299.00",
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: "TechTots România",
    },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "127",
  },
};
```

#### Article/Blog Schema

```typescript
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Beneficiile Jucăriilor STEM pentru Copii",
  description: "Descoperă cum jucăriile STEM ajută...",
  image: "https://techtots.ro/blog/stem-benefits.jpg",
  author: {
    "@type": "Person",
    name: "TechTots Team",
  },
  publisher: {
    "@type": "Organization",
    name: "TechTots România",
    logo: {
      "@type": "ImageObject",
      url: "https://techtots.ro/logo.png",
    },
  },
  datePublished: "2025-10-07",
  dateModified: "2025-10-07",
};
```

#### Breadcrumb Schema

```typescript
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Acasă",
      item: "https://techtots.ro",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Produse",
      item: "https://techtots.ro/products",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Robotică",
      item: "https://techtots.ro/products/robotics",
    },
  ],
};
```

---

## Google Search Console Integration

### Setup

**1. Environment Variables:**

```bash
# .env.local
GSC_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
GSC_SITE_URL=https://techtots.ro
```

**2. Service Account Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a service account
3. Download JSON credentials
4. Add service account to Google Search Console
5. Copy email and private key to `.env.local`

### Features

**File:** `lib/services/google-search-console-service.ts`

#### Get Romanian Market Data

```typescript
import { gscService } from "@/lib/services/google-search-console-service";

// Get market overview for last 30 days
const marketData = await gscService.getRomanianMarketData(30);

// Returns:
{
  totalClicks: 1250,
  totalImpressions: 15000,
  averageCTR: 8.33,
  averagePosition: 12.5,
  topKeywords: [
    {
      keyword: "jucării STEM",
      position: 5.2,
      clicks: 230,
      impressions: 3200,
      ctr: 7.19,
      searchVolume: 5000,
      intent: "commercial"
    }
  ],
  topPages: [...],
  competitorAnalysis: {...}
}
```

#### Get Keyword Rankings

```typescript
const keywords = ["jucării STEM", "robotică copii", "experimente științifice"];
const rankings = await gscService.getKeywordRankings(keywords);

// Returns position, clicks, impressions, CTR for each keyword
```

#### Get Indexing Status

```typescript
const indexingStatus = await gscService.getSiteIndexingStatus();

// Returns:
{
  totalIndexed: 1234,
  totalSubmitted: 1250,
  indexingRate: 98.72,
  pendingIndexing: 16,
  indexingErrors: [...]
}
```

---

## SEO Analytics & Tracking

### Database Schema

**Table:** `SEOAnalytics`

```prisma
model SEOAnalytics {
  id               String   @id @default(cuid())
  keyword          String
  position         Float
  previousPosition Float?
  clicks           Int
  impressions      Int
  ctr              Float
  url              String?
  searchVolume     Int?
  difficulty       Int?
  intent           String?
  competitorGap    Boolean  @default(false)
  targetPage       String?
  dateRecorded     DateTime @default(now())
  dataSource       String   @default("GSC")
  country          String   @default("ROU")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### Automatic Daily Collection

**API Endpoint:** `POST /api/cron/daily-seo-analytics`

**Features:**

- Collects daily SEO data from Google Search Console
- Stores historical keyword rankings
- Tracks position changes
- Monitors CTR trends

**Setup Cron Job:**

```bash
# Vercel Cron (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/daily-seo-analytics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Manual Trigger:**

```bash
# Via API
curl -X POST https://techtots.ro/api/cron/daily-seo-analytics \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"

# Via Script
npm run seo-analytics:manual

# Via Dashboard Button
# Go to /admin/seo-dashboard and click "💾 Save Analytics"
```

### Query Historical Data

```typescript
import { prisma } from "@/lib/prisma";

// Get keyword ranking history
const history = await prisma.sEOAnalytics.findMany({
  where: {
    keyword: "jucării STEM",
    dateRecorded: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },
  orderBy: { dateRecorded: "asc" },
});

// Calculate position trend
const positionChange =
  history[history.length - 1].position - history[0].position;
```

---

## Per-Page SEO Configuration

### Homepage

**File:** `app/metadata.ts` or `app/page.tsx`

```typescript
import { createMetadata } from "@/lib/metadata";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TechTots România",
  url: "https://techtots.ro",
  logo: "https://techtots.ro/logo.png",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TechTots România",
  url: "https://techtots.ro",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://techtots.ro/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export const metadata = createMetadata({
  title: "Transformă Copilul Într-un Geniu STEM | TechTots România",
  description: "Jucării educaționale STEM premium pentru copii...",
  keywords: ["jucării STEM", "educație STEM", "jucării educaționale"],
  structuredData: [organizationSchema, websiteSchema],
  pathWithoutLocale: "/",
});
```

### Blog Post (Dynamic)

**File:** `app/blog/[slug]/metadata.ts`

```typescript
import { generateBlogPostMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ params }) {
  const blog = await getBlogPost(params.slug);

  return generateBlogPostMetadata(blog);
}
```

**Helper Function:**

```typescript
export function generateBlogPostMetadata(blog: Blog): Metadata {
  const seo = blog.metadata?.seo;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.coverImage,
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    author: {
      "@type": "Person",
      name: blog.author.name,
    },
  };

  return createMetadata({
    title: seo?.metaTitle || blog.title,
    description: seo?.metaDescription || blog.excerpt,
    keywords: seo?.metaKeywords || [],
    pathWithoutLocale: `/blog/${blog.slug}`,
    ogImage: blog.coverImage,
    structuredData: articleSchema,
  });
}
```

### Product Page (Dynamic)

**File:** `app/products/[slug]/metadata.ts`

```typescript
import { generateProductMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  return generateProductMetadata(product);
}
```

**Helper Function:**

```typescript
export function generateProductMetadata(product: Product): Metadata {
  const attributes = product.attributes;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      url: `https://techtots.ro/products/${product.slug}`,
      priceCurrency: "RON",
      price: product.price,
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return createMetadata({
    title: attributes?.metaTitle || `${product.name} | TechTots`,
    description: attributes?.metaDescription || product.description,
    keywords: attributes?.metaKeywords || [],
    pathWithoutLocale: `/products/${product.slug}`,
    ogImage: product.images[0],
    structuredData: productSchema,
  });
}
```

### Category Page

**File:** `app/products/category/[slug]/metadata.ts`

```typescript
export async function generateMetadata({ params }) {
  const category = await getCategory(params.slug);

  return createMetadata({
    title: `${category.name} | Jucării STEM | TechTots`,
    description:
      category.description || `Descoperă jucării ${category.name}...`,
    keywords: [category.name, "jucării STEM", "educație"],
    pathWithoutLocale: `/products/category/${category.slug}`,
    ogImage: category.image,
  });
}
```

---

## Romanian Market Optimization

### Language & Locale

**Primary Language:** Romanian (`ro-RO`)  
**Secondary Language:** English (`en`)

**Hreflang Implementation:**

```html
<link rel="alternate" hreflang="ro" href="https://techtots.ro/products" />
<link rel="alternate" hreflang="en" href="https://techtots.ro/en/products" />
<link
  rel="alternate"
  hreflang="x-default"
  href="https://techtots.ro/products"
/>
```

### Romanian Keywords

**High-Value Keywords:**

- jucării STEM
- jucării educaționale
- robotică copii
- experimente științifice
- educație STEM România
- jucării STEM București
- cadouri educaționale copii

**Long-Tail Keywords:**

- jucării STEM pentru copii 6 ani
- kit robotică copii începători
- experimente chimie copii acasă
- jucării educaționale matematică

### Geo-Location Meta Tags

Automatically added by `createMetadata()`:

```html
<meta name="geo.placename" content="București" />
<meta name="geo.region" content="RO" />
<meta name="geo.position" content="44.4268;26.1025" />
<meta name="ICBM" content="44.4268, 26.1025" />
```

### Romanian Education System Integration

**Blog Content Keywords:**

- Curriculum național
- Nivel primar/gimnazial/liceal
- Materii: matematică, fizică, chimie, informatică
- Bacalaureat
- Olimpiade școlare

---

## Technical SEO

### Robots.txt

**File:** `public/robots.txt`

```txt
# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Disallow query parameters (rely on canonical tags)
Disallow: /*?*

# Sitemap
Sitemap: https://techtots.ro/sitemap.xml
```

### Sitemap Generation

**File:** `app/sitemap.ts`

```typescript
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://techtots.ro";

  // Static pages
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/products`, priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/blog`, priority: 0.8, changeFrequency: "daily" },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: "monthly" },
  ];

  // Dynamic product pages
  const products = await getProducts();
  const productPages = products.map(product => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  // Dynamic blog pages
  const blogs = await getBlogs();
  const blogPages = blogs.map(blog => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  return [...staticPages, ...productPages, ...blogPages];
}
```

### Canonical URLs

Automatically handled by `createMetadata()`:

```html
<link rel="canonical" href="https://techtots.ro/products/robot-kit" />
```

**Best Practices:**

- Always use absolute URLs
- Ensure consistency (with/without trailing slash)
- Point paginated pages to canonical version
- Use self-referencing canonical on unique pages

### Page Speed & Core Web Vitals

**Monitoring:** Performance metrics tracked automatically

**Optimization:**

- Image optimization with Next.js `<Image>` component
- Font optimization with `next/font`
- Code splitting and lazy loading
- Static page generation where possible

---

## SEO Dashboard

**Route:** `/admin/seo-dashboard`

### Features

1. **Overview Metrics**
   - Total clicks (last 30 days)
   - Total impressions
   - Average CTR
   - Average position

2. **Top Keywords**
   - Keyword rankings
   - Position changes
   - Click-through rates
   - Search volume estimates

3. **Top Pages**
   - Best performing URLs
   - Clicks per page
   - Impressions per page

4. **Competitor Analysis**
   - Competitor gap opportunities
   - Keyword difficulty
   - Search intent analysis

5. **Historical Trends**
   - Position changes over time
   - CTR trends
   - Impression trends

6. **Manual Actions**
   - Save analytics data
   - Refresh GSC data
   - Export reports

### Usage

```typescript
// Access dashboard
navigate("/admin/seo-dashboard");

// Fetch SEO data
const response = await fetch(
  "/api/admin/seo/google-search-console?action=overview&days=30"
);
const data = await response.json();

// Save analytics manually
await fetch("/api/cron/daily-seo-analytics", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET_TOKEN}`,
  },
});
```

---

## Troubleshooting

### Meta Tags Not Showing

**Problem:** Meta tags not appearing in page source

**Solutions:**

1. **Check metadata export:**

```typescript
// Ensure you're exporting metadata
export const metadata = createMetadata({...});

// Or using generateMetadata for dynamic pages
export async function generateMetadata({ params }) {
  return createMetadata({...});
}
```

2. **Verify Next.js version:**
   - Metadata API requires Next.js 13+ with App Router
   - Check `package.json` for `next@^13.0.0` or higher

3. **Clear cache and rebuild:**

```bash
rm -rf .next
npm run build
npm run start
```

### Structured Data Errors

**Problem:** Google Search Console shows structured data errors

**Solutions:**

1. **Validate JSON-LD:**
   - Use [Google Rich Results Test](https://search.google.com/test/rich-results)
   - Check for required fields

2. **Common issues:**

```typescript
// Bad: Missing required fields
{
  "@type": "Product",
  "name": "Robot Kit"
  // Missing offers!
}

// Good: All required fields
{
  "@type": "Product",
  "name": "Robot Kit",
  "offers": {
    "@type": "Offer",
    "price": "299",
    "priceCurrency": "RON"
  }
}
```

### Google Search Console Not Connecting

**Problem:** GSC integration not working

**Solutions:**

1. **Check environment variables:**

```bash
GSC_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GSC_SITE_URL=https://techtots.ro
```

2. **Verify service account permissions:**
   - Service account added to GSC with "Full" permissions
   - Site URL matches exactly (https://techtots.ro not http://techtots.ro)

3. **Test connection:**

```typescript
import { gscService } from "@/lib/services/google-search-console-service";

const isConfigured = gscService.isConfigured;
console.log("GSC Configured:", isConfigured);

// Try fetching data
const data = await gscService.getRomanianMarketData(7);
console.log("GSC Data:", data);
```

### Canonical URL Issues

**Problem:** Canonical URLs pointing to wrong page

**Solutions:**

1. **Set explicit canonical:**

```typescript
export const metadata = createMetadata({
  title: "My Page",
  canonicalUrl: "https://techtots.ro/correct-url",
  pathWithoutLocale: "/correct-url",
});
```

2. **Check base URL:**

```bash
# .env.local
NEXT_PUBLIC_BASE_URL=https://techtots.ro
```

### Keywords Not Ranking

**Problem:** Pages not ranking for target keywords

**Solutions:**

1. **Verify keyword in content:**
   - Title tag contains keyword
   - H1 contains keyword
   - First paragraph mentions keyword
   - Keywords appear naturally throughout content

2. **Check competition:**

```typescript
// Use GSC service to check keyword difficulty
const rankings = await gscService.getKeywordRankings(["your keyword"]);
console.log("Current position:", rankings[0].position);
console.log("Difficulty:", rankings[0].difficulty);
```

3. **Improve on-page SEO:**
   - Add more quality content (800+ words)
   - Include related keywords
   - Add internal links
   - Optimize images with alt text

---

## Best Practices

### Metadata

1. **Title Tags**
   - 50-60 characters
   - Include primary keyword
   - Add brand name at end
   - Make compelling and descriptive

2. **Meta Descriptions**
   - 150-160 characters
   - Include call-to-action
   - Natural keyword usage
   - Unique per page

3. **Keywords**
   - Focus on long-tail keywords
   - Use Romanian language keywords
   - Include location (București, România)
   - Match search intent

### Structured Data

1. **Always include:**
   - Organization schema on homepage
   - Product schema on product pages
   - Article schema on blog posts
   - Breadcrumb schema on all pages

2. **Validation:**
   - Test with Google Rich Results Test
   - Check for errors in GSC
   - Validate JSON syntax

### Content

1. **Romanian Language:**
   - Write naturally in Romanian
   - Use proper diacritics (ă, â, î, ș, ț)
   - Include local references
   - Mention Romanian cities/regions

2. **SEO Writing:**
   - One H1 per page (main title)
   - Logical H2/H3 hierarchy
   - Short paragraphs (2-3 sentences)
   - Include lists and bullet points
   - Add relevant images with alt text

### Performance

1. **Core Web Vitals:**
   - LCP < 2.5s (Largest Contentful Paint)
   - FID < 100ms (First Input Delay)
   - CLS < 0.1 (Cumulative Layout Shift)

2. **Optimization:**
   - Compress images
   - Lazy load images
   - Minimize JavaScript
   - Use Next.js Image optimization

---

## Quick Reference

### Create Metadata

```typescript
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Page Title",
  description: "Page description",
  keywords: ["keyword1", "keyword2"],
  pathWithoutLocale: "/page-url",
});
```

### Add Structured Data

```typescript
const schema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Product Name",
};

export const metadata = createMetadata({
  title: "Product",
  structuredData: schema,
});
```

### Check GSC Data

```typescript
import { gscService } from "@/lib/services/google-search-console-service";

const data = await gscService.getRomanianMarketData(30);
```

### Save SEO Analytics

```bash
curl -X POST https://techtots.ro/api/cron/daily-seo-analytics \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

---

## File Reference

### Core Files

- `lib/metadata.ts` - Metadata factory
- `lib/utils/seo.ts` - SEO helper functions
- `lib/services/google-search-console-service.ts` - GSC integration

### Page Metadata

- `app/metadata.ts` - Homepage metadata
- `app/blog/[slug]/metadata.ts` - Blog post metadata
- `app/products/[slug]/metadata.ts` - Product metadata
- `app/products/category/[slug]/metadata.ts` - Category metadata

### API Routes

- `app/api/admin/seo/google-search-console/route.ts` - GSC API
- `app/api/cron/daily-seo-analytics/route.ts` - Analytics collection

### Dashboard

- `app/admin/seo-dashboard/page.tsx` - SEO dashboard

### Configuration

- `public/robots.txt` - Robots configuration
- `app/sitemap.ts` - Sitemap generation

---

**End of SEO Implementation Guide**

For questions or issues, check the codebase or create a GitHub issue.
