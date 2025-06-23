import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://techtots.com";

  return {
    rules: [
      // Primary rule for all crawlers
      {
        userAgent: "*",
        allow: [
          "/",
          "/products/",
          "/categories/",
          "/blog/",
          "/books/",
          "/about/",
          "/contact/",
          "/warranty/",
          "/returns/",
          "/privacy/",
          "/terms/",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/checkout/",
          "/account/",
          "/guest-orders/",
          "/_next/",
          "/unsubscribe/",
          "/offline/",
          "/*?*", // Prevent indexing of pages with query parameters
          "/products/*?*", // Except allow clean product URLs
          "/categories/*?*", // Except allow clean category URLs
          "/blog/*?*", // Except allow clean blog URLs
        ],
        crawlDelay: 1, // Be respectful to server resources
      },

      // Optimized rule for Google
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/products/",
          "/categories/",
          "/blog/",
          "/books/",
          "/about/",
          "/contact/",
          "/warranty/",
          "/returns/",
          "/privacy/",
          "/terms/",
          "/ro/", // Romanian content
          "/en/", // English content
        ],
        disallow: ["/admin/", "/api/", "/auth/", "/checkout/", "/account/"],
      },

      // Mobile-first crawling for Google Mobile
      {
        userAgent: "Googlebot-Mobile",
        allow: ["/", "/products/", "/categories/", "/blog/", "/books/"],
        disallow: ["/admin/", "/api/", "/auth/", "/checkout/", "/account/"],
      },

      // Optimized for Bing
      {
        userAgent: "Bingbot",
        allow: ["/", "/products/", "/categories/", "/blog/", "/books/"],
        disallow: ["/admin/", "/api/", "/auth/", "/checkout/", "/account/"],
        crawlDelay: 2, // Bing recommends slightly higher delay
      },

      // Block AI training bots (common practice for content protection)
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        disallow: ["/"],
      },
      {
        userAgent: "Google-Extended",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
      {
        userAgent: "Claude-Web",
        disallow: ["/"],
      },

      // Block common bad bots
      {
        userAgent: "SemrushBot",
        disallow: ["/"],
      },
      {
        userAgent: "AhrefsBot",
        disallow: ["/"],
      },
      {
        userAgent: "MJ12bot",
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
