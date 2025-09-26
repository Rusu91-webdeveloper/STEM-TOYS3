### Product Detail Page – Complete Content & SEO Overhaul

**Date**: 2025-09-20  
**Owner**: Platform  
**Related routes**: `/products/[slug]`, `/api/products/[slug]`,
`/api/products/combined/[slug]`

---

## End Goal

Deliver product detail pages that fully reflect our database’s product schema
and present all meaningful information to users and search engines. Pages must:

- Accurately show essential product specifics (SKU/GTIN, dimensions, weight, age
  group, learning outcomes, curriculum alignment, etc.)
- Provide robust structured data (Product + Breadcrumb + optional FAQ) to earn
  rich results and AI-overview coverage
- Preserve performance (ISR, caching, Core Web Vitals) and accessibility
- Be consistent with our data normalization: SEO in `metadata.seo`, specs in
  `attributes`, AI provenance in `metadata.ai`

### Success Criteria

- Page renders all key product details when present (see Field Coverage below)
- JSON-LD validates in Rich Results Test and includes aggregate rating,
  price/availability, GTIN (when available), brand, category, audience, and
  additionalProperty
- FAQ schema renders when `metadata.seo.faq` exists
- Tests pass: unit (API, utilities), component (UI rendering), integration (SEO
  JSON-LD), and E2E (Playwright)
- No regressions in LCP/TTFB and no Next.js build/lint errors

---

## Field Coverage (from Prisma `Product` and relations)

- Core: `id`, `name`, `slug`, `description`, `price`, `compareAtPrice`,
  `priceCurrency`, `compareAtPriceCurrency`, `images`, `tags`, `attributes`,
  `metadata`
- Inventory/Status: `isActive`, `featured`, `stockQuantity`, `reservedQuantity`,
  `reorderPoint`, `status`, `totalSold`
- Merchandising/Taxonomy:
  `categoryId → category { id, name, slug, description }`, `stemDiscipline`,
  `ageGroup`, `learningOutcomes[]`, `productType`, `specialCategories[]`
- Identifiers/Logistics: `sku`, `barcode` (GTIN), `weight`, `dimensions (Json)`
- Ratings: `averageRating`, `reviewCount`
- Supplier/Brand: `supplierId → supplier { companyName, companySlug }`
- Romanian education fields: `romanianCompetencies[]`,
  `romanianCurriculumAlignment[]`, `romanianEducationalCertification`,
  `romanianEducationalLevel`, `romanianMinistryApproval`,
  `romanianParentGuides[]`, `romanianSubjectAreas[]`,
  `romanianTeacherResources[]`
- Media: `imageMetadata[] { alt, tags }`

Current UI renders: name, price, compareAtPrice badge, ratings
(averageRating/reviewCount), totalSold, stockQuantity, description, images,
breadcrumb with category, basic Product JSON-LD + BreadcrumbList.  
Gaps: identifiers (sku/barcode), physical specs (weight/dimensions), taxonomy
(ageGroup, learningOutcomes, productType, specialCategories, stemDiscipline),
supplier-as-brand, tags, Romanian education fields, image alt/tags usage, FAQ
schema, JSON-LD completeness (aggregateRating, gtin, audience,
additionalProperty, category path, reviews).

---

## Implementation Plan (Steps with Goals)

1. Audit schema→UI mapping for Product and list missing fields

- Goal: Produce a definitive checklist of which DB fields render on the page and
  which must be added, including SEO schema mapping. Baseline for acceptance.
- Deliverables: Updated plan (this file), checklist table, issues created if
  required.

2. Extend `types/product.ts` to include needed schema fields for UI/SEO

- Goal: Add strongly-typed fields (sku, barcode, weight, dimensions, ageGroup,
  learningOutcomes, productType, specialCategories, stemDiscipline, supplier,
  imageMetadata, romanian\* fields) so components can render without `any`.
- Deliverables: Updated types; no linter errors; minimal comments for clarity.

3. Enhance `/api/products/combined/[slug]` to return full product details

- Goal: Include relations and fields required by the UI/SEO:
  `category { id, name, slug }`, `supplier { companyName, companySlug }`,
  `imageMetadata`, and all identifiers/taxonomy fields. Keep ISR-friendly cache
  headers.
- Deliverables: Route updated; Prisma include/select tuned; response validated.

4. Normalize product transformation and typing in combined route

- Goal: Return a stable, typed DTO shape aligning with `types/product.ts` (e.g.,
  map `barcode` to `gtin` in DTO if helpful; ensure `attributes` is a plain
  object; safe defaults).
- Deliverables: Transformation util; tests for edge cases (missing
  category/supplier, empty arrays).

5. Update `lib/api/products.getCombinedProduct` to new shape and tags

- Goal: Maintain cache tags/ISR behavior, align consumer components with the
  expanded DTO, and keep robust error handling.
