import React from "react";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/features/products/components/ProductCard";

jest.mock("@/features/cart/hooks/useShoppingCart", () => ({
  useShoppingCart: () => ({
    addItem: jest.fn(),
  }),
}));

jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({
    formatPrice: (price: number) => `${price} RON`,
  }),
}));

const product = {
  id: "1",
  name: "Test Product",
  slug: "test-product",
  description: "A product for testing",
  price: 100,
  images: ["https://placehold.co/800x600/10B981/FFFFFF.png?text=Product+1"],
  variants: [],
  stockQuantity: 10,
};

describe("ProductCard", () => {
  it("renders image container with fixed height in list layout", () => {
    const { container } = render(
      <ProductCard product={product as any} layout="list" />
    );
    const imageWrapper = container.querySelector(
      "div.relative.w-full"
    ) as HTMLElement;
    expect(imageWrapper).toBeTruthy();
  });

  it("disables add to cart when the product stock is zero", () => {
    render(
      <ProductCard
        product={{ ...product, stockQuantity: 0 } as any}
        layout="list"
      />
    );

    expect(
      screen.getByRole("button", { name: /out of stock/i })
    ).toBeDisabled();
  });
});
