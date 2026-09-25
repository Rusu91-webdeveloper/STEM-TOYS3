import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, permanentRedirect } from "next/navigation";

import { getCombinedProduct } from "@/lib/api/products";
import { toPublicProductSlug } from "@/lib/products/public-slug";

type SlashSlugPageProps = {
  params: Promise<{
    slug: string;
    segment: string;
  }>;
};

/**
 * Stored product slugs that contain one slash are requested as two path
 * segments (for example `/products/giroscop-navir-N_6010/CB`). Send those
 * requests to the single-segment public slug. Unknown pairs still 404.
 */
async function redirectSlashSlug(
  params: SlashSlugPageProps["params"]
): Promise<never> {
  const { slug, segment } = await params;
  const publicSlug = toPublicProductSlug(`${slug}/${segment}`);
  const product = await getCombinedProduct(publicSlug);

  if (!product || product.isActive === false) {
    noStore();
    notFound();
  }

  permanentRedirect(`/products/${publicSlug}`);
}

export function generateMetadata({
  params,
}: SlashSlugPageProps): Promise<Metadata> {
  return redirectSlashSlug(params);
}

export default function SlashProductSlugPage({ params }: SlashSlugPageProps) {
  return redirectSlashSlug(params);
}
