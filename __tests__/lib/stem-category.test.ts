jest.mock("@/lib/cache", () => ({
  getCached: (_key: string, fetcher: () => Promise<unknown>) => fetcher(),
}));

import {
  CANONICAL_CATEGORY_SLUGS,
  CATEGORY_LABELS_RO,
  type CategoryListingProduct,
  canonicalizeCategorySlug,
  categoryLandingSlug,
  countListedProductsByCategory,
  isListedInCategory,
  resolveProductCategorySlug,
} from "@/lib/products/stem-category";
import { getCategoryName } from "@/lib/services/categories-service";
import {
  getCategoryPageHref,
  isRemovedCategoryPageSlug,
} from "@/lib/utils/category-page-links";

function product(
  overrides: Partial<CategoryListingProduct> &
    Pick<CategoryListingProduct, "name">
): CategoryListingProduct {
  return {
    slug: "produs",
    stockQuantity: 8,
    stemDiscipline: null,
    category: null,
    isBook: false,
    metadata: {},
    attributes: {},
    ...overrides,
  };
}

describe("STEM category matching", () => {
  it("maps stemDiscipline case and the MATH alias onto canonical slugs", () => {
    expect(
      resolveProductCategorySlug(
        product({ name: "Kit", stemDiscipline: "SCIENCE" })
      )
    ).toBe("science");
    expect(
      resolveProductCategorySlug(
        product({ name: "Kit", stemDiscipline: "science" })
      )
    ).toBe("science");
    expect(
      resolveProductCategorySlug(
        product({
          name: "Zig & Go",
          stemDiscipline: "MATH",
          category: { slug: "outdoor-nature", name: "Outdoor & Nature" },
        })
      )
    ).toBe("mathematics");
  });

  it("uses category slug and Romanian names when stemDiscipline is empty or GENERAL", () => {
    expect(
      resolveProductCategorySlug(
        product({
          name: "Plus-Plus",
          stemDiscipline: null,
          category: { slug: "construction-sets", name: "Construction Sets" },
        })
      )
    ).toBe("engineering");
    expect(
      resolveProductCategorySlug(
        product({
          name: "Logiblocs",
          stemDiscipline: "GENERAL",
          category: { slug: "electronics", name: "Electronics" },
        })
      )
    ).toBe("technology");
    expect(
      resolveProductCategorySlug(
        product({
          name: "Logică",
          stemDiscipline: null,
          category: { slug: "logic-games", name: "Logic Games" },
        })
      )
    ).toBe("mathematics");
    expect(canonicalizeCategorySlug("Știință")).toBe("science");
    expect(
      resolveProductCategorySlug(
        product({
          name: "Experimente",
          stemDiscipline: null,
          category: { slug: "alt-slug", name: "Science & Experiments" },
        })
      )
    ).toBe("science");
  });

  it("does not invent a STEM category for unmapped GENERAL products", () => {
    const unmapped = product({
      name: "Accesoriu generic",
      stemDiscipline: "GENERAL",
      category: { slug: "accesorii", name: "Accesorii" },
    });

    expect(resolveProductCategorySlug(unmapped)).toBeNull();
    expect(isListedInCategory(unmapped, "engineering")).toBe(false);
    expect(categoryLandingSlug("accesorii")).toBeNull();
    expect(categoryLandingSlug("nu-exista")).toBeNull();
  });

  it("applies the same browse visibility rules as /products", () => {
    const hiddenAddon = product({
      name: "Extensie vizibilă",
      stemDiscipline: "ENGINEERING",
      stockQuantity: 6,
      metadata: { merchandising: { browseHidden: true } },
    });
    const lowStock = product({
      name: "Stoc mic",
      stemDiscipline: "TECHNOLOGY",
      stockQuantity: 1,
      attributes: {},
    });
    const capacityStock = product({
      name: "Disponibil la furnizor",
      stemDiscipline: "TECHNOLOGY",
      stockQuantity: 1,
      attributes: { inventoryMode: "supplier-availability" },
    });
    const renamedJunk = product({
      name: "Air Toobz Set de tuburi",
      stemDiscipline: "ENGINEERING",
      stockQuantity: 5,
      attributes: { inventoryMode: "supplier-availability" },
    });
    const outOfStock = product({
      name: "T-Rex",
      stemDiscipline: "ENGINEERING",
      stockQuantity: 0,
      attributes: { inventoryMode: "supplier-availability" },
    });

    expect(isListedInCategory(hiddenAddon, "engineering")).toBe(false);
    expect(isListedInCategory(lowStock, "technology")).toBe(false);
    expect(isListedInCategory(capacityStock, "technology")).toBe(true);
    expect(isListedInCategory(renamedJunk, "engineering")).toBe(false);
    expect(isListedInCategory(outOfStock, "engineering")).toBe(false);
  });

  it("counts a live-shaped catalog, including Matematică and slug-only rows", () => {
    const inStock = (
      stem: string | null,
      category?: { slug: string; name: string }
    ): CategoryListingProduct =>
      product({
        name: "Produs STEM",
        stemDiscipline: stem,
        stockQuantity: 8,
        category,
      });

    const products: CategoryListingProduct[] = [
      ...Array.from({ length: 21 }, () => inStock("SCIENCE")),
      ...Array.from({ length: 10 }, () => inStock("TECHNOLOGY")),
      ...Array.from({ length: 33 }, () => inStock("ENGINEERING")),
      ...Array.from({ length: 15 }, () => inStock("MATHEMATICS")),
      inStock("MATH", { slug: "outdoor-nature", name: "Outdoor & Nature" }),
      ...Array.from({ length: 10 }, () =>
        inStock(null, { slug: "construction-sets", name: "Construction Sets" })
      ),
      ...Array.from({ length: 4 }, () =>
        inStock(null, { slug: "magnetic-building", name: "Magnetic Building" })
      ),
      ...Array.from({ length: 3 }, () =>
        product({
          name: "Logiblocs",
          stemDiscipline: null,
          stockQuantity: 1,
          attributes: { inventoryMode: "supplier-availability" },
          category: { slug: "electronics", name: "Electronics" },
        })
      ),
      product({
        name: "Air Toobz Set de tuburi",
        stemDiscipline: "ENGINEERING",
        stockQuantity: 5,
        attributes: { inventoryMode: "supplier-availability" },
      }),
      product({
        name: "Kit constructie robot - T-Rex",
        stemDiscipline: "ENGINEERING",
        stockQuantity: 0,
        attributes: { inventoryMode: "supplier-availability" },
      }),
      product({
        name: "Carte STEM",
        isBook: true,
        stockQuantity: 999,
      }),
    ];

    expect(countListedProductsByCategory(products)).toEqual({
      science: 21,
      technology: 13,
      engineering: 47,
      mathematics: 16,
      "educational-books": 1,
    });
  });
});

describe("Matematică presence", () => {
  it("is a public landing category with a Romanian label and a working href", () => {
    expect(CANONICAL_CATEGORY_SLUGS).toContain("mathematics");
    expect(CATEGORY_LABELS_RO.mathematics).toBe("Matematică");
    expect(getCategoryName("mathematics", "ro")).toBe("Matematică");
    expect(getCategoryName("math", "ro")).toBe("Matematică");
    expect(categoryLandingSlug("mathematics")).toBe("mathematics");
    expect(categoryLandingSlug("math")).toBe("mathematics");
    expect(getCategoryPageHref("mathematics")).toBe("/categories/mathematics");
    expect(getCategoryPageHref("math")).toBe("/categories/mathematics");
    expect(getCategoryPageHref("logic-games")).toBe("/categories/mathematics");
    expect(isRemovedCategoryPageSlug("mathematics")).toBe(false);
  });
});
