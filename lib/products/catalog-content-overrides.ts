import type { Product } from "@/types/product";

export const CRISTALE_4M_SLUG =
  "set-cristale-rosu-4m-experiment-stem-viral-4M-03929";

export const CRISTALE_4M_FACTUAL_DESCRIPTION =
  "Set educativ 4M pentru creșterea unui cristal roșu acasă. Kitul include materialul pentru cristalizare, recipientul de creștere, baza de expunere și instrucțiunile experimentului. Procesul de cristalizare poate fi urmărit pe parcursul mai multor zile. Vârsta recomandată de producător este 10+. Respectă pașii și indicațiile de siguranță din instrucțiunile incluse în cutie.";

export const HOVER_RACER_SLUG =
  "kit-constructie-robot---hover-racer-kidz-robotix-4M-03366";

export const HOVER_RACER_TITLE =
  "Kit construcție robot – Hover Racer, Kidz Robotix";
export const HOVER_RACER_META_DESCRIPTION =
  "Hover Racer Kidz Robotix 4M, 8+: construiește un aeroglisor și explorează perna de aer, fără ecran. Plată ramburs (COD). Livrare 1–4 zile lucrătoare.";

type ProductContentOverride = {
  name?: string;
  metaTitle?: string;
  metaDescription: string;
  description: string;
  brand: string;
  manufacturerAge: string;
};

const PRODUCT_CONTENT_OVERRIDES: Record<string, ProductContentOverride> = {
  [HOVER_RACER_SLUG]: {
    name: HOVER_RACER_TITLE,
    metaTitle: "Hover Racer Kidz Robotix 4M, 8+ | TechTots",
    metaDescription: HOVER_RACER_META_DESCRIPTION,
    description:
      "Construiește un aeroglisor și descoperă cum se deplasează susținut de o pernă de aer. Kitul 4M Kidz Robotix include componentele, accesoriile și instrucțiunile de asamblare. O activitate practică, fără ecran, pentru copii de 8 ani și peste. Necesită 2 baterii AAA, neincluse. Respectă instrucțiunile și indicațiile de siguranță din cutie.",
    brand: "4M",
    manufacturerAge: "8+",
  },
  [CRISTALE_4M_SLUG]: {
    metaDescription:
      "Set Cristale Roșu 4M pentru creșterea unui cristal acasă. Vârsta recomandată de producător: 10+.",
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
    ...(override.name ? { name: override.name } : {}),
    description: override.description,
    ageRange: override.manufacturerAge,
    attributes: {
      ...(product.attributes ?? {}),
      brand: override.brand,
      originalAgeText: override.manufacturerAge,
      manufacturerRecommendedAge: override.manufacturerAge,
    },
    metadata: {
      ...metadata,
      ...(override.metaTitle ? { metaTitle: override.metaTitle } : {}),
      metaDescription: override.metaDescription,
      metaDescriptionRo: override.metaDescription,
    },
  };
}
