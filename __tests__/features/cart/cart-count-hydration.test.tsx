import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { hydrateRoot } from "react-dom/client";

import { CartButton } from "@/features/cart/components/CartButton";
import { CartProvider } from "@/features/cart/context/CartContext";
import { saveCartToStorage } from "@/features/cart/lib/cartStorage";

jest.mock("@/features/cart/components/MiniCart", () => ({
  MiniCart: () => null,
}));

jest.mock("@/features/cart/lib/cartApi", () => ({
  fetchCart: jest.fn(() => Promise.resolve([])),
  saveCart: jest.fn(() => Promise.resolve(true)),
  clearCartCache: jest.fn(),
}));

const storedItem = {
  id: "product-1",
  productId: "product-1",
  name: "Kit STEM",
  price: 89,
  quantity: 2,
};

function CartHeader() {
  return (
    <CartProvider>
      <CartButton variant="header" />
    </CartProvider>
  );
}

describe("cart count hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    saveCartToStorage([storedItem]);
  });

  it("keeps the server markup and the first client render free of the stored count", async () => {
    const { renderToString } = await import("react-dom/server.node");
    const html = renderToString(<CartHeader />);
    expect(html).not.toContain(">2<");
    expect(html).toContain("Deschide coșul");
    expect(html).not.toContain("Open cart");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const errors: string[] = [];
    const spy = jest.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args.map(value => String(value)).join(" "));
    });

    act(() => {
      hydrateRoot(container, <CartHeader />);
    });

    const hydrationErrors = errors.filter(message =>
      /hydration|did not match|Minified React error #418/i.test(message)
    );
    expect(hydrationErrors).toEqual([]);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Deschide coșul, 2 produse/ })).toBeInTheDocument();

    spy.mockRestore();
    container.remove();
  });

  it("shows the stored count after the header mounts", async () => {
    render(<CartHeader />);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Deschide coșul, 2 produse/ })
    ).toBeInTheDocument();
  });
});
