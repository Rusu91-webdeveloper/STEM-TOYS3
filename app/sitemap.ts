import { MetadataRoute } from "next";

// Base URL for the site - use an environment variable or localhost during build
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Supported languages
const languages = ["ro", "en"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes that should always be included
  let sitemapEntries: MetadataRoute.Sitemap = [];

  // Add homepage for each language
  languages.forEach((lang) => {
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
    ];

    mainSections.forEach((section) => {
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
      languages.forEach((lang) => {
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

      // Add blog post routes for each language
      languages.forEach((lang) => {
        blogPosts.forEach(
          (post: { slug: string; updatedAt?: string; publishedAt: string }) => {
            sitemapEntries.push({
              url:
                lang === "ro"
                  ? `${baseUrl}/blog/${post.slug}`
                  : `${baseUrl}/${lang}/blog/${post.slug}`,
              lastModified: post.updatedAt
                ? new Date(post.updatedAt)
                : new Date(post.publishedAt),
              changeFrequency: "monthly",
              priority: 0.7,
            });
          }
        );
      });
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
      languages.forEach((lang) => {
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

  languages.forEach((lang) => {
    stemCategories.forEach((category) => {
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
