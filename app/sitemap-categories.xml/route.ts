import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { REMOVED_CATEGORY_PAGE_SLUGS } from "@/lib/utils/category-page-links";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.techtots.ro";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const now = new Date().toISOString();
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        slug: {
          notIn: [...REMOVED_CATEGORY_PAGE_SLUGS],
        },
      },
      select: {
        slug: true,
      },
      orderBy: {
        slug: "asc",
      },
    });

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    if (!categories || categories.length === 0) {
      sitemap += `
  <url>
    <loc>${escapeXml(`${baseUrl}/categories`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    categories.forEach(category => {
      const url = `${baseUrl}/categories/${category.slug}`;

      sitemap += `
  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
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
