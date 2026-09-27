import { NextResponse } from "next/server";

import { CANONICAL_CATEGORY_SLUGS } from "@/lib/products/stem-category";

function siteBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "https://www.techtots.ro";
}

const baseUrl = siteBaseUrl();

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const now = new Date().toISOString();
  const paths = [
    "/categories",
    ...CANONICAL_CATEGORY_SLUGS.map(slug => `/categories/${slug}`),
  ];

  const body = paths
    .map(
      path => `  <url>
    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === "/categories" ? "0.7" : "0.8"}</priority>
  </url>`
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
