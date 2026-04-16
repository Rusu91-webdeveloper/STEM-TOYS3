import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/features/products/components/ProductCard";

const mockHandleFavorite = jest.fn();

jest.mock("@/features/cart/hooks/useShoppingCart", () => ({
  useShoppingCart: () => ({
    addItem: jest.fn(),
  }),
}));

jest.mock("@/features/products/hooks/useProductActions", () => ({
  useProductActions: () => ({
    isFavorited: false,
    isFavoriteLoading: false,
    handleFavorite: mockHandleFavorite,
    handleShare: jest.fn(),
    isAddingToCart: false,
    justAddedToCart: false,
    handleQuickAddToCart: jest.fn(),
  }),
}));

jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({
    formatPrice: (price: number) => `${price} RON`,
  }),
}));

jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) =>
      fallback !== undefined && fallback !== "" ? fallback : _key,
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
  beforeEach(() => {
    mockHandleFavorite.mockClear();
  });

  it("renders image container with fixed height in list layout", () => {
    const { container } = render(
      <ProductCard product={product as any} layout="list" />
    );
    const imageWrapper = container.querySelector(
      "div.relative.w-full"
    ) as HTMLElement;
    expect(imageWrapper).toBeTruthy();
  });

  it("invokes favorite handler when the heart control is activated (grid)", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product as any} layout="grid" />);

    await user.click(
      screen.getByRole("button", { name: /adaugă la favorite/i })
    );
    expect(mockHandleFavorite).toHaveBeenCalled();
  });

  it("disables add to cart when the product stock is zero", () => {
    render(
      <ProductCard
        product={{ ...product, stockQuantity: 0 } as any}
        layout="list"
      />
    );

    expect(
      screen.getByRole("button", { name: /stoc epuizat/i })
    ).toBeDisabled();
  });
});
