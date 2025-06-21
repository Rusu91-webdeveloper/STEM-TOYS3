# SEO Optimization Guide for NextCommerce

This guide provides a comprehensive approach to optimizing your NextCommerce e-commerce website for search engines, focusing on STEM toys and educational products.

## Table of Contents

1. [Metadata Structure](#metadata-structure)
2. [Page-Specific SEO](#page-specific-seo)
3. [URL Structure](#url-structure)
4. [Structured Data](#structured-data)
5. [Site-Wide SEO Best Practices](#site-wide-seo-best-practices)
6. [Internal Linking Strategy](#internal-linking-strategy)
7. [Keyword Optimization](#keyword-optimization)
8. [Performance Optimization](#performance-optimization)
9. [Implementation Guide](#implementation-guide)
10. [Verification and Monitoring](#verification-and-monitoring)

## Metadata Structure

### JSON Structure for Metadata Fields

All content models (Product, Category, Blog, Book) use a consistent JSON structure for their `metadata` field:

```json
{
  "metaTitle": "Custom SEO Title | TechTots",
  "metaDescription": "Concise description under 160 characters for better search engine visibility",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "structuredData": {}, // Optional custom structured data
  "canonical": "https://techtots.com/canonical-url" // Optional canonical URL
}
```

### StoreSettings Fields

The `StoreSettings` model contains dedicated fields for homepage SEO:

- `metaTitle`: Main site title
- `metaDescription`: Primary site description
- `metaKeywords`: Comma-separated list of keywords

## Page-Specific SEO

### Homepage

```typescript
// app/page.tsx
import { getStoreSettings } from "@/lib/api/settings";
import { generateHomepageMetadata } from "@/lib/utils/seo";

export async function generateMetadata() {
  const storeSettings = await getStoreSettings();
  return generateHomepageMetadata(storeSettings);
}
```

Key elements:

- H1 tag with primary keyword (e.g., "STEM Toys for Curious Minds")
- Featured products section with proper heading structure
- Organization schema markup

### Product Pages

```typescript
// app/products/[slug]/page.tsx
import { getProduct } from "@/lib/api/products";
import { generateProductMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  return generateProductMetadata(product);
}
```

Key elements:

- Unique meta title: "[Product Name] | STEM Toy for [Category]"
- Product schema markup with price, availability, and reviews
- Descriptive image alt texts
- Technical specifications in structured format

### Category Pages

```typescript
// app/categories/[slug]/page.tsx
import { getCategory } from "@/lib/api/categories";
import { generateCategoryMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ params }) {
  const category = await getCategory(params.slug);
  return generateCategoryMetadata(category);
}
```

Key elements:

- Breadcrumb navigation
- Category schema markup
- H1 tag with category name
- Descriptive category introduction (150-200 words)

### Blog Pages

```typescript
// app/blog/[slug]/page.tsx
import { getBlogPost } from "@/lib/api/blog";
import { generateBlogMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ params }) {
  const blog = await getBlogPost(params.slug);
  return generateBlogMetadata(blog);
}
```

Key elements:

- Article schema markup
- Author information
- Published and modified dates
- Related products section
- Social sharing meta tags

### Book Pages

```typescript
// app/books/[slug]/page.tsx
import { getBook } from "@/lib/api/books";
import { generateBookMetadata } from "@/lib/utils/seo";

export async function generateMetadata({ params }) {
  const book = await getBook(params.slug);
  return generateBookMetadata(book);
}
```

Key elements:

- Book schema markup
- Language availability information
- Educational value proposition
- Author information

### Non-Content Pages

For checkout, cart, account, and other non-content pages:

```typescript
export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
};
```

## URL Structure

The site follows a clean, hierarchical URL structure:

- Products: `/products/[slug]`
- Categories: `/categories/[slug]`
- Nested categories: `/categories/[parent-slug]/[child-slug]`
- Blog posts: `/blog/[slug]`
- Books: `/books/[slug]`

### Slug Generation

Use the `generateSlug` utility to create SEO-friendly slugs:

```typescript
import { generateSlug } from "@/lib/utils/seo";

const slug = generateSlug("STEM Robot Kit for Kids");
// Output: "stem-robot-kit-for-kids"
```

## Structured Data

The SEO utilities automatically generate appropriate structured data for each page type:

- **Products**: Product schema with price, availability, and reviews
- **Categories**: CollectionPage and BreadcrumbList schemas
- **Blog Posts**: BlogPosting schema with author and publish date
- **Books**: Book schema with author and language information
- **Homepage**: WebSite and Organization schemas

Example implementation:

```jsx
// In your page component
import { useStructuredData } from "@/hooks/use-structured-data";

export default function ProductPage({ product }) {
  // The structured data is automatically included in the page metadata
  // but you can also use it directly in the page if needed
  useStructuredData(product.structuredData);

  return (
    <div>
      <h1>{product.name}</h1>
      {/* Rest of the product page */}
    </div>
  );
}
```

## Site-Wide SEO Best Practices

### XML Sitemap

The site automatically generates a sitemap at `/sitemap.xml` using Next.js's built-in sitemap support:

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";
import {
  getAllProducts,
  getAllCategories,
  getAllBlogs,
  getAllBooks,
} from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const categories = await getAllCategories();
  const blogs = await getAllBlogs();
  const books = await getAllBooks();

  // Generate sitemap entries for all content
  // ...
}
```

### Robots.txt

The site includes a robots.txt file that guides search engine crawlers:

```typescript
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products/", "/categories/", "/blog/"],
        disallow: ["/admin", "/api/", "/checkout/", "/account/"],
      },
    ],
    sitemap: "https://techtots.com/sitemap.xml",
  };
}
```

### Canonical Tags

All pages include canonical tags to prevent duplicate content issues:

```html
<link
  rel="canonical"
  href="https://techtots.com/products/stem-robot-kit" />
```

This is handled automatically by the metadata utilities.

### Image Optimization

Use the Next.js Image component for all images:

```jsx
import Image from "next/image";

<Image
  src={product.image}
  alt={product.name}
  width={800}
  height={600}
  priority={true} // For above-the-fold images
/>;
```

### Hreflang Tags for Multilingual Support

For multilingual pages, the metadata includes proper hreflang tags:

```html
<link
  rel="alternate"
  hreflang="ro"
  href="https://techtots.com/ro/products/stem-robot-kit" />
<link
  rel="alternate"
  hreflang="en"
  href="https://techtots.com/en/products/stem-robot-kit" />
```

## Internal Linking Strategy

### Blog to Product Links

In blog posts, link to relevant products using descriptive anchor text:

```jsx
<Link href={`/products/${product.slug}`}>
  Check out our {product.name} for hands-on learning
</Link>
```

### Category to Related Categories

On category pages, include links to related categories:

```jsx
<div className="related-categories">
  <h3>Related Categories</h3>
  <ul>
    {relatedCategories.map((category) => (
      <li key={category.id}>
        <Link href={`/categories/${category.slug}`}>{category.name}</Link>
      </li>
    ))}
  </ul>
</div>
```

### Product to Blog Content

On product pages, link to relevant blog posts that mention the product:

```jsx
<div className="related-content">
  <h3>Learn More</h3>
  <ul>
    {relatedBlogs.map((blog) => (
      <li key={blog.id}>
        <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
      </li>
    ))}
  </ul>
</div>
```

## Keyword Optimization

### Primary Keywords

Focus on these primary keywords for the Romanian market:

- "jucării STEM"
- "jucării educative România"
- "jucării știință București"
- "jucării tehnologie copii"
- "jucării inginerie"
- "jucării matematică"

### Long-Tail Keywords

Incorporate these long-tail keywords:

- "jucării STEM pentru copii 8-12 ani"
- "kit robotică pentru începători"
- "jocuri educative știință acasă"
- "cadouri educaționale pentru copii pasionați de știință"

### Keyword Research Tools

- Google Keyword Planner
- Ahrefs
- SEMrush
- Ubersuggest

### Keyword Implementation

1. Include keywords in meta titles and descriptions
2. Use keywords naturally in product descriptions
3. Include keywords in image alt text
4. Use keywords in URL slugs
5. Include keywords in H1, H2, and H3 tags

## Performance Optimization

### Core Web Vitals

Optimize for Google's Core Web Vitals:

- **LCP (Largest Contentful Paint)**: Optimize image loading with Next.js Image
- **FID (First Input Delay)**: Minimize JavaScript execution time
- **CLS (Cumulative Layout Shift)**: Set image dimensions and use proper layout techniques

### Page Speed Optimization

- Use Next.js App Router for server components
- Implement code splitting
- Optimize image delivery with Next.js Image
- Implement lazy loading for below-the-fold content
- Use the `priority` prop for above-the-fold images

### Mobile Optimization

- Ensure responsive design for all pages
- Test on various mobile devices
- Implement proper touch targets (min 44x44 pixels)
- Optimize font sizes for mobile reading

## Implementation Guide

### Step 1: Update Prisma Schema

The Prisma schema already includes metadata fields for all content types.

### Step 2: Create SEO Utilities

The `lib/utils/seo.ts` file contains utilities for generating metadata for different page types.

### Step 3: Add SEO Component to Admin Forms

Use the `SeoMetadataField` component in admin forms to allow editors to customize SEO metadata:

```jsx
import SeoMetadataField from "@/components/SeoMetadataField";

export function ProductForm({ product }) {
  return (
    <form>
      {/* Other form fields */}

      <SeoMetadataField
        value={product.metadata}
        onChange={(value) => setFormData({ ...formData, metadata: value })}
        defaultTitle={product.name}
        defaultDescription={product.description}
      />

      {/* Submit button */}
    </form>
  );
}
```

### Step 4: Update Page Components

Update all page components to use the SEO utilities for metadata generation.

### Step 5: Implement Structured Data

The SEO utilities automatically generate appropriate structured data for each page type.

## Verification and Monitoring

### Tools for Verification

- Google Search Console
- Bing Webmaster Tools
- Screaming Frog SEO Spider
- Schema.org Validator (https://validator.schema.org/)

### Regular Monitoring

- Set up monthly SEO audits
- Monitor keyword rankings
- Check for crawl errors in Google Search Console
- Verify mobile usability
- Monitor Core Web Vitals

### Performance Testing

- Use Lighthouse for performance testing
- Test page speed with Google PageSpeed Insights
- Monitor real user metrics with Google Analytics

## Conclusion

By implementing these SEO best practices, your NextCommerce e-commerce website will be well-positioned to rank highly in search engine results, particularly for STEM toys and educational products in the Romanian market.

Remember that SEO is an ongoing process. Regularly update your content, monitor your performance, and adjust your strategy based on results.
