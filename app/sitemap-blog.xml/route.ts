import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.techtots.ro";

export async function GET() {
  try {
    // Get all blog posts
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        metadata: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    // Supported languages
    const languages = ["ro", "en"];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    // Add blog posts (hybrid: use -ro / -en when present)
    blogs.forEach(blog => {
      const lastmod = new Date(
        blog.updatedAt || blog.publishedAt || new Date()
      ).toISOString();
      const slug = blog.slug;
      const hasRo = slug.endsWith("-ro");
      const hasEn = slug.endsWith("-en");
      const base = hasRo || hasEn ? slug.slice(0, -3) : slug;

      const roSlug = `${base}-ro`;
      const enSlug = `${base}-en`;

      // For each base, emit one entry per language with hreflang alternates
      languages.forEach(lang => {
        const langSlug = lang === "ro" ? roSlug : enSlug;
        const url = `${baseUrl}/blog/${langSlug}`;
        sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>`;
        // alternates
        sitemap += `
    <xhtml:link rel="alternate" hreflang="ro" href="${baseUrl}/blog/${roSlug}" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/blog/${enSlug}" />`;
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
    console.error("Error generating blog sitemap:", error);

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
