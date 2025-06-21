import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://techtots.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products/", "/categories/", "/blog/", "/about/"],
        disallow: [
          "/admin",
          "/api/",
          "/auth/",
          "/checkout/",
          "/direct-verify/",
          "/account/",
          "/*?query=*", // Prevent indexing of search result pages
          "/*?sort=*", // Prevent indexing of sorted pages
        ],
      },
      // Specific rule for Google
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      // Specific rule for Bing
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      // Specific rule for Yahoo
      {
        userAgent: "Slurp",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      // Specific rule for Yandex
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
