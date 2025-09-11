### TechTots SEO Implementations

This document explains the exact SEO features implemented in this project, where
they live, and how to use them. It consolidates content from prior SEO notes
into a single, clear guide.

### Core SEO Utilities

- **Metadata factory (`createMetadata`)**: Centralized builder for Next.js
  `Metadata` with multilingual alternates, canonical URLs, OpenGraph, Twitter,
  robots, verification, and optional structured data injection.
  - File: `lib/metadata.ts`
  - Key capabilities:
    - **Alternates + hreflang**: Builds `alternates.languages` for `ro` and
      `en`, and `openGraph.alternateLocale`.
    - **Canonical**: `alternates.canonical` computed from
      `NEXT_PUBLIC_BASE_URL`/hardcoded base and `pathWithoutLocale` or an
      explicit `canonicalUrl`.
    - **OpenGraph/Twitter**: Title, description, image (1200×630), site name,
      URL.
    - **Robots**: Per-page `index/follow` flags and Googlebot directives.
    - **Geo meta**: `geo.placename`, `geo.region`, coordinates.
    - **Verification**: Supports `verification.google`, `verification.yandex`
      and additional `other` meta entries (e.g., `google-site-verification`).
    - **Structured data pass-through**: Accepts `structuredData` (object or
      array) and stores it under `metadata.other.structuredData` as a JSON
      string. Rendering to `<script type="application/ld+json">` is done at the
      layout level (see Usage → Rendering JSON‑LD).

- **Page-level metadata files**: Many routes export `metadata` or
  `generateMetadata` using the factory for consistent SEO.
  - Examples:
    - Root/sitewide: `app/metadata.ts` (combines `WebSite` and `Organization`
      JSON-LD, verification meta, keywords)
    - Categories index: `app/categories/metadata.ts`
    - Products index: `app/products/metadata.ts`
    - Blog post dynamic: `app/blog/[slug]/metadata.ts` (via helper in
      `lib/utils/seo.ts`)

### JSON-LD (Structured Data)

Structured data objects are authored in feature helpers and passed to
`createMetadata`:

- File: `lib/utils/seo.ts`
  - **Product pages**: `generateProductMetadata(product)` builds `Product` +
    `BreadcrumbList` JSON‑LD and merges SEO keywords, canonical, translations.
  - **Category pages**: `generateCategoryMetadata(category)` builds
    `CollectionPage` + `BreadcrumbList` JSON‑LD.
  - **Blog posts**: `generateBlogMetadata(blog)` builds `BlogPosting` JSON‑LD.
  - **Books**: `generateBookMetadata(book)` builds `Book` JSON‑LD.
  - **Homepage**: `generateHomepageMetadata(settings)` composes keywords and
    optional `structuredData`.

Note: `createMetadata` stores structured data under
`metadata.other.structuredData`. To ensure it is emitted to the DOM, include a
small renderer in the root layout (see “Rendering JSON‑LD” below).

### Sitemaps

- **Primary sitemap**: `app/sitemap.ts`
  - Generates localized URLs for `ro` and `en` with priorities and change
    frequencies.
  - Fetches dynamic entries from `/api/products`, `/api/blog`, and
    `/api/categories` with timeouts and appends them.

- **Split sitemaps** (optional/indexed):
  - `app/sitemap-index.xml/route.ts` – Index linking to separate sitemaps
  - `app/sitemap-products.xml/route.ts` – Product URLs with
    `<xhtml:link hreflang>` alternates
  - `app/sitemap-blog.xml/route.ts` – Blog URLs with `<xhtml:link hreflang>`
    alternates
  - `app/sitemap-categories.xml/route.ts` – Category URLs

Submit `sitemap.xml` and/or the split sitemaps in Google Search Console.

### robots.txt

- File: `app/robots.ts`
  - Allows key public routes; disallows admin, auth, checkout, account,
    query-string pages; sets crawl delays for general and Bing; includes
    specific rules for Google and mobile; blocks common AI-training and bad
    bots.
  - Exposes `sitemap: ${BASE_URL}/sitemap.xml` and `host`.

### Multilingual SEO

- `lib/metadata.ts` configures:
  - `alternates.languages` like `{ ro: "/{path}", en: "/en/{path}" }`
  - `openGraph.alternateLocale` set to `ro_RO` and `en_{region}`
  - `metadataBase` set to the site base URL
- Usage: pass `pathWithoutLocale` and optional `translations` when calling
  `createMetadata` to get localized titles/descriptions and hreflang.

### Google Search Console Verification

- Global: `app/metadata.ts` sets
  - `verification.google` and `other["google-site-verification"]`
- Static HTML token: `public/google-site-verification.html` is also present.

### How to Use These Implementations

1. Add SEO to a new page (static)

```ts
// app/your-page/metadata.ts
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "metaTitle",
  description: "metaDescription",
  keywords: ["your", "keywords"],
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/your-page",
  translations: {
    ro: { title: "Titlu în română", description: "Descriere" },
    en: { title: "English title", description: "Description" },
  },
});
```

2. Add SEO to a dynamic detail page (e.g., product)

```ts
// app/products/[slug]/metadata.ts
import { generateProductMetadata } from "@/lib/utils/seo";
import { getProductBySlug } from "@/lib/services/products";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  return generateProductMetadata(product);
}
```

3. Rendering JSON‑LD (if not yet in layout)

```tsx
// app/layout.tsx (or a dedicated component)
import { headers } from "next/headers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If using createMetadata structuredData pass-through:
  // Read it from metadata in a client component or echo via a server component prop.
  // Example (server):
  const structuredData = undefined; // inject from metadata.other.structuredData if desired
  return (
    <html lang="ro">
      <body>
        {children}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: structuredData }}
          />
        )}
      </body>
    </html>
  );
}
```

4. Sitemaps and robots

- Nothing to do per page. The routes are already implemented:
  - `app/sitemap.ts` (primary)
  - `app/sitemap-*.xml/route.ts` (split)
  - `app/robots.ts`

### Operational Notes

- Ensure `NEXT_PUBLIC_BASE_URL` reflects the production domain. Some helpers use
  a constant fallback to `https://www.techtots.ro`.
- For Bing verification, set `other["msvalidate.01"]` in `app/metadata.ts` once
  you have the code.
- When adding new locales, extend `metadataLanguages` in `lib/metadata.ts` and
  sitemaps.

### Quick References (file snippets)

```131:162:app/metadata.ts
export const metadata = createMetadata({
  keywords: mainKeywords,
  structuredData: combinedStructuredData,
  verification: { google: "46d30c56bd33dcae" },
  other: { "google-site-verification": "46d30c56bd33dcae" },
  translations: { ro: { title: "TechTots | Jucării STEM..." }, en: { title: "TechTots | STEM Toys..." } },
});
```

```44:114:lib/metadata.ts
export function createMetadata({ ... }): Metadata {
  return {
    alternates: { languages, canonical },
    openGraph: { title, description, images: [{ width: 1200, height: 630 }], url },
    twitter: { card: "summary_large_image" },
    robots: { index: !noindex, follow: !noindex },
    metadataBase: new URL(baseUrl),
    other: { geo: ..., structuredData: JSON.stringify(structuredData) },
  };
}
```

```9:21:app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // generates localized routes and fetches dynamic products/blog/categories
}
```

```3:17:app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return { rules: [...], sitemap: `${baseUrl}/sitemap.xml`, host: baseUrl };
}
```
