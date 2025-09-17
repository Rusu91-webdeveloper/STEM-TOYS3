# Project Tasks

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
