import { render, screen } from "@testing-library/react";
import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import type { Product } from "@/types/product";

jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({ formatPrice: (price: number) => `${price} lei` }),
}));

it("does not present a broad catalog age bucket as a manufacturer recommendation", () => {
  const product = {
    id: "crystal",
    slug: "crystal",
    name: "Crystal kit",
    price: 100,
    images: ["/placeholder-product.png"],
    stockQuantity: 1,
    ageGroup: "PRESCHOOL_3_5",
  } as Product;
  const { rerender } = render(<FeaturedProductsGrid products={[product]} />);
  expect(screen.queryByText("3–5 ani")).not.toBeInTheDocument();
  rerender(
    <FeaturedProductsGrid products={[{ ...product, ageRange: "10+" }]} />
  );
  expect(screen.getByText("10+")).toBeInTheDocument();
});
