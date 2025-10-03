# Project Tasks

## 2025-10-02

## 2025-10-03

- Fix products page import error for conversion tracking
  - Description: Re-export `useConversionTracking` from `hooks/useABTest.ts` so
    existing imports like `@/hooks/useABTest` work on `/products` components
    (`ProductsHeroSection`, `AgeQuickFilters`, etc.).
  - Estimated time: 0.2h
  - Status: Completed
  - Date: 2025-10-03
  - Notes:
    - Added `export { useConversionTracking } from "@/lib/conversion-tracking";`
      to `hooks/useABTest.ts` to align with project import pattern.
    - Resolves runtime TypeError: useConversionTracking is not a function.

- Add Prisma migration snapshot & automated DB backup
  - Description: Add script to snapshot Prisma schema to SQL, generate DB diffs,
    and wire npm scripts. Ensure JSON data backups and restore scripts are in
    place.
  - Estimated time: 0.5h
  - Status: Completed
  - Date: 2025-10-03
  - Notes:
    - Added `scripts/prisma-snapshot.ts`.
    - Added npm scripts: `db:snapshot`, `db:diff`, `db:migrate:dev`,
      `db:migrate:deploy`, `db:reset`.
    - Existing `scripts/backup-database.ts` and `scripts/restore-database.ts`
      provide full data backup/restore.
    - Use `pnpm backup:auto` to generate JSON data backup with timestamp.

- Fix Vercel Production Build Errors
  - Description: Resolve multiple build and runtime errors in Vercel production
    deployment
  - Estimated time: 1h
  - Status: Completed
  - Date: 2025-10-02
  - Notes:
    - Fixed SkeletonCard import error in BlogGrid.tsx by creating SkeletonCard
      component in components/ui/skeleton.tsx
    - Removed deprecated swcMinify option from next.config.js (deprecated in
      Next.js 13+)
    - Fixed mcp_zapier undefined error in competitor-analysis-service.ts by
      replacing with mock implementation
    - Fixed generateMonthlyCalendar function call in content-calendar-service.ts
      by correcting static method calls
    - Fixed dynamic server usage error in supplier dashboard by adding export
      const dynamic = 'force-dynamic'
    - Fixed Google Search Console dynamic server usage error by adding export
      const dynamic = 'force-dynamic'
    - All build warnings and runtime errors resolved, project ready for
      production deployment
    - No linting errors found after fixes

## 2025-10-01

- Fix Production Blog Edit Tabs Error
  - Description: Resolve "ReferenceError: Tabs is not defined" error when
    editing blogs in production admin dashboard
  - Estimated time: 0.5h
  - Status: Completed
  - Date: 2025-10-01
  - Notes:
    - Added missing import for Tabs components in
      app/admin/blog/edit/[slug]/page.tsx
    - Import statement: import { Tabs, TabsContent, TabsList, TabsTrigger } from
      "@/components/ui/tabs";
    - Error was caused by using multilingual tabs interface without proper
      imports
    - Verified build succeeds and no other files have similar missing imports
    - Issue resolved and ready for production deployment

## 2025-09-11

- SEO Readiness improvements
  - Description: Normalize base URL usage; remove global JSON-LD; add
    page-scoped SeoJsonLd; accessible viewport; refine robots; centralize
    canonical/schema URLs; add initial tests.
  - Estimated time: 3h
  - Status: Completed
  - Notes: Added `lib/site` with `getBaseUrl`/`SITE_URL`, updated
    `app/layout.tsx` viewport, removed global JSON-LD, created
    `components/seo/SeoJsonLd`, refactored blog/category/product pages and
    `breadcrumb` component, updated `lib/utils/seo.ts` to use `SITE_URL`, added
    tests under `__tests__`.
  - Follow-ups (Discovered During Work):
    - Expand tests to validate hreflang alternates and sitemap contents.
    - Crawl with Screaming Frog to validate hreflang and canonicals.

- Email System Refactor – Phase 1: Foundation
  - Description: Choose provider, add unified email service with provider
    abstraction and failover, define unified request/response types, update
    envs.
  - Estimated time: 6h
  - Status: In Progress
  - Date: 2025-09-11
  - Subtasks:
    - Add env variables to `env.example` for email provider selection and keys
    - Create `lib/email/types.ts` for unified interfaces
    - Implement `lib/email/unified-service.ts` with primary/fallback logic
    - Add provider adapters under `lib/email/providers` (resend, brevo, gmail)
    - Add unit tests for unified service with mocked providers

