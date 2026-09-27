import { filterCatalogForCategory } from "@/lib/products/category-query";

const science = {
  slug: "microscop",
  name: "Microscop",
  price: 80,
  stockQuantity: 5,
  stemDiscipline: "SCIENCE",
  isBook: false,
  images: ["a.jpg"],
  createdAt: "2026-01-02",
};

const hiddenAddon = {
  slug: "air-toobz",
  name: "Air Toobz extra",
  price: 20,
  stockQuantity: 9,
  stemDiscipline: "SCIENCE",
  metadata: { merchandising: { browseHidden: true }, upsellFor: "parent" },
  tags: ["add-on"],
  createdAt: "2026-01-03",
};

const book = {
  slug: "carte-stem",
  name: "Carte STEM",
  price: 30,
  stockQuantity: 999,
  isBook: true,
  category: { slug: "educational-books", name: "Cărți" },
  createdAt: "2026-01-01",
};

describe("filterCatalogForCategory", () => {
  const catalog = [science, hiddenAddon, book];

  it("returns only listed science products and drops hidden add-ons", () => {
    const result = filterCatalogForCategory(catalog, { category: "science" });
    expect(result.map(product => product.slug)).toEqual(["microscop"]);
  });

  it("returns books for educational-books instead of the whole catalog", () => {
    const result = filterCatalogForCategory(catalog, {
      category: "educational-books",
    });
    expect(result.map(product => product.slug)).toEqual(["carte-stem"]);
  });

  it("returns nothing for an unknown category", () => {
    expect(
      filterCatalogForCategory(catalog, { category: "not-a-real-category" })
    ).toEqual([]);
  });
});
