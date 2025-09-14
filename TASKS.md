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