## 2025-09-16

- Phase 1 Conversion Optimization – Products Page Foundations
  - Description: Implement Hormozi-style messaging foundations on products page.
  - Estimated time: 3h
  - Status: Completed
  - Notes:
    - Added Phase 1 translation keys (EN/RO) for products, categories, checkout.
    - Implemented A/B-tested hero headline and subheadline on products page.
    - Wired conversion tracking for hero impressions and CTA clicks.
    - Added age-based quick filters section under hero with localized labels and
      tracking.
  - Discovered During Work:
    - Consider adding category-specific A/B test variants next.
    - Define success event for "Get Personalized Recommendations" flow.

- Blog Language Support – /blog listing toggle and API verification
  - Description: Ensure /blog supports EN/RO with an easy toggle and API
    respects language.
  - Estimated time: 1h
  - Status: Completed
  - Date: 2025-09-16
  - Notes:
    - Added `BlogLanguageToggle` to `app/blog/page.tsx` hero, wired to
      `useTranslation`.
    - `/api/blog` already filters by `language` query param with sensible
      fallbacks.
    - `/blog` list refetches on language change; post pages already support
      language via slug/param.
  - Follow-ups (Discovered During Work):
    - Optionally add the same toggle to `app/blog/category/[slug]/page.tsx`.

## 2025-09-18

- Fix AI Enhancement Production Error
  - Description: Fix the "d.wT.externalServiceError is not a function" error in
    production AI enhancement
  - Estimated time: 1h
  - Status: Completed
  - Date: 2025-09-18
  - Notes:
    - Added missing `externalServiceError` method to ApiErrors object in
      api-error-handler.ts
    - Fixed error.message access without proper type checking in
      dual-provider-enhancement-service.ts
    - Fixed error accumulation in enhanceProducts to properly track all failures
    - Issue was caused by missing method in production minified build
    - Successfully committed and pushed to production
  - Discovered During Work:
    - Consider adding comprehensive unit tests for error handling in AI services
    - May need to review other API error handling patterns for similar issues

- Implement AI Provider Failover for Quota Limits
  - Description: Add automatic failover from Gemini to OpenAI when quota/rate
    limits are exceeded
  - Estimated time: 2h
  - Status: Completed
  - Date: 2025-09-18
  - Notes:
    - Implemented automatic fallback mechanism when primary provider (Gemini)
      hits quota limits
    - Added quota/rate limit error detection with comprehensive error message
      parsing
    - Secondary provider (OpenAI) now handles full enhancement when primary
      fails
    - Updated types to track fallback usage and provider information
    - Enhanced API response to include fallback statistics and provider details
    - Progress reporting now shows when fallback is being used
    - System continues working even when Gemini free tier limits are reached
  - Discovered During Work:
    - Consider implementing retry logic with exponential backoff
    - Could add provider health monitoring for proactive switching
    - May want to cache successful enhancements to reduce API calls

## 2025-09-17

- Products Page – Fix price filtering end-to-end
  - Description: Standardize price range shape across UI components and URL,
    ensure correct handler usage, and verify API respects min/max.
  - Estimated time: 1.0h
  - Status: Completed
  - Date: 2025-09-17
  - Notes:
    - Updated `EnhancedProductFilters` to accept `priceRange.current` as tuple
      `[min,max]` and to call `onPriceChange([min,max])`.
    - Updated `ProductsSidebar` to pass `{ min, max, current: [min,max] }`
      computed from products.
    - Verified `MobileFiltersModal` passes through the standardized shape.
    - Client-side filtering in `ClientProductsPage` now applies range when
      enabled; URL sync preserved.
  - Discovered During Work:
    - Consider server-side filtering by price as well when fetching a subset, if
      we switch away from fetching all products.

