import { GLOVE_SLUG, ROCKET_SLUG } from "./merchandising";
import type { Product } from "@/types/product";

export const CRISTALE_4M_SLUG =
  "set-cristale-rosu-4m-experiment-stem-viral-4M-03929";

export const CRISTALE_4M_FACTUAL_DESCRIPTION =
  "Set educativ 4M pentru creșterea unui cristal roșu acasă. Kitul include materialul pentru cristalizare, recipientul de creștere, baza de expunere și instrucțiunile experimentului. Procesul de cristalizare poate fi urmărit pe parcursul mai multor zile. Vârsta recomandată de producător este 10+. Respectă pașii și indicațiile de siguranță din instrucțiunile incluse în cutie.";

type ProductContentOverride = {
  description?: string;
  brand: string;
  manufacturerAge: string;
  ageGroup?: Product["ageGroup"];
};

const PRODUCT_CONTENT_OVERRIDES: Record<string, ProductContentOverride> = {
  [GLOVE_SLUG]: {
    brand: "Genius Toy",
    manufacturerAge: "8+",
    ageGroup: "MIDDLE_SCHOOL_9_12",
  },
  [ROCKET_SLUG]: {
    brand: "TopBright",
    manufacturerAge: "6+",
    ageGroup: "ELEMENTARY_6_8",
  },
  [CRISTALE_4M_SLUG]: {
    description: CRISTALE_4M_FACTUAL_DESCRIPTION,
    brand: "4M",
    manufacturerAge: "10+",
  },
};

export function getProductContentOverride(
  slug: string
): ProductContentOverride | null {
  return PRODUCT_CONTENT_OVERRIDES[slug] ?? null;
}

/**
 * Keeps verified catalog corrections in the storefront even if an older
 * supplier-feed value is still cached while the data migration is deploying.
 */
export function applyProductContentOverride(product: Product): Product {
  const override = getProductContentOverride(product.slug);
  if (!override) return product;

  const metadata =
    product.metadata && typeof product.metadata === "object"
      ? product.metadata
      : {};

  return {
    ...product,
    description: override.description ?? product.description,
    ageGroup: override.ageGroup ?? product.ageGroup,
    ageRange: override.manufacturerAge,
    attributes: {
      ...(product.attributes ?? {}),
      brand: override.brand,
      originalAgeText: override.manufacturerAge,
      manufacturerRecommendedAge: override.manufacturerAge,
    },
    metadata: {
      ...metadata,
      ...(product.slug === CRISTALE_4M_SLUG
        ? {
            metaDescription:
              "Set Cristale Roșu 4M pentru creșterea unui cristal acasă. Vârsta recomandată de producător: 10+.",
            metaDescriptionRo:
              "Set Cristale Roșu 4M pentru creșterea unui cristal acasă. Vârsta recomandată de producător: 10+.",
          }
        : {}),
    },
  };
}
