## SEO Readiness TODO (Priority-Ordered)

> Goal: Achieve best-in-class SEO compliance, structured data correctness, and
> Core Web Vitals performance.

### High Priority

- [ ] Normalize domains to a single base URL
  - Source of truth: `NEXT_PUBLIC_BASE_URL` (e.g., https://www.techtots.ro)
  - Replace hard-coded `.com`/`.ro` URLs in `lib/utils/seo.ts`, JSON-LD,
    sitemaps, and any helpers
  - Add a type-safe `getBaseUrl()` helper and use everywhere

- [ ] Page-scoped JSON-LD (no global injection)
  - Remove global JSON-LD injection in `app/layout.tsx`
  - Inject JSON-LD within each page (product/category/blog/book) using a
    `SeoJsonLd` component
  - Ensure data matches visible content and canonical URL

- [ ] Accessible viewport
  - Update `<meta name="viewport">` to allow zoom:
    `width=device-width, initial-scale=1, viewport-fit=cover`

### Medium Priority

- [ ] Refine robots rules
  - Replace blanket `/*?*` disallow with targeted params (`?utm_`, `?ref=`)
  - Allow paginated/filter pages, rely on canonical tags

- [ ] Deprecate legacy/low-value meta
  - Minimize/remove `keywords`, `geo.*`, `ICBM` in `lib/metadata.ts`
  - Ensure real verification codes are set via env

- [ ] Hreflang accuracy
  - Generate alternates only for locales that have routes
  - Validate with Screaming Frog hreflang report

- [ ] Sitemap resilience & completeness
  - Avoid public HTTP for data; call services/DB directly or paginate API
    fetches
  - Split large sitemaps (index + products + categories + blog)

- [ ] Heading structure enforcement
  - One H1 per page; logical H2/H3 hierarchy
  - Add tests in `__tests__/components` for representative pages

- [ ] Image alt quality
  - Decorative images: `alt=""`; informative images: descriptive alt
  - Enforce via shared `<Image>` wrapper (dev warning)

- [ ] Core Web Vitals tuning
  - Ensure LCP image uses `priority` and correct `sizes`
  - Confirm font loading: preconnect + `font-display: swap`; consider
    self-hosted subset

- [ ] Breadcrumbs UI parity
  - Render visible breadcrumbs where JSON-LD BreadcrumbList exists

- [ ] Audit & monitoring setup
  - Lighthouse (mobile), Search Console rich results, Screaming Frog crawl,
    SEMrush project
  - Track CWV with Vercel Speed Insights and GA4 Web Vitals

### Implementation Notes

- Create `@/lib/site`:
  - `getBaseUrl(): string` from `NEXT_PUBLIC_BASE_URL` with sane default
  - Export `SITE_URL` constant for SSR-only contexts
- Create `@/components/seo/SeoJsonLd.tsx` to safely inject per-page JSON-LD
- Update `lib/utils/seo.ts` to use `SITE_URL` for canonical and schema URLs
- Add tests under `__tests__` for: canonical presence, hreflang correctness, H1
  existence, JSON-LD presence & validity

### Acceptance Criteria

- No mixed-domain URLs in HTML, headers, or JSON-LD
- Valid structured data per page (Rich Results Test passes)
- Robots allows key pages; paginated pages discoverable with correct canonicals
- Sitemaps fully list products/categories/blog posts (sample checked)
- Lighthouse Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 100 on key pages
