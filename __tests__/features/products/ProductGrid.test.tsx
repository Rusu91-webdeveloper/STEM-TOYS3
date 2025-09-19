import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// minimal i18n mock used by ProductGrid
jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { ProductGrid } from "@/features/products/components/ProductGrid";

const makeProduct = (id: string, price: number) => ({
  id,
  name: `Product ${id}`,
  price,
  images: ["/p.jpg"],
  slug: `p-${id}`,
});

describe("ProductGrid", () => {
  it("renders products and toggles layout", () => {
    render(
      <ProductGrid products={[makeProduct("1", 10), makeProduct("2", 20)]} />
    );

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();

    // toggle to list view
    fireEvent.click(screen.getByLabelText("listView"));
    // toggle back to grid
    fireEvent.click(screen.getByLabelText("gridView"));
  });
});
