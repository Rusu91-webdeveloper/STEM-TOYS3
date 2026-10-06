import { db } from "@/lib/db";
import { getCombinedProduct } from "@/lib/products/product-read";
import {
  resolveActiveBookId,
  resolveProductId,
} from "@/lib/products/public-catalog";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: (fn: unknown) => fn,
}));
jest.mock("@/lib/db", () => ({
  db: { product: { findFirst: jest.fn() }, book: { findFirst: jest.fn() } },
}));
jest.mock("@/lib/products/public-catalog", () => ({
  resolveProductId: jest.fn(),
  resolveActiveBookId: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (resolveProductId as jest.Mock).mockResolvedValue("product-1");
  (resolveActiveBookId as jest.Mock).mockResolvedValue(null);
});

it("reads a visible product directly and preserves its commercial facts", async () => {
  const fetchSpy = jest.spyOn(global, "fetch");
  (db.product.findFirst as jest.Mock).mockResolvedValue({
    id: "product-1",
    name: "Produs",
    slug: "produs",
    description: "Descriere",
    price: 89.5,
    priceCurrency: "RON",
    stockQuantity: 0,
    reservedQuantity: 0,
    isActive: true,
    status: "APPROVED",
    attributes: {},
    images: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: false,
  });
  const product = await getCombinedProduct("produs");
  expect(product).toMatchObject({
    id: "product-1",
    price: 89.5,
    stockQuantity: 0,
    isBook: false,
  });
  expect(resolveProductId).toHaveBeenCalledWith("produs", "public");
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});

it("keeps missing and inactive products separate from database failures", async () => {
  (db.product.findFirst as jest.Mock).mockResolvedValue({
    id: "product-1",
    isActive: false,
    status: "APPROVED",
  });
  expect(await getCombinedProduct("unavailable-product")).toBeNull();
  (db.product.findFirst as jest.Mock).mockRejectedValue(
    new Error("database unavailable")
  );
  await expect(getCombinedProduct("produs")).rejects.toThrow(
    "database unavailable"
  );
});

it("preserves active book rendering through the same public reader", async () => {
  (resolveProductId as jest.Mock).mockResolvedValue(null);
  (resolveActiveBookId as jest.Mock).mockResolvedValue("book-1");
  (db.book.findFirst as jest.Mock).mockResolvedValue({
    id: "book-1",
    name: "Carte",
    slug: "carte",
    description: "Descriere",
    price: 49,
    isActive: true,
    languages: [{ name: "Română" }],
    author: "Autor",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  expect(await getCombinedProduct("carte")).toMatchObject({
    id: "book-1",
    isBook: true,
    attributes: { languages: ["Română"] },
  });
});
