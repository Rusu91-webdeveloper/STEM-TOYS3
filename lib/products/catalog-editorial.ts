import catalog from "./catalog-editorial.ro.json";
import { getProductBuyingGuide } from "./product-buying-guides";

export const reviewedCatalog = catalog;

const reviewedBySlug = new Map(
  catalog.products.map(product => [product.slug.toLowerCase(), product])
);

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!
  );
}

/** Editorial copy stays separate from supplier sync rows. Apply it after cache
 * reads, using both slug and identity so another product cannot inherit it. */
export function applyReviewedCatalogCopy<T>(product: T): T {
  if (!product || typeof product !== "object") return product;
  const record = product as Record<string, unknown>;
  if (typeof record.slug !== "string") return product;
  const copy = reviewedBySlug.get(record.slug.toLowerCase());
  if (!copy || (record.id && record.id !== copy.id)) return product;

  const section = (label: string, text: string) =>
    `<p><strong>${label}</strong> ${escapeHtml(text)}</p>`;
  const description = [
    `<p>${escapeHtml(copy.intro)}</p>`,
    section("Ce exersează copilul:", copy.benefit),
    section("Ce conține:", copy.contents),
    section("Vârstă recomandată:", copy.age),
    section("Detalii și pregătire:", copy.specifications),
    section("Utilizare și siguranță:", copy.warning),
  ].join("\n");
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? record.metadata
      : {};
  const attributes =
    record.attributes && typeof record.attributes === "object"
      ? record.attributes
      : {};
  const metaDescription = `${copy.intro} Vârstă recomandată: ${copy.age}.`;
  const authoredGuide = getProductBuyingGuide(copy.slug);
  const manualUrl = copy.sources.find(source =>
    /^https:\/\/[^\s]+\.pdf(?:\?[^\s]*)?$/i.test(source)
  );

  return {
    ...record,
    name: copy.name,
    description,
    ageRange: copy.age,
    buyingGuide: {
      brand: copy.brand,
      age: copy.age,
      summary: copy.intro,
      contents: copy.contents,
      preparation: authoredGuide?.preparation ?? copy.specifications,
      safety: copy.warning,
      activities: authoredGuide?.activities ?? [],
      ...(manualUrl ? { manualUrl } : {}),
    },
    attributes: {
      ...attributes,
      brand: copy.brand,
      age: copy.age,
      ageRange: copy.age,
      originalAgeText: copy.age,
      shortDescription: copy.intro,
    },
    metadata: {
      ...metadata,
      metaTitle: `${copy.name} | TechTots`,
      metaTitleRo: `${copy.name} | TechTots`,
      metaDescription: metaDescription.slice(0, 160),
      metaDescriptionRo: metaDescription.slice(0, 160),
    },
  } as T;
}
