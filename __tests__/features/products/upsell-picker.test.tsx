import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProductUpsellPicker from "@/features/products/components/ProductUpsellPicker";
import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";

jest.mock("@/features/cart/hooks/useShoppingCart", () => ({
  useShoppingCart: jest.fn(),
}));
jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
const addItem = jest.fn();
const products = Array.from({ length: 4 }, (_, i) => ({
  id: `p${i}`,
  name: `Accessory ${i}`,
  slug: `accessory-${i}`,
  price: 99,
  images: ["https://example.com/image.jpg"],
  stockQuantity: 1,
}));
beforeEach(() => {
  jest.clearAllMocks();
  (useShoppingCart as jest.Mock).mockReturnValue({ items: [], addItem });
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ p0: 1 }) });
});
it("adds an optional accessory after checking live stock", async () => {
  render(<ProductUpsellPicker products={products} />);
  expect(addItem).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Adaugă Accessory 0 în coș" })
  );
  await waitFor(() =>
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "p0",
        stockQuantity: 1,
        quantity: 1,
      }),
      1
    )
  );
  expect(screen.getByRole("status")).toHaveTextContent("a fost adăugat");
});
it("does not add a product that has sold out", async () => {
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ p0: 0 }),
  });
  render(<ProductUpsellPicker products={products} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Adaugă Accessory 0 în coș" })
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "nu mai este disponibil"
    )
  );
  expect(addItem).not.toHaveBeenCalled();
});
it("shows three options first and expands the rest", () => {
  render(<ProductUpsellPicker products={products} />);
  expect(screen.queryByText("Accessory 3")).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Vezi toate cele 4 opțiuni" })
  );
  expect(screen.getByText("Accessory 3")).toBeInTheDocument();
});
it("marks existing cart items and prevents accidental duplicates", () => {
  (useShoppingCart as jest.Mock).mockReturnValue({
    items: [{ productId: "p0" }],
    addItem,
  });
  render(<ProductUpsellPicker products={products} />);
  expect(
    screen.getByRole("button", { name: "Accessory 0 este în coș" })
  ).toBeDisabled();
});
