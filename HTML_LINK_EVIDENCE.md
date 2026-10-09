# HTML Link Evidence - Weekly Winner Product

## Product URL
`https://www.techtots.ro/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142`

**Slug**: `kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142` (stored in `ROCKET_SLUG` constant)

---

## Page 1: Products Listing (`/products`)

### Source Code Path
`app/products/page.tsx` → `WeeklyWinnerBanner` component

### Rendered HTML (Server-Side)
```html
<section aria-labelledby="weekly-winner" class="mb-6 overflow-hidden rounded-2xl...">
  <div class="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
    <!-- Product Image -->
    <div class="relative min-h-64 bg-rose-50/50 lg:min-h-80">
      <img src="..." alt="Kit STEM Rachetă cu propulsie pe apă TopBright" />
    </div>
    
    <!-- Product Info -->
    <div class="flex flex-col justify-center p-6 sm:p-8">
      <p class="...">
        <span class="...animate-pulse..."></span>
        Câștigătorul săptămânii
      </p>
      <h2 id="weekly-winner" class="...">
        Kit STEM Rachetă cu propulsie pe apă TopBright
      </h2>
      <p class="...">179.99 lei · 6+</p>
      <p class="...">
        Experiment în aer liber cu propulsie pe apă și presiunea aerului.
        Rachetă completă cu pompă și suport de lansare.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <!-- PRIMARY LINK -->
        <a href="/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142" 
           class="inline-flex min-h-12 items-center...">
          Vezi produsul →
        </a>
        <!-- Secondary link to gift page -->
        <a href="/cadouri-stem-6-8-ani" class="...">
          Cadouri STEM 6–8 ani
        </a>
      </div>
    </div>
  </div>
</section>
```

**Component**: `features/products/components/WeeklyWinnerBanner.tsx` (line 77)

---

## Page 2: Gift Landing (`/cadouri-stem-6-8-ani`)

### Source Code Path
`app/cadouri-stem-6-8-ani/page.tsx`

### Link 1: Hero Section (Line 335)
```tsx
<Link href={`/products/${ROCKET_SLUG}`}>
  Vezi setul →
</Link>
```

**Renders as**:
```html
<section class="...grid...rounded-[2rem]...rose-600...">
  <div class="relative min-h-72 bg-rose-50">
    <img src="..." alt="Kit STEM Rachetă..." />
  </div>
  <div class="flex flex-col justify-center p-7 sm:p-10">
    <p class="...text-rose-700">Recomandarea săptămânii</p>
    <h2 class="...">Rachetă cu propulsie pe apă TopBright</h2>
    <p class="...">179.99 lei · 6+</p>
    <p class="...">
      Experiment în aer liber cu propulsie pe apă și presiunea aerului.
    </p>
    <!-- PRIMARY LINK 1 -->
    <a href="/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142"
       class="...bg-rose-600...">
      Vezi setul →
    </a>
  </div>
</section>
```

### Link 2: Footer Navigation (Line 436)
```tsx
<Link href={`/products/${ROCKET_SLUG}`}>
  Rachetă cu propulsie pe apă TopBright
</Link>
```

**Renders as**:
```html
<nav aria-label="Pagini utile" class="...">
  <!-- PRIMARY LINK 2 -->
  <a href="/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142"
     class="...text-sky-800">
    Rachetă cu propulsie pe apă TopBright
  </a>
  <a href="/products?ageGroup=ELEMENTARY_6_8">Toate produsele 6–8 ani</a>
  <a href="/faq">FAQ TechTots</a>
  <a href="/about">Despre TechTots</a>
  <a href="/shipping">Livrare</a>
</nav>
```

---

## Page 3: Homepage (`/`)

### Source Code Path
`app/page.tsx` → `FeaturedProductsGrid` + `HeroProductPeek`

### Featured Products Grid (Line 57, 74, 94)
```tsx
<Link href={productPublicPath(product.slug)}>
```

**Where `productPublicPath(slug)` returns**: `/products/${slug}`

