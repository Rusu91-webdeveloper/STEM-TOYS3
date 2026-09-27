import {
  buildProductsListingPath,
  listingTotalPages,
  parseProductsPage,
  PRODUCTS_PAGE_SIZE,
} from "@/lib/utils/products-listing-url";

describe("products listing URL", () => {
  it("parses a positive page and ignores junk", () => {
    expect(parseProductsPage("2")).toBe(2);
    expect(parseProductsPage(["3", "9"])).toBe(3);
    expect(parseProductsPage("0")).toBe(1);
    expect(parseProductsPage("nope")).toBe(1);
    expect(parseProductsPage(undefined)).toBe(1);
  });

  it("keeps category filters and omits page 1", () => {
    expect(
      buildProductsListingPath({ category: "science", page: "4" }, 1)
    ).toBe("/products?category=science");
    expect(
      buildProductsListingPath({ category: "science" }, 2)
    ).toBe("/products?category=science&page=2");
  });

  it("counts pages with the storefront page size", () => {
    expect(PRODUCTS_PAGE_SIZE).toBe(12);
    expect(listingTotalPages(21)).toBe(2);
    expect(listingTotalPages(0)).toBe(1);
  });
});
