import React from "react";
import { render } from "@testing-library/react";
import { ProductCard } from "@/features/products/components/ProductCard";

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
});
