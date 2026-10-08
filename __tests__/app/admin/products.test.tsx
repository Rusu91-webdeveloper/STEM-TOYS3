import { render, screen } from "@testing-library/react";

import AdminProductsPage from "@/app/admin/products/page";
import { db } from "@/lib/db";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/lib/db", () => ({
  db: {
    category: { findMany: jest.fn() },
    supplier: { findMany: jest.fn() },
    product: { findMany: jest.fn(), count: jest.fn() },
  },
}));
jest.mock("@/components/admin/ProductEnhancementModal", () => ({
  ProductEnhancementModal: () => null,
}));
jest.mock("@/app/admin/products/components/ProductDeleteButton", () => ({
  ProductDeleteButton: () => null,
}));
jest.mock("@/app/admin/products/components/ProductStatusActions", () => ({
  ProductStatusActions: () => null,
}));
jest.mock("@/app/admin/products/components/BulkUploadModal", () => ({
  BulkUploadModal: () => null,
}));
const products = [
  "PUBLISHED",
  "APPROVED",
  "IN_PENDING",
  "REJECTED",
  "DENIED",
].map((status, index) => ({
  id: `product-${index}`,
  slug: `product-${index}`,
  name: `Produs ${status}`,
  status,
  price: 12,
  priceCurrency: index === 0 ? "EUR" : "RON",
  description: "Descriere",
  category: null,
  stockQuantity: 3,
  isActive: index !== 0,
  images: [],
  createdAt: "2026-10-08",
  tags: [],
  _count: { orderItems: 4 },
}));

describe("admin catalog visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.category.findMany as jest.Mock).mockResolvedValue([]);
    (db.supplier.findMany as jest.Mock).mockResolvedValue([]);
    (db.product.findMany as jest.Mock).mockResolvedValue(products);
    (db.product.count as jest.Mock).mockResolvedValue(products.length);
  });
  it("displays every stored status, including published and inactive products, with original currencies and truthful order counts", async () => {
    render(await AdminProductsPage({ searchParams: Promise.resolve({}) }));
    for (const product of products)
      expect(screen.getByText(product.name)).toBeVisible();
    expect(screen.getByText("Publicate (1)")).toBeVisible();
    expect(screen.getByText("Inactiv")).toBeVisible();
    expect(screen.getByText(/12,00.*EUR/)).toBeVisible();
    expect(screen.getAllByText(/4 poziții în comenzi/)).toHaveLength(5);
    expect(screen.getByRole("textbox", { name: "Caută" })).toBeVisible();
  });
  it("does not query an invalid product status from legacy or manually supplied filters", async () => {
    await AdminProductsPage({
      searchParams: Promise.resolve({ status: "DRAFT" }),
    });
    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ status: "DRAFT" }),
      })
    );
  });
  it("propagates database failure to the admin error boundary instead of claiming an empty catalog", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    (db.product.findMany as jest.Mock).mockRejectedValue(
      new Error("Database unavailable")
    );
    await expect(
      AdminProductsPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("Database unavailable");
    log.mockRestore();
  });
});
