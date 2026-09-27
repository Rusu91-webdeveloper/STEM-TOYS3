import type { Metadata } from "next";

import { metadata as productsMetadata } from "@/app/products/metadata";
import { loadStorefrontCatalog } from "@/lib/products/category-listing";
import { countIndexableListing } from "@/lib/products/category-query";
import {
  buildProductsListingPath,
  listingTotalPages,
  parseProductsPage,
} from "@/lib/utils/products-listing-url";

const ORIGIN = "https://www.techtots.ro";

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value.find(item => item.length > 0);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function generateProductsMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = parseProductsPage(params.page);
  const category = firstParam(params.category);
  const ageGroup = firstParam(params.ageGroup);

  let totalPages = page;
  try {
    const catalog = await loadStorefrontCatalog();
    totalPages = listingTotalPages(
      countIndexableListing(catalog, { category, ageGroup })
    );
  } catch (error) {
    console.error("Products listing metadata count failed:", error);
  }

  const canonicalPath = buildProductsListingPath(params, page);
  const canonical = `${ORIGIN}${canonicalPath}`;
  const pagination: NonNullable<Metadata["pagination"]> = {};

  if (page > 1) {
    pagination.previous = `${ORIGIN}${buildProductsListingPath(params, page - 1)}`;
  }
  if (page < totalPages) {
    pagination.next = `${ORIGIN}${buildProductsListingPath(params, page + 1)}`;
  }

  return {
    ...productsMetadata,
    alternates: {
      ...productsMetadata.alternates,
      canonical,
    },
    openGraph: {
      ...productsMetadata.openGraph,
      url: canonical,
    },
    pagination,
  };
}
