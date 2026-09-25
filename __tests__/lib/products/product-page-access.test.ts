import { existsSync, readFileSync } from "fs";
import path from "path";

import { notFound, permanentRedirect } from "next/navigation";

import { getCombinedProduct } from "@/lib/api/products";
import { prisma } from "@/lib/prisma";
import { resolveProductPageDecision } from "@/lib/products/public-slug";

const PREVIOUSLY_BLOCKED_SLUG =
  "kit-stem-energia-eoliana-cu-turbina-si-masinuta-electrica-genius-toy-g_7087";

jest.mock("next/cache", () => ({
  unstable_noStore: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    const error = new Error("NEXT_NOT_FOUND");
    throw error;
  }),
  permanentRedirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: jest.fn() },
    book: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/api/products", () => ({
  getCombinedProduct: jest.fn(),
}));

jest.mock("@/features/products/components/ProductDetailServer", () => ({
  __esModule: true,
  default: function ProductDetailServer() {
    return null;
  },
}));

jest.mock("@/lib/utils/seo", () => ({
  generateProductMetadata: jest.fn(() => ({ title: "product" })),
}));

const mockedGetCombinedProduct = getCombinedProduct as jest.MockedFunction<
  typeof getCombinedProduct
>;
const mockedPrisma = prisma as unknown as {
  product: { findMany: jest.Mock };
  book: { findMany: jest.Mock };
};

describe("product page access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not keep the retired soft-404 slug blocklist", () => {
    const blocklistPath = path.join(process.cwd(), "lib/sitemap/blocklist.ts");
    expect(existsSync(blocklistPath)).toBe(false);

    const pageSource = readFileSync(
      path.join(process.cwd(), "app/products/[slug]/page.tsx"),
      "utf8"
    );
    expect(pageSource).not.toContain("SOFT_404_PRODUCT_SLUGS");
    expect(pageSource).toContain("dynamicParams = true");

    const sitemapSource = readFileSync(
      path.join(process.cwd(), "app/sitemap.ts"),
      "utf8"
    );
    expect(sitemapSource).not.toContain("SOFT_404_PRODUCT_SLUGS");
  });

  it("prebuilds a previously blocklisted active product and the slash slug", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([
      {
        slug: "kit-stem-energia-eoliana-cu-turbina-si-masinuta-electrica-genius-toy-G_7087",
      },
      { slug: "giroscop-navir-N_6010/CB" },
    ]);
    mockedPrisma.book.findMany.mockResolvedValue([{ slug: "active-book" }]);

    const { generateStaticParams } = await import("@/app/products/[slug]/page");
    await expect(generateStaticParams()).resolves.toEqual([
      { slug: PREVIOUSLY_BLOCKED_SLUG },
      { slug: "giroscop-navir-n_6010-cb" },
      { slug: "active-book" },
    ]);
  });

  it("renders an active product that used to be blocklisted", async () => {
    mockedGetCombinedProduct.mockResolvedValue({
      id: "product-1",
      name: "Kit STEM energie eoliana",
      slug: PREVIOUSLY_BLOCKED_SLUG,
      isActive: true,
      isBook: false,
    } as Awaited<ReturnType<typeof getCombinedProduct>>);

    const { default: ProductPage } = await import("@/app/products/[slug]/page");
    const result = await ProductPage({
      params: Promise.resolve({ slug: PREVIOUSLY_BLOCKED_SLUG }),
    });

    expect(result).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
    expect(mockedGetCombinedProduct).toHaveBeenCalledWith(
      PREVIOUSLY_BLOCKED_SLUG
    );
  });

  it("returns notFound for an unknown slug", async () => {
    mockedGetCombinedProduct.mockResolvedValue(null);

    const { default: ProductPage } = await import("@/app/products/[slug]/page");

    await expect(
      ProductPage({
        params: Promise.resolve({ slug: "this-product-does-not-exist" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("returns notFound for an inactive product", async () => {
    mockedGetCombinedProduct.mockResolvedValue({
      id: "product-2",
      name: "Hidden",
      slug: "hidden-product",
      isActive: false,
    } as Awaited<ReturnType<typeof getCombinedProduct>>);

    const { default: ProductPage } = await import("@/app/products/[slug]/page");

    await expect(
      ProductPage({
        params: Promise.resolve({ slug: "hidden-product" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("redirects the Navir gyroscope slash URL to the public slug", async () => {
    mockedGetCombinedProduct.mockResolvedValue({
      id: "gyro",
      name: "Giroscop Navir",
      slug: "giroscop-navir-n_6010-cb",
      isActive: true,
    } as Awaited<ReturnType<typeof getCombinedProduct>>);

    const { default: SlashProductSlugPage } = await import(
      "@/app/products/[slug]/[segment]/page"
    );

    await expect(
      SlashProductSlugPage({
        params: Promise.resolve({
          slug: "giroscop-navir-N_6010",
          segment: "CB",
        }),
      })
    ).rejects.toThrow("REDIRECT:/products/giroscop-navir-n_6010-cb");
    expect(permanentRedirect).toHaveBeenCalledWith(
      "/products/giroscop-navir-n_6010-cb"
    );
  });

  it("404s a two-segment path that is not a product", async () => {
    mockedGetCombinedProduct.mockResolvedValue(null);

    const { default: SlashProductSlugPage } = await import(
      "@/app/products/[slug]/[segment]/page"
    );

    await expect(
      SlashProductSlugPage({
        params: Promise.resolve({ slug: "not", segment: "a-product" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("resolveProductPageDecision", () => {
  it("renders active approved products and active books", () => {
    expect(
      resolveProductPageDecision({
        kind: "product",
        isActive: true,
        status: "APPROVED",
      })
    ).toBe("render");
    expect(resolveProductPageDecision({ kind: "book", isActive: true })).toBe(
      "render"
    );
  });

  it("404s unknown, inactive, and unapproved records", () => {
    expect(resolveProductPageDecision(null)).toBe("not-found");
    expect(
      resolveProductPageDecision({
        kind: "product",
        isActive: false,
        status: "APPROVED",
      })
    ).toBe("not-found");
    expect(
      resolveProductPageDecision({
        kind: "product",
        isActive: true,
        status: "IN_PENDING",
      })
    ).toBe("not-found");
    expect(resolveProductPageDecision({ kind: "book", isActive: false })).toBe(
      "not-found"
    );
  });
});