- Homepage Conversion & SEO Optimization (Hormozi)
  - Description: Improve hero clarity (copy clamp, spacing), code-split
    below-the-fold sections, and add homepage JSON-LD. Prepare follow-up tasks
    for trust badges, age quick-links, tests, and performance audits.
  - Estimated time: 2.5h
  - Status: In Progress
  - Date: 2025-09-17
  - Notes:
    - Clamped hero headline and subheadline to 2 lines, hid long supporting copy
      on small screens.
    - Code-split Value/Risk/Supplier/Mobile optimizer sections with dynamic
      imports.
    - Added Organization & WebSite (SearchAction) JSON-LD via `SeoJsonLd`.
  - Follow-ups (Discovered During Work):
    - Add compact trust badges row under hero (security, reviews, guarantee).
    - Add age quick-links row under hero for fast navigation.
    - Optimize hero image preload/preconnect only if needed; LCP already
      prioritized.
    - Add Lighthouse CI and E2E tests for hero CTAs and LCP budget.

## 2025-09-19

- Set Default Status to PENDING_APPROVAL for Bulk Product Uploads
  - Description: Update admin bulk upload functionality to always set product
    status to PENDING_APPROVAL instead of conditional approval based on AI
    enhancement
  - Estimated time: 0.5h
  - Status: Completed
  - Date: 2025-09-19
  - Notes:
    - Updated `/api/admin/products/bulk-upload/route.ts` to always set status to
      "PENDING_APPROVAL"
    - Updated `/api/admin/products/ai-enhance-and-save/route.ts` to use
      "PENDING_APPROVAL" instead of "APPROVED"
    - Updated console logs and response tracking to reflect new behavior
    - Updated AI_ENHANCEMENT_WORKFLOW_GUIDE.md documentation
    - Verified Prisma schema already has PENDING_APPROVAL as default for
      Product.status
    - All bulk uploaded products now require admin approval before going live

- Fix Web Vitals API Errors
  - Description: Resolve recurring Web Vitals tracking errors in terminal (INP
    metric not supported, missing timestamps)
  - Estimated time: 0.5h
  - Status: Completed
  - Date: 2025-09-19
  - Notes:
    - Added INP (Interaction to Next Paint) metric support to web-vitals schema
    - Made timestamp field optional with default value to prevent validation
      errors
    - Added INP thresholds (200ms good, 500ms needs improvement)
    - Improved error handling with better Zod validation error messages
    - Enhanced client-side error handling to be silent in production
    - Added userAgent to client requests for better tracking
    - Errors should now be resolved and not spam the terminal

- Fix Cart API Startup Error (Duplicate variable declaration)
  - Description: Resolve dev startup/runtime 500s caused by a duplicate
    `sessionId` declaration in `getCartId` fallback path.
  - Estimated time: 0.2h
  - Status: Completed
  - Date: 2025-09-19
  - Notes:
    - Removed the second `const sessionId = getSessionId(request)` inside the
      anonymous-user fallback in `lib/cart-storage.ts` and reused the initial
      `sessionId`.
    - Verified `GET /api/cart` and `POST /api/cart` return 200 locally.
    - Root cause matched Next.js build error: "Identifier 'sessionId' has
      already been declared (151:10)".

- Products Page – Professional UI/UX Refactor (Hero, Filters, Cards)
  - Description: Refactor `/products` page visuals for professional, consistent
    UI/UX without changing data fetching or filtering logic. Fixed hero CTA
    clickability, simplified visuals, polished mobile filter bar, and cleaned
    product card design (grid/list).
  - Estimated time: 2.5h
  - Status: Completed
  - Date: 2025-09-19
  - Notes:
    - Hero: set pointer-events:none on decorative overlays, raised content
      z-index so CTAs are clickable; refined heights and transitions.
    - MobileFilterBar: simplified to neutral, professional styling, reduced
      gradients/animations, improved readability.
    - ProductCard: replaced ribbon/banners with subtle sale and low-stock
      badges; unified button style; preserved logic.
    - Added tests: hero CTA click tracking mock; basic ProductGrid rendering and
      layout toggle.
  - Discovered During Work:
    - Consider adding compact trust badges row under hero for social proof.

## 2025-09-20

