import { buildProductsUrl } from "@/lib/utils/product-filters-url";

describe("buildProductsUrl", () => {
  it("builds base /products when no inputs", () => {
    expect(buildProductsUrl()).toBe("/products");
  });

  it("builds category param with normalization and de-duplication", () => {
    expect(
      buildProductsUrl({ category: ["Books", "educational-books", "books"] })
    ).toBe("/products?category=educational-books");
  });

  it("includes ageGroup param when provided", () => {
    expect(buildProductsUrl({ ageGroup: "PRESCHOOL_3_5" })).toBe(
      "/products?ageGroup=PRESCHOOL_3_5"
    );
  });

  it("includes specialCategories and price params correctly", () => {
    expect(
      buildProductsUrl({
        specialCategories: ["GIFT_IDEAS", "BEST_SELLERS"],
        minPrice: 10,
        maxPrice: 50,
        noPriceFilter: false,
      })
    ).toBe(
      "/products?specialCategories=GIFT_IDEAS,BEST_SELLERS&minPrice=10&maxPrice=50&noPriceFilter=false"
    );
  });
});
