## Mobile filtering in burger menu — /products

### Goals

- **Move all mobile filtering into the burger (hamburger) menu** under a new
  "Products" section with collapsible sub-items (Age/Varsta, Category, Gift
  Ideas).
- **On mobile**: `/products` shows only the product list (no filters UI on the
  page). Filtering is driven by menu selections that update URL query params.
- **On desktop/tablet**: keep existing filters and behavior unchanged.

### Implementation checklist

#### Header mobile menu — add Products with collapsible filters

- [ ] Update `components/layout/Header.tsx`
  - [ ] Import router: `import { useRouter } from "next/navigation";` and
        initialize `const router = useRouter();`
  - [ ] Ensure the mobile menu includes a primary "Products" item (do not filter
        it out with `.filter(item => item.href !== "/products")`).
  - [ ] Convert the "Products" entry into a toggleable section (local state:
        `productsMenuOpen`).
  - [ ] Add a sub-item: "All products" →
        `router.push("/products"); setMobileMenuOpen(false)`.
  - [ ] Add collapsible "Varsta" (Age) sub-section (state: `ageOpen`) with items
        mapping to URL param `ageGroup`: - TODDLERS_1_3 → "0–3 ani" -
        PRESCHOOL_3_5 → "4–6 ani" - ELEMENTARY_6_8 → "7–9 ani" -
        MIDDLE_SCHOOL_9_12 → "10–12 ani" - TEENS_13_PLUS → "13+ ani" - On click:
        `router.push("/products?ageGroup=<VALUE>"); setMobileMenuOpen(false)`
  - [ ] Add collapsible "Category" sub-section (state: `categoryOpen`). - On
        first expand, lazy-load categories from `/api/categories` (map toi use
        Alex `{ id: slug, label }`). Cache locally; avoid re-fetch on subsequent
        opens. - On click:
        `router.push("/products?category=<slug>"); setMobileMenuOpen(false)`.
  - [ ] Add a direct sub-item "Gift Ideas" →
        `router.push("/products?specialCategories=GIFT_IDEAS"); setMobileMenuOpen(false)`.
  - [ ] A11y: `aria-expanded` on toggles, `aria-controls`, ensure focus rings.
  - [ ] Tailwind for sub-menu UX: - Toggle buttons:
        `flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50` -
        Sub-lists: `mt-1 space-y-0.5` - Items:
        `flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50`

#### Products page — hide filters UI on mobile only

- [ ] Confirm sidebar is desktop-only (already `hidden md:block`) in
      `features/products/components/ProductsSidebar.tsx`.
- [ ] Hide the age quick filters on mobile in
      `features/products/components/ClientProductsPage.tsx`: - Wrap
      `AgeQuickFilters` with `hidden md:flex` (or conditionally render only on
      `md+`).
- [ ] Remove/disable mobile filters modal usage (burger becomes the only mobile
      entry point): - Do not render `<MobileFiltersModal />` on mobile (wrap
      with `hidden md:block` or conditionally skip for `md` and below). - Hide
      any buttons/triggers that open the mobile filters modal for small screens.

#### Filter state and URL sync

- [ ] Update `features/products/hooks/useProductFilters.ts`:
  - [ ] Read `ageGroup` in `initFromSearchParams()`; if value is one of
        `TODDLERS_1_3 | PRESCHOOL_3_5 | ELEMENTARY_6_8 | MIDDLE_SCHOOL_9_12 | TEENS_13_PLUS`,
        set `selectedAgeGroup`.
  - [ ] Write `ageGroup` in `updateURL()` when `selectedAgeGroup` is set.
  - [ ] Keep existing handling for `category`, `specialCategories`, `minPrice`,
        `maxPrice`, `noPriceFilter` as-is.

#### Shared URL builder (consistency between header and page)

- [ ] Create `lib/utils/product-filters-url.ts`:
  - [ ] Export
        `buildProductsUrl({ categoryIds?, ageGroup?, specialCategories?, minPrice?, maxPrice?, noPriceFilter? }): string`.
  - [ ] Reuse the same `normalizeCategory` logic currently in
        `useProductFilters` (extract to shared module or re-export from there)
        to ensure matching behavior.
  - [ ] Use this builder inside `Header.tsx` for generating navigation URLs.

#### i18n keys

- [ ] Ensure translations exist for: `products`, `categories`, `giftIdeas`,
      `age`, each age label shown above, and section titles in the mobile menu.
- [ ] Use `useTranslation()` inside `Header.tsx` for all menu labels.

#### Tailwind responsiveness (summary)

- [ ] Mobile header/drawer remains `xl:hidden` (unchanged).
- [ ] Sidebar stays `hidden md/block` (unchanged).
- [ ] `AgeQuickFilters` → `hidden md:flex`.
- [ ] Remove/guard `MobileFiltersModal` on small screens (show only `md+`).

#### Keep desktop behavior untouched

- [ ] Do not modify `ProductsSidebar` logic or visibility for `md+`.
- [ ] Keep all existing desktop filtering behavior intact.

### Testing

#### Unit (Vitest)

- [ ] `lib/utils/product-filters-url.ts`
  - [ ] Builds URLs for single/multiple categories (normalized), age group, gift
        ideas.
  - [ ] Omits unset params; handles `noPriceFilter` and `min/max` correctly.
- [ ] `features/products/hooks/useProductFilters.ts`
  - [ ] Parses `ageGroup` correctly; invalid values ignored.
  - [ ] Roundtrip: `initFromSearchParams` → `updateURL` preserves the same
        `ageGroup`.

#### Component (RTL)

- [ ] `components/layout/Header.tsx` (mobile viewport)
  - [ ] Expands "Products" then expands "Varsta"; clicking an age item calls
        `router.push("/products?ageGroup=...")` and closes the menu.
  - [ ] Expands "Category"; renders fetched categories; clicking a category
        navigates and closes the menu.
  - [ ] Clicking "Gift Ideas" navigates to
        `/products?specialCategories=GIFT_IDEAS` and closes the menu.

#### Integration

- [ ] Navigate to `/products?ageGroup=PRESCHOOL_3_5` → page lists only relevant
      products; no filters UI visible on mobile.
- [ ] Desktop viewport still shows sidebar; burger not required for filtering.

#### E2E (Playwright)

- [ ] Mobile: open burger → Products → Varsta → select "4–6 ani"; page navigates
      and filters list; no on-page filter UI visible.
- [ ] Desktop: sidebar visible and functional; selecting filters updates product
      list and URL; burger menu unchanged.

### Acceptance criteria

- [ ] On mobile, the only way to set filters is via the burger menu → Products
      section.
- [ ] `/products` reflects filters set from the menu via the existing
      client-side logic (query params).
- [ ] Desktop and tablet behavior unchanged.
- [ ] Good accessibility of menu toggles; focus states present.

### Notes

- Consider preserving existing URL params when selecting from the menu
  (optional). If needed, merge with current `URLSearchParams` before
  `router.push`.
- Keep files under 300 LOC and follow absolute imports and existing patterns.
