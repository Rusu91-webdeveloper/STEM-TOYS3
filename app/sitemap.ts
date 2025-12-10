import { MetadataRoute } from "next";

// Base URL for the site - use an environment variable or localhost during build
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.techtots.ro";

// Supported languages (currently only Romanian URLs are live)
const languages = ["ro"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes that should always be included
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add homepage for each language
  languages.forEach(lang => {
    // Root URLs have higher priority
    sitemapEntries.push({
      url: lang === "ro" ? baseUrl : `${baseUrl}/${lang}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    });

    // Main sections
    const mainSections = [
      { path: "products", priority: 0.9, changeFreq: "daily" },
      { path: "categories", priority: 0.8, changeFreq: "weekly" },
      { path: "blog", priority: 0.8, changeFreq: "weekly" },
      { path: "about", priority: 0.7, changeFreq: "monthly" },
      { path: "contact", priority: 0.7, changeFreq: "monthly" },
      { path: "faq", priority: 0.6, changeFreq: "monthly" },
      { path: "ghid-jucarii-stem-2025", priority: 0.7, changeFreq: "monthly" },
      {
        path: "jucarii-stem-dupa-varsta",
        priority: 0.7,
        changeFreq: "monthly",
      },
      {
        path: "beneficiile-jucariilor-stem",
        priority: 0.7,
        changeFreq: "monthly",
      },
      // NEW SEO LANDING PAGES - HIGH PRIORITY
      {
        path: "ghid-educatie-stem-romania",
        priority: 0.9,
        changeFreq: "weekly",
      },
      {
        path: "jucarii-stem-copii-6-8-ani", 
        priority: 0.8,
        changeFreq: "weekly",
      },
      {
        path: "blog/beneficiile-educatiei-stem-pentru-copiii-romani",
        priority: 0.8,
        changeFreq: "monthly",
      },
    ];

    mainSections.forEach(section => {
      sitemapEntries.push({
        url:
          lang === "ro"
            ? `${baseUrl}/${section.path}`
            : `${baseUrl}/${lang}/${section.path}`,
        lastModified: new Date(),
        changeFrequency: section.changeFreq as any,
        priority: section.priority,
      });
    });
  });

  // Try to fetch dynamic products with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const productsResponse = await fetch(`${baseUrl}/api/products`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (productsResponse && productsResponse.ok) {
      const products = await productsResponse.json();

      // Add product routes for each language
      languages.forEach(lang => {
        // Ensure products is an array before calling forEach
        if (Array.isArray(products)) {
          products.forEach((product: { slug: string; updatedAt?: string }) => {
            sitemapEntries.push({
              url:
                lang === "ro"
                  ? `${baseUrl}/products/${product.slug}`
                  : `${baseUrl}/${lang}/products/${product.slug}`,
              lastModified: product.updatedAt
                ? new Date(product.updatedAt)
                : new Date(),
              changeFrequency: "weekly",
              priority: 0.8,
            });
          });
        }
      });
    }
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    // Continue with static routes
  }

  // Try to fetch dynamic blog posts with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const blogResponse = await fetch(`${baseUrl}/api/blog`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (blogResponse && blogResponse.ok) {
      const blogPosts = await blogResponse.json();

      if (Array.isArray(blogPosts)) {
        // Hybrid: ensure both -ro and -en variants are included for each base slug
        blogPosts.forEach(
          (post: { slug: string; updatedAt?: string; publishedAt: string }) => {
            const hasRo = post.slug.endsWith("-ro");
            const hasEn = post.slug.endsWith("-en");
            const base = hasRo || hasEn ? post.slug.slice(0, -3) : post.slug;
            const roSlug = `${base}-ro`;
            const enSlug = `${base}-en`;

            const lastMod = post.updatedAt
              ? new Date(post.updatedAt)
              : new Date(post.publishedAt);

            // Romanian
            sitemapEntries.push({
              url: `${baseUrl}/blog/${roSlug}`,
              lastModified: lastMod,
              changeFrequency: "monthly",
              priority: 0.7,
            });
            // English
            sitemapEntries.push({
              url: `${baseUrl}/blog/${enSlug}`,
              lastModified: lastMod,
              changeFrequency: "monthly",
              priority: 0.7,
            });
          }
        );
      }
    }
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
    // Continue with static routes
  }

  // Try to fetch categories with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const categoriesResponse = await fetch(`${baseUrl}/api/categories`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (categoriesResponse && categoriesResponse.ok) {
      const categories = await categoriesResponse.json();

      // Add category routes for each language
      languages.forEach(lang => {
        // Ensure categories is an array before calling forEach
        if (Array.isArray(categories)) {
          categories.forEach((category: { slug: string }) => {
            sitemapEntries.push({
              url:
                lang === "ro"
                  ? `${baseUrl}/categories/${category.slug}`
                  : `${baseUrl}/${lang}/categories/${category.slug}`,
              lastModified: new Date(),
              changeFrequency: "monthly",
              priority: 0.7,
            });
          });
        }
      });
    }
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
    // Continue with static routes
  }

  // Add STEM category specific pages - these are important for SEO
  const stemCategories = [
    "science",
    "technology",
    "engineering",
    "mathematics",
  ];

  languages.forEach(lang => {
    stemCategories.forEach(category => {
      sitemapEntries.push({
        url:
          lang === "ro"
            ? `${baseUrl}/categories/${category}`
            : `${baseUrl}/${lang}/categories/${category}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8, // Higher priority for STEM categories
      });
    });
  });

  return sitemapEntries;
}
