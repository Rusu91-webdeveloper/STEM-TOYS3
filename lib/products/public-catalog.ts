import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

import { toPublicProductSlug } from "./public-slug";

export type CatalogVisibility = "public" | "any";

/**
 * Resolve a product id from a public slug.
 * Matches the stored slug case-insensitively, then a slash-normalized form
 * so `giroscop-navir-n_6010-cb` finds `giroscop-navir-N_6010/CB`.
 */
export async function resolveProductId(
  rawSlug: string,
  visibility: CatalogVisibility
): Promise<string | null> {
  const publicSlug = toPublicProductSlug(rawSlug);
  const publicOnly = visibility === "public";

  const exact = await db.product.findFirst({
    where: {
      ...(publicOnly ? { isActive: true, status: "APPROVED" } : {}),
      slug: { equals: publicSlug, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (exact) {
    return exact.id;
  }

  const rows = publicOnly
    ? await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM "Product"
        WHERE "isActive" = true
          AND status::text = 'APPROVED'
          AND lower(replace(slug, '/', '-')) = ${publicSlug}
        LIMIT 1
      `)
    : await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM "Product"
        WHERE lower(replace(slug, '/', '-')) = ${publicSlug}
        LIMIT 1
      `);

  return rows[0]?.id ?? null;
}

/** Resolve an active book id from a public slug, including slash-normalized slugs. */
export async function resolveActiveBookId(
  rawSlug: string
): Promise<string | null> {
  const publicSlug = toPublicProductSlug(rawSlug);

  const exact = await db.book.findFirst({
    where: {
      isActive: true,
      slug: { equals: publicSlug, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (exact) {
    return exact.id;
  }

  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "Book"
    WHERE "isActive" = true
      AND lower(replace(slug, '/', '-')) = ${publicSlug}
    LIMIT 1
  `);

  return rows[0]?.id ?? null;
}
