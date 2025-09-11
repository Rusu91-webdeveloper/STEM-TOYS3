import { NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.techtots.ro";
const languages = ["ro", "en"];

export async function GET() {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  try {
    // Fetch products
    const productsResponse = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (productsResponse.ok) {
      const products = await productsResponse.json();

      if (Array.isArray(products)) {
        products.forEach((product: { slug: string; updatedAt?: string }) => {
          languages.forEach(lang => {
            const url =
              lang === "ro"
                ? `${baseUrl}/products/${product.slug}`
                : `${baseUrl}/${lang}/products/${product.slug}`;

            const lastmod = product.updatedAt
              ? new Date(product.updatedAt).toISOString()
              : new Date().toISOString();

            sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

            // Add hreflang for multilingual support
            languages.forEach(hreflang => {
              const hreflangUrl =
                hreflang === "ro"
                  ? `${baseUrl}/products/${product.slug}`
                  : `${baseUrl}/${hreflang}/products/${product.slug}`;
              sitemap += `
    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${hreflangUrl}" />`;
            });

            sitemap += `
  </url>`;
          });
        });
      }
    }
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
  }

  sitemap += `
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