- Deliverables: Updated fetcher; verified tags; no broken imports.

6. Upgrade `generateProductMetadata` to use SEO metadata, GTIN, brand, reviews

- Goal: Use `metadata.seo` when available for metaTitle/description/keywords;
  add `aggregateRating`, `gtin` from `barcode`, `brand` from supplier if
  present, `audience` from age range, and `additionalProperty` for attributes.
- Deliverables: Updated SEO util; tests asserting JSON-LD keys.

7. Refine Product JSON-LD in `ProductDetailServer` to avoid duplication

- Goal: Remove overlapping inline schema that `generateProductMetadata` already
  outputs, or ensure both are complementary. Keep BreadcrumbList as needed.
- Deliverables: Lean, non-duplicative JSON-LD on the page.

8. Implement specs/attributes section in UI

- Goal: Render SKU, Barcode (GTIN), Weight, Dimensions, Age Group, Learning
  Outcomes, Product Type, Special Categories, STEM Discipline in a structured,
  accessible layout.
- Deliverables: New section in `ProductDetailClient` (or a subcomponent) with
  responsive design and a11y.

9. Render curriculum alignment, competencies, teacher resources, parent guides

- Goal: Surface Romanian education context fields when present, grouped
  logically.
- Deliverables: Conditionally rendered cards/accordions with these fields and
  i18n labels.

10. Show supplier/brand, category breadcrumb slug, and product tags

- Goal: Display supplier as Brand (link to supplier page if exists), ensure
  breadcrumb uses `category.slug`, and show tags for internal navigation/SEO.
- Deliverables: UI updates; links; tracking attributes where applicable.

11. Use `ImageMetadata.alt` and tags in `ProductImageGallery`; improve
    thumbnails

- Goal: Provide alt text for accessibility/SEO and consider tag-driven
  badges/captions.
- Deliverables: Gallery updated to consume metadata; graceful fallback when
  absent.

12. Add FAQ accordion and FAQ schema when `metadata.seo.faq` exists

- Goal: Expose common Q&A per product and emit `FAQPage` JSON-LD.
- Deliverables: UI accordion component; JSON-LD block; tests.

13. Add unit/integration tests for API, SEO JSON-LD, and UI rendering

- Goal: Ensure reliability: API returns full shape; JSON-LD contains required
  keys; UI renders fields with fallbacks.
- Deliverables: Tests under `__tests__` folders (Vitest/RTL for components;
  Supertest for API).

14. Add Playwright E2E for product page core flow and schema presence

- Goal: Validate happy path: product loads, key details visible, JSON-LD
  present, no console errors.
- Deliverables: Playwright spec; CI-ready.

15. Project hygiene: Log in `TASKS.md` and update after completion

- Goal: Track start/completion, estimates, issues encountered, and PR links.
- Deliverables: `TASKS.md` entries with dates; end-of-task notes.

---

## Testing Strategy

- Unit: DTO transformer, SEO generator (JSON-LD shape), API param handling
- Component: Specs panel, Romanian education fields, gallery alt fallback
- Integration: Product page renders complete JSON-LD; breadcrumb correctness
- E2E: Load `/products/[slug]` with a seeded product; verify core fields and
  schema presence

---

## Risks & Mitigations

- Inconsistent legacy data (missing metadata.seo): add safe defaults and
  fallbacks
- Overly large JSON-LD: keep schema minimal but complete; avoid duplication
- Performance regressions: continue ISR; avoid client-side fetches for core data

---

## Estimates (rough)

- Types & API shape (2–3h)
- UI panels & schema updates (2–3h)
- Tests (1.5–2.5h)

---

## Definition of Done

- All steps above implemented
- All tests pass locally and in CI
- Rich Results Test passes for Product + Breadcrumb (and FAQ when present)
- `TASKS.md` updated with completion details

---

## Where to Look & What to Edit (Exact Paths)

- Types
  - `types/product.ts` – extend `Product` and related types
- API
  - `app/api/products/combined/[slug]/route.ts` – include relations/fields and
    normalize DTO
  - `app/api/products/[slug]/route.ts` – keep in sync or deprecate if redundant
- Data Fetching
  - `lib/api/products.ts` – update `getCombinedProduct` to new DTO
- SEO
  - `lib/utils/seo.ts` – enhance `generateProductMetadata`
  - `components/seo/SeoJsonLd.tsx` – used to inject JSON-LD
- Page & Components
  - `app/products/[slug]/page.tsx` – metadata and main page
  - `features/products/components/ProductDetailServer.tsx` – server data +
    JSON-LD
  - `features/products/components/ProductDetailClient.tsx` – UI sections; add
    Specs/Education/Tags/Brand
  - `features/products/components/ProductImageGallery.tsx` – use
    `imageMetadata.alt`/tags

---

## Schema → UI/SEO Mapping (Authoritative)

