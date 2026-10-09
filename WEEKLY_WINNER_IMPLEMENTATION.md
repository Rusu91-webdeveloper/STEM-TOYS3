# Weekly Winner Product Links Implementation

## Goal
Help Google discover and crawl the TechTots weekly winner product page (TopBright water rocket) by adding server-rendered `<a href>` links from already-indexed pages.

**Product URL**: https://www.techtots.ro/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142

## Implementation Summary

### Pages with Server-Rendered Links

#### 1. ✨ Products Listing (`/products`) - NEW
**Component**: `features/products/components/WeeklyWinnerBanner.tsx`

```tsx
<Link href={`/products/${ROCKET_SLUG}`}>
  Vezi produsul →
</Link>
```

**Features**:
- Server component (async function)
- Queries database for current stock status
- Gracefully hides if out of stock
- Prominent rose-themed banner design
- Positioned above main product grid

**Location**: Line 77 of `WeeklyWinnerBanner.tsx`

---

#### 2. ✅ Gift Landing Page (`/cadouri-stem-6-8-ani`) - EXISTING
**File**: `app/cadouri-stem-6-8-ani/page.tsx`

**Link 1 - Hero Section** (Line 335):
```tsx
<Link href={`/products/${ROCKET_SLUG}`}>
  Vezi setul →
</Link>
```

**Link 2 - Footer Navigation** (Line 436):
```tsx
<Link href={`/products/${ROCKET_SLUG}`}>
  Rachetă cu propulsie pe apă TopBright
</Link>
```

**Features**:
- Already prominently features rocket as "Recomandarea săptămânii"
- Two separate links in different sections
- Server-rendered (page is async server component)

---

#### 3. ✅ Homepage (`/`) - EXISTING
**Files**: 
- `features/home/components/FeaturedProductsGrid.tsx`
- `features/home/components/HeroProductPeek.tsx`
- `lib/products/merchandising.ts`

**Links**:
- FeaturedProductsGrid (lines 57, 74, 94)
- HeroProductPeek (line 40)

```tsx
<Link href={productPublicPath(product.slug)}>
  {product.name}
</Link>
```

**Merchandising Priority** (`lib/products/merchandising.ts`, lines 137-139):
```tsx
if (a.slug === ROCKET_SLUG) return -1;
if (b.slug === ROCKET_SLUG) return 1;
```

**Features**:
- Rocket automatically appears first in featured products
- Rendered in two homepage sections (hero peek + featured grid)
- Server-rendered through `selectHomepageProducts`

## Technical Implementation

### Server-Side Rendering
All links are present in the initial HTML:
- ✅ Next.js `<Link>` components compile to `<a href>` tags
- ✅ No client-side-only rendering
- ✅ Links work even with JavaScript disabled
- ✅ Crawlable by search engines

### Maintainability
- Uses centralized `ROCKET_SLUG` constant from `lib/products/merchandising.ts`
- Single source of truth: `kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142`
- Easy to update if weekly winner changes (update constant)

### Graceful Degradation
- Banner checks: `isActive: true`, `status: "APPROVED"`, `stockQuantity >= 1`
- Automatically hides if product unavailable
- No broken links or false promises

## Files Changed

### Modified Files
1. `app/products/page.tsx`
   - Added wrapper div with gradient background
   - Imported and rendered `WeeklyWinnerBanner`
   - Banner positioned above `ClientProductsPage` (outside Suspense)

### New Files
2. `features/products/components/WeeklyWinnerBanner.tsx`
   - 105 lines
   - Server component
   - Database query for rocket product
   - Rose-themed banner design
   - "Câștigătorul săptămânii" badge

## Verification

### Build Status
- ✅ TypeScript: No regressions (1144 errors baseline maintained)
- ✅ Jest: No regressions (157 failed tests baseline maintained)
- ✅ No database migration changes
- ✅ No schema changes
- ✅ Validation scripts passed

### Link Verification
```bash
# Check for rocket product links
grep -n "ROCKET_SLUG\|/products/kit-stem-racheta" \
  app/page.tsx \
  app/cadouri-stem-6-8-ani/page.tsx \
  app/products/page.tsx \
  features/products/components/WeeklyWinnerBanner.tsx
```

**Results**:
- ✅ Gift landing page: 2 direct links (lines 335, 436)
- ✅ Products listing: 1 direct link (WeeklyWinnerBanner line 77)
- ✅ Homepage: Dynamic links via featured products (merchandising priority)

## Expected SEO Impact

### Before
- Product page: "Discovered – currently not indexed"
- Issue: Google never crawled the page (no internal links)

### After
- Product page linked from 3 high-traffic pages
- Server-rendered HTML with proper `<a href>` tags
- Expected: Google will crawl and index on next visit

## Pull Request
- **Branch**: `cursor/add-weekly-winner-links-bb90`
- **PR**: [#80](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/80)
- **Status**: Draft (DO NOT MERGE - Emanuel will merge)

## Notes for Codex
Only 2 files touched:
- `app/products/page.tsx` (modified)
- `features/products/components/WeeklyWinnerBanner.tsx` (new)

Homepage and gift landing page already had proper links, so no changes were needed there.