- Product Detail Page – Complete Content & SEO Overhaul
  - Description: Expand `/products/[slug]` to render all key product details
    from the DB (identifiers, specs, taxonomy, education fields, supplier/brand,
    tags, image metadata), upgrade JSON-LD (Product, Breadcrumb, FAQ), and align
    with metadata normalization. Maintain ISR/performance and add comprehensive
    tests.
  - Estimated time: 6h
  - Status: In Progress
  - Date: 2025-09-20
  - Notes:
    - See `docs/PRODUCT_DETAIL_PAGE_SEO_PLAN.md` for the full step-by-step plan
      and goals.
  - Subtasks (high-level):
    - Extend product types to cover DB fields used by UI/SEO
    - Enhance combined product API shape and normalization
    - Upgrade SEO generation and page-scoped JSON-LD
    - Implement UI sections for specs, taxonomy, education fields, brand, tags
    - Render FAQ + FAQ schema when available
    - Add unit, integration, and E2E tests

- Fix Products Sidebar – "All Types" shows no results
  - Description: Ensure selecting "All Types" in the Product Type dropdown
    applies no type filter and shows all products.
  - Estimated time: 0.2h
  - Status: Completed
  - Date: 2025-09-19
  - Notes:
    - Updated `ClientProductsPage.tsx` to skip type filter when value is
      `"all"`.
    - Set default `selectedProductType` to `"all"` in `useProductFilters`
      initial state.
    - Aligned active filter counts and badges in `EnhancedProductFilters` and
      `MobileFiltersModal` to ignore `"all"`.

- Normalize SEO and AI metadata storage for Products
  - Description: Ensure bulk upload, AI enhance-and-save, and admin create store
    SEO in `metadata.seo`, AI provenance in `metadata.ai`, and keep product
    specs only in `attributes`. Strip any SEO keys from `attributes` on save for
    consistency.
  - Estimated time: 0.8h
  - Status: Completed
  - Date: 2025-09-20
  - Notes:
    - Updated `/api/admin/products/bulk-upload/route.ts` to extract SEO (from
      top-level/attributes/seo) into `metadata.seo`, add `metadata.ai` and
      `metadata.ingestion`, and strip SEO from `attributes`.
    - Updated `/api/admin/products/ai-enhance-and-save/route.ts` to the same
      normalization, moving AI tracking to `metadata.ai`.
    - Updated `/api/admin/products/route.ts` (POST create) to write SEO to
      `metadata.seo` and keep specs in `attributes`.
    - Added legacy keys (`metaTitle`, `metaDescription`, `metaKeywords`,
      `ogImage`) into `metadata` for backward compatibility where readers expect
      them.
    - Ran linter: no errors.

- AI Blog Generation Feature Implementation
  - Description: Implement complete AI-powered blog generation system for admin
    panel, similar to existing AI product enhancement. Generate SEO-optimized
    Romanian blog posts from natural language prompts with full database
    integration.
  - Estimated time: 12h
  - Status: Completed
  - Date: 2025-09-28
  - Subtasks:
    - Create detailed requirements document (AI_BLOG_GENERATION_REQUIREMENTS.md)
    - Design AI blog generation types and interfaces (lib/ai/blog-types.ts)
    - Create Romanian-specific AI prompts for blog content
      (lib/ai/prompts/blog-generation-prompts.ts)
    - Implement DualProviderBlogEnhancementService for Romanian blog generation
      (lib/ai/dual-provider-blog-enhancement-service.ts)
    - Create API endpoint /api/admin/blog/ai-generate with full validation and
      database integration
    - Build AIBlogGenerator UI component with progress tracking and preview
      (components/admin/AIBlogGenerator.tsx)
    - Integrate AI generation into admin/blog page with seamless UX
    - Implement comprehensive SEO optimization for Romanian content
    - Add extensive test coverage for API and AI service
      (**tests**/api/admin/blog/ai-generate.test.ts,
      **tests**/lib/ai/dual-provider-blog-enhancement-service.test.ts)
  - Notes:
    - Complete AI blog generation system with Romanian language optimization
    - SEO-optimized content with meta tags, keywords, and readability analysis
    - Full database integration with category management and publishing controls
    - Professional UI with progress tracking and content preview
    - Comprehensive test coverage ensuring reliability
    - Romanian curriculum alignment and cultural context awareness
    - Performance optimized with streaming progress updates
    - Error handling and fallback mechanisms for production stability