| Prisma Field                   | UI Placement                 | JSON-LD Mapping                          |
| ------------------------------ | ---------------------------- | ---------------------------------------- |
| `name`                         | Title                        | `name`                                   |
| `description`                  | Description                  | `description`                            |
| `price`, `priceCurrency`       | Price                        | `offers.price`, `offers.priceCurrency`   |
| `compareAtPrice`               | Discount badge/strikethrough | Optional custom field                    |
| `isActive`, `stockQuantity`    | Stock status                 | `offers.availability`                    |
| `images[]`                     | Gallery                      | `image`                                  |
| `imageMetadata[].alt`          | Img alt text                 | N/A (accessibility)                      |
| `sku`                          | Specs                        | `sku`                                    |
| `barcode`                      | Specs                        | `gtin13`/`gtin` (choose based on length) |
| `weight`                       | Specs                        | `additionalProperty`                     |
| `dimensions`                   | Specs                        | `additionalProperty`                     |
| `ageGroup`/`attributes.age`    | Specs                        | `audience.suggestedMinAge/MaxAge`        |
| `learningOutcomes[]`           | Specs/Benefits               | `additionalProperty`                     |
| `productType`                  | Specs                        | `category` or `additionalType`           |
| `specialCategories[]`          | Badges                       | Optional keywords                        |
| `stemDiscipline`               | Specs                        | `category`                               |
| `category { name, slug }`      | Breadcrumb/links             | BreadcrumbList + `category`              |
| `supplier { companyName }`     | Brand                        | `brand.name`                             |
| `averageRating`, `reviewCount` | Rating row                   | `aggregateRating`                        |
| `tags[]`                       | Chips/links                  | Optional keywords                        |
| Romanian education fields      | Education section            | `additionalProperty`                     |

Notes:

- Use `additionalProperty` (PropertyValue) for specs not first-class in
  schema.org.
- Choose appropriate `gtin` property (`gtin8/12/13/14`) based on `barcode`
  length; fallback to generic `gtin`.

---

## Search Shortcuts (to locate code fast)

- Find product API routes: `rg --type ts "app/api/products"`
- Combined route signature: search for `export async function GET` in
  `app/api/products/combined/[slug]/route.ts`
- Data fetcher: `getCombinedProduct` in `lib/api/products.ts`
- Product page: `app/products/[slug]/page.tsx`
- Server/client components: `ProductDetailServer`, `ProductDetailClient`
- SEO generator: `generateProductMetadata` in `lib/utils/seo.ts`
- Gallery: `ProductImageGallery.tsx`

---

## Acceptance Criteria per Step (Condensed)

1. Audit mapping
   - Checklist produced; gaps identified and reflected in this doc.
2. Extend types
   - `types/product.ts` compiles; includes identifiers, specs, taxonomy,
     supplier, image metadata, romanian fields.
3. Enhance combined API
   - Returns required fields/relations; adds cache headers; 404 on missing.
4. Normalize transformation
   - DTO stable; `attributes` is plain object; safe defaults for optional
     fields.
5. Update fetcher
   - Fetch uses `force-cache` with tags; parses DTO correctly.
6. Upgrade SEO metadata
   - JSON-LD contains brand, gtin, aggregateRating, audience,
     additionalProperty.
7. Refine page JSON-LD
   - No duplicate Product schema; Breadcrumb preserved; optional FAQ injected
     once.
8. Specs section
   - Renders SKU, GTIN, weight, dimensions, ageGroup, outcomes, productType,
     specialCategories, stemDiscipline.
9. Education section
   - Conditionally shows romanian fields with i18n labels.
10. Brand/tags/breadcrumb

- Supplier appears as Brand; tags rendered; breadcrumb uses category slug.

11. Gallery metadata

- Alt text from `imageMetadata.alt` with graceful fallback; tags optional.

12. FAQ

- Accordion renders when `metadata.seo.faq` exists; emits `FAQPage` JSON-LD.
  13–14. Tests
- Unit/Component/Integration/E2E implemented and passing.

15. Hygiene

- `TASKS.md` updated with completion details and PR links.

---

## Scaling & Performance Checklist

- Keep ISR: `export const revalidate = 300` for product page
- API `Cache-Control`: `public, s-maxage=300, stale-while-revalidate=600`
- Use Prisma `include` narrowly; avoid sending unused fields to clients
- Leverage DB indexes already defined for `slug`, `status`, `isActive`
- No client-side fetch for core product payload; server-render
- Avoid heavy client bundles; keep new UI as server components when possible

---

## Professional UI/UX Checklist

- Consistent spacing/typography with existing design system
- Accessible: semantic headings, alt text, readable contrast, focus states
- Clear, compact Specs section (2-column on desktop, stacked on mobile)
- Badges for sale/stock/spec highlights; subtle, not flashy
- Education and FAQ sections collapsible; preserve page scan-ability
- Preserve existing conversion tracking data attributes
