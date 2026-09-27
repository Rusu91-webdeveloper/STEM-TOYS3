import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { CartProvider, useCart } from "@/features/cart/context/CartContext";
import { clearCartCache } from "@/features/cart/lib/cartApi";

const kit = {
  id: "product-1",
  productId: "product-1",
  name: "STEM Kit",
  price: 49.99,
  quantity: 1,
};

function CartHarness() {
  const { items, addToCart, removeItem } = useCart();

  return (
    <div>
      <p data-testid="count">{items.length}</p>
      <button
        type="button"
        onClick={() =>
          addToCart({
            productId: kit.productId,
            name: kit.name,
            price: kit.price,
            quantity: 1,
          })
        }
      >
        add
      </button>
      <button type="button" onClick={() => removeItem(kit.productId)}>
        remove
      </button>
    </div>
  );
}

describe("empty cart persistence", () => {
  let staleServerCart = false;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearCartCache();
    staleServerCart = false;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (!url.includes("/api/cart")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }

      if ((init?.method ?? "GET").toUpperCase() === "GET") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: staleServerCart ? [kit] : [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
    }) as unknown as typeof fetch;
  });

  it("keeps the cart empty after the last item is removed and the page reloads", async () => {
    const user = userEvent.setup();
    const first = render(
      <CartProvider>
        <CartHarness />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });

    await user.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "remove" }));
    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
      const stored = JSON.parse(localStorage.getItem("nextcommerce_cart") ?? "{}");
      expect(stored.items).toEqual([]);
      expect(stored.explicitEmpty).toBe(true);
    });

    staleServerCart = true;
    first.unmount();

    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });

    await new Promise(resolve => setTimeout(resolve, 250));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
