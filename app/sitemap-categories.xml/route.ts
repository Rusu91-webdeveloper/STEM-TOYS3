import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.techtots.ro";

export async function GET() {
  try {
    // Get all categories
    const categories = await prisma.category.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Supported languages
    const languages = ["ro", "en"];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    // If no categories, include the categories index page so the sitemap always has at least one <url>
    if (!categories || categories.length === 0) {
      const now = new Date().toISOString();
      ["ro", "en"].forEach(lang => {
        const url =
          lang === "ro"
            ? `${baseUrl}/categories`
            : `${baseUrl}/${lang}/categories`;
        sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
    }

    // Add categories
    categories.forEach(category => {
      const lastmod = new Date(
        category.updatedAt || category.createdAt || new Date()
      ).toISOString();

      languages.forEach(lang => {
        const url =
          lang === "ro"
            ? `${baseUrl}/categories/${category.slug}`
            : `${baseUrl}/${lang}/categories/${category.slug}`;

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
              ? `${baseUrl}/categories/${category.slug}`
              : `${baseUrl}/${hreflang}/categories/${category.slug}`;
          sitemap += `
    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${hreflangUrl}" />`;
        });

        sitemap += `
  </url>`;
      });
    });

    sitemap += `
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating categories sitemap:", error);

    // Return empty sitemap on error
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    return new NextResponse(emptySitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  }
}
