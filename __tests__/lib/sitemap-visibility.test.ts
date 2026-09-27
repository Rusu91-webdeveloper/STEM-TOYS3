import {
  includeInProductSitemap,
  resolvePdpVisibility,
} from "@/lib/products/catalog-access";

const visible = {
  slug: "kit-vizibil",
  name: "Kit de știință",
  stockQuantity: 6,
  isActive: true,
  status: "APPROVED",
  images: ["a.jpg"],
};

describe("sitemap and PDP visibility", () => {
  it("keeps a normal approved product in the sitemap and indexable", () => {
    expect(includeInProductSitemap(visible)).toBe(true);
    expect(resolvePdpVisibility(visible)).toBe("public");
  });

  it("drops hidden, add-on, and inactive products from the sitemap", () => {
    expect(
      includeInProductSitemap({
        ...visible,
        name: "Air Toobz extra",
        metadata: { merchandising: { browseHidden: true }, upsellFor: "parent" },
        tags: ["add-on"],
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        name: "Fridge Rover",
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        name: "Kit păianjen",
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        isActive: false,
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        status: "DRAFT",
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        stockQuantity: 1,
      })
    ).toBe(false);
  });

  it("noindexes hidden add-ons and 404s quality-hidden products", () => {
    expect(
      resolvePdpVisibility({
        ...visible,
        name: "Air Toobz extra",
        metadata: { browseHidden: undefined, upsellFor: "rocket", merchandising: { browseHidden: true } },
        tags: ["upsell"],
        stockQuantity: 4,
      })
    ).toBe("noindex");

    expect(
      resolvePdpVisibility({
        ...visible,
        name: "Fridge Rover",
        metadata: { merchandising: { browseHidden: true } },
        stockQuantity: 8,
      })
    ).toBe("not-found");

    expect(
      resolvePdpVisibility({
        ...visible,
        isActive: false,
      })
    ).toBe("not-found");
  });
});
