import { getProducts } from "@/lib/api/products";
import manifest from "@/lib/products/catalog-images.json";

jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));
jest.mock("@/lib/utils/api-url", () => ({
  buildApiUrl: (path: string) => `https://catalog.test${path}`,
}));

afterEach(() => jest.restoreAllMocks());

it.each(["catalog", "array", "product"])(
  "formats old %s API responses before server rendering",
  async shape => {
    const [source, local] = Object.entries(manifest)[0];
    const product = {
      id: "rocket",
      name: "Racheta cu apa",
      images: [source],
      stockQuantity: 1,
      price: 168,
    };
    const payload =
      shape === "catalog"
        ? { products: [product], pagination: { total: 1 } }
        : shape === "array"
          ? [product]
          : product;
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    } as Response);
    expect(await getProducts()).toEqual([
      { ...product, name: "Rachetă cu apă", images: [local] },
    ]);
    expect(product.images).toEqual([source]);
    expect(product.name).toBe("Racheta cu apa");
  }
);
