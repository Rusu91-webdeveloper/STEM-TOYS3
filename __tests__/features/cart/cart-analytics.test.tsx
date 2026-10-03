import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CartProvider, useCart } from "@/features/cart/context/CartContext";
import { trackAddToCart } from "@/lib/analytics/ga4";
import { trackMetaAddToCart } from "@/lib/analytics/meta-events";

jest.mock("@/lib/analytics/ga4", () => ({ trackAddToCart: jest.fn() }));
jest.mock("@/lib/analytics/meta-events", () => ({
  trackMetaAddToCart: jest.fn(),
}));
jest.mock("@/features/cart/lib/cartApi", () => ({
  fetchCart: jest.fn().mockResolvedValue([]),
  saveCart: jest.fn().mockResolvedValue(true),
}));

function CartHarness() {
  const { items, addToCart } = useCart();
  const item = { productId: "kit", name: "Kit", price: 50, quantity: 1 };
  return (
    <>
      <p data-testid="quantity">{items[0]?.quantity ?? 0}</p>
      <button onClick={() => addToCart({ ...item, stockQuantity: 2 }, 3)}>
        add three
      </button>
      <button
        onClick={() =>
          addToCart({ ...item, productId: "empty", stockQuantity: 0 })
        }
      >
        out of stock
      </button>
    </>
  );
}

it("tracks only the quantity actually added and ignores rejected additions", async () => {
  localStorage.clear();
  sessionStorage.clear();
  const user = userEvent.setup();
  const view = render(
    <CartProvider>
      <CartHarness />
    </CartProvider>
  );
  await waitFor(() =>
    expect(screen.getByTestId("quantity")).toHaveTextContent("0")
  );
  await user.click(screen.getByRole("button", { name: "out of stock" }));
  expect(trackAddToCart).not.toHaveBeenCalled();
  expect(trackMetaAddToCart).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "add three" }));
  expect(screen.getByTestId("quantity")).toHaveTextContent("2");
  expect(trackAddToCart).toHaveBeenCalledWith(
    expect.objectContaining({ item_id: "kit", quantity: 2, price: 50 })
  );
  await user.click(screen.getByRole("button", { name: "add three" }));
  expect(trackAddToCart).toHaveBeenCalledTimes(1);
  expect(trackMetaAddToCart).toHaveBeenCalledTimes(1);
  expect(trackMetaAddToCart).toHaveBeenCalledWith({
    item_id: "kit",
    item_name: "Kit",
    quantity: 2,
    price: 50,
  });
  view.unmount();
});