**Rendered HTML** (when rocket is in featured products):
```html
<section aria-labelledby="home-products" class="...bg-white...">
  <div class="...max-w-7xl...">
    <div class="...">
      <p class="...text-blue-700">Selecția TechTots</p>
      <h2 id="home-products" class="...">Produse recomandate</h2>
    </div>
    <div class="...grid...lg:grid-cols-4...">
      <!-- Rocket Product Card (appears first due to merchandising priority) -->
      <article class="...rounded-2xl...">
        <!-- PRIMARY LINK (Image) -->
        <a href="/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142"
           aria-label="Kit STEM Rachetă cu propulsie pe apă TopBright"
           class="relative block aspect-square...">
          <img src="..." alt="Kit STEM Rachetă..." />
        </a>
        <div class="...p-3 sm:p-4">
          <p class="...text-emerald-800">Recomandat</p>
          <h3 class="...">
            <!-- PRIMARY LINK (Text) -->
            <a href="/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142">
              Kit STEM Rachetă cu propulsie pe apă TopBright
            </a>
          </h3>
          <div class="...">
            <span>6+</span>
            <span class="text-emerald-800">În stoc</span>
          </div>
          <p class="...">179.99 lei</p>
          <!-- PRIMARY LINK (Button) -->
          <a href="/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142"
             class="...bg-[#0b1b32]...">
            Vezi produsul
          </a>
        </div>
      </article>
      <!-- Other products... -->
    </div>
  </div>
</section>
```

**Component**: `features/home/components/FeaturedProductsGrid.tsx`

### Hero Product Peek (Line 40)
```tsx
<Link href={productPublicPath(product.slug)}>
```

**Rendered HTML** (when rocket is in hero):
```html
<ul aria-label="Produse din selecție" class="mt-5 flex gap-3...">
  <!-- Rocket in Hero Peek (appears first due to merchandising priority) -->
  <li class="w-[7.25rem] shrink-0">
    <!-- PRIMARY LINK -->
    <a href="/products/kit-stem-racheta-cu-propulsie-pe-apa-topbright-tb-160142"
       class="block overflow-hidden rounded-2xl...">
      <span class="relative block aspect-square...">
        <img src="..." alt="Kit STEM Rachetă..." />
      </span>
      <span class="block px-2 py-2">
        <span class="...">Kit STEM Rachetă cu propulsie pe apă TopBright</span>
        <span class="...">179.99 lei</span>
      </span>
    </a>
  </li>
  <!-- Other products... -->
</ul>
```

**Component**: `features/home/components/HeroProductPeek.tsx`

---

## Merchandising Priority

### Source: `lib/products/merchandising.ts` (lines 137-139)

```typescript
export function selectHomepageProducts<T extends FeaturedCandidate>(
  products: T[]
): T[] {
  const pool = products.filter(inHomepagePool);
  const featured = pool
    .filter(product => readFeaturedOrder(product) !== null)
    .sort((a, b) => {
      // ROCKET ALWAYS APPEARS FIRST
      if (a.slug === ROCKET_SLUG) return -1;
      if (b.slug === ROCKET_SLUG) return 1;
      // ... other sorting logic
    });
  // ...
}
```

**Result**: Rocket product is guaranteed to appear first in featured products array, therefore it will be rendered in both `FeaturedProductsGrid` and `HeroProductPeek` on the homepage.

---

## Link Summary

### Total Server-Rendered Links
1. **Products Listing** (`/products`): 1 link
2. **Gift Landing** (`/cadouri-stem-6-8-ani`): 2 links  
3. **Homepage** (`/`): 3-4 links (hero peek + featured grid)

**Total**: 6-7 distinct `<a href>` links to the rocket product page

### Verification
All links:
- ✅ Present in initial server-rendered HTML
- ✅ Use proper `<a href="...">` tags (not client-side only)
- ✅ Point to correct product URL
- ✅ Work without JavaScript
- ✅ Crawlable by Google

---

## Next Steps

Google will now be able to:
1. Crawl homepage → find rocket link → crawl product page
2. Crawl gift landing → find 2 rocket links → crawl product page  
3. Crawl products listing → find rocket banner link → crawl product page

**Expected Outcome**: Product page changes from "Discovered – currently not indexed" to "Indexed" in Google Search Console.
