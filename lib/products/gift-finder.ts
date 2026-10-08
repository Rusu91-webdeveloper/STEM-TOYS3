import type { Product } from "@/types/product";

import { isVisibleOnProductsListing } from "./catalog-access";
import { isCatalogAddOn, readFeaturedOrder } from "./merchandising";
import { lowestExplicitAge } from "./romanian-catalog";
import { normalizeProductSearch } from "./search";

export const GIFT_INTERESTS = [
  { value: "any", label: "Orice îl poate surprinde" },
  { value: "construction", label: "Construcții și mecanisme" },
  { value: "science", label: "Experimente și descoperiri" },
  { value: "logic", label: "Logică și puzzle-uri" },
  { value: "robotics", label: "Robotică și electronică" },
  { value: "nature", label: "Natură și explorare" },
] as const;
export type GiftInterest = (typeof GIFT_INTERESTS)[number]["value"];

export interface GiftProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  age: string;
  minimumAge: number;
  summary: string;
  preparation: string;
  interests: GiftInterest[];
  editorialRank: number;
}

/** Only currently browseable, complete gifts with reviewed age guidance. */
export function toGiftProduct(product: Product): GiftProduct | null {
  const guide = product.buyingGuide;
  const minimumAge = guide ? lowestExplicitAge(guide.age) : null;
  if (
    !isVisibleOnProductsListing(product) ||
    isCatalogAddOn(product) ||
    !guide ||
    minimumAge === null ||
    !Number.isFinite(product.price) ||
    product.price <= 0 ||
    !product.images[0]
  )
    return null;
  // Extensions must never be recommended as standalone gifts.
  if (
    /necesita\s+(?:un\s+)?set(?:ul)?\s+(?:de\s+)?baza|vandut\s+separat|extensie|extindere|reumplere/.test(
      normalizeProductSearch(`${product.name} ${guide.preparation}`)
    )
  )
    return null;

  const text = normalizeProductSearch(
    `${product.name} ${product.category?.slug ?? ""} ${guide.summary}`
  );
  const interests: GiftInterest[] = [];
  if (/construct|mecani|hidraul|pneumat|magnet|inginer/.test(text))
    interests.push("construction");
  if (
    product.stemDiscipline === "SCIENCE" ||
    /experiment|stiint|cristal|chimie|fizic/.test(text)
  )
    interests.push("science");
  if (
    product.stemDiscipline === "MATHEMATICS" ||
    /logic|puzzle|cubologic|matemat/.test(text)
  )
    interests.push("logic");
  if (/robot|electronic|circuit|program|codare/.test(text))
    interests.push("robotics");
  if (
    /natura|explor|binoclu|telescop|microscop|meteor|insect|apa|vant|eolian/.test(
      text
    )
  )
    interests.push("nature");
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0],
    price: product.price,
    age: guide.age,
    minimumAge,
    summary: guide.summary,
    preparation: guide.preparation,
    interests,
    editorialRank: readFeaturedOrder(product) ?? 100,
  };
}

export function selectGifts(
  products: GiftProduct[],
  preferences: { age: number; interest: GiftInterest; budget: number }
): GiftProduct[] {
  const { age, interest, budget } = preferences;
  if (
    !Number.isInteger(age) ||
    age < 3 ||
    age > 18 ||
    !Number.isFinite(budget) ||
    budget <= 0 ||
    !GIFT_INTERESTS.some(option => option.value === interest)
  )
    return [];
  return products
    .filter(
      product =>
        product.minimumAge <= age &&
        product.price <= budget &&
        (interest === "any" || product.interests.includes(interest))
    )
    .sort(
      (a, b) =>
        // A nearby minimum is a relevance preference, never a safety override.
        Math.abs(age - a.minimumAge) - Math.abs(age - b.minimumAge) ||
        a.editorialRank - b.editorialRank ||
        a.price - b.price ||
        a.id.localeCompare(b.id)
    )
    .slice(0, 3);
}
