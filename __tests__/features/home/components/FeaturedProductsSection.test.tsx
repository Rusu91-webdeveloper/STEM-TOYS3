/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { FeaturedProductsSection } from "@/features/home/components/FeaturedProductsSection";

// Mock Next.js Image component
// eslint-disable-next-line @next/next/no-img-element
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  default: (props: any) => <img alt={props.alt || ""} {...props} />,
}));

// Mock Next.js Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock the skeleton component
jest.mock("@/features/home/components/FeaturedProductsSkeleton", () => ({
  FeaturedProductsSkeleton: ({ count }: { count: number }) => (
    <div data-testid="featured-products-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} data-testid={`skeleton-${index}`}>
          Loading...
        </div>
      ))}
    </div>
  ),
}));

describe("FeaturedProductsSection", () => {
  const mockT = (key: string, defaultValue?: string) => defaultValue ?? key;
  const mockFormatPrice = (price: number) => `$${price.toFixed(2)}`;

  const mockProducts = [
    {
      id: "1",
      name: "Test Product 1",
      slug: "test-product-1",
      description: "A great test product",
      price: 29.99,
      images: ["/test-image-1.jpg"],
    },
    {
      id: "2", 
      name: "Test Product 2",
      slug: "test-product-2",
      description: "Another test product",
      price: 39.99,
      images: ["/test-image-2.jpg"],
    },
  ];

  it("renders section with proper heading structure", () => {
    render(
      <FeaturedProductsSection
        products={mockProducts}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("featuredProducts");

    const badge = screen.getByText("Recommended For You");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-purple-100", "text-purple-700");
  });

  it("renders products when provided", () => {
    render(
      <FeaturedProductsSection
        products={mockProducts}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    expect(screen.getByText("A great test product")).toBeInTheDocument();
    expect(screen.getByText("Another test product")).toBeInTheDocument();
  });

  it("displays formatted prices correctly", () => {
    render(
      <FeaturedProductsSection
        products={mockProducts}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(screen.getByText("$39.99")).toBeInTheDocument();
  });

  it("renders product links with correct hrefs", () => {
    render(
      <FeaturedProductsSection
        products={mockProducts}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    const productLinks = screen.getAllByRole("link");
    expect(productLinks[0]).toHaveAttribute("href", "/products/test-product-1");
    expect(productLinks[1]).toHaveAttribute("href", "/products/test-product-2");
  });

  it("shows loading skeletons when isLoading is true", () => {
    render(
      <FeaturedProductsSection
        products={[]}
        formatPrice={mockFormatPrice}
        t={mockT}
        isLoading={true}
      />
    );

    const skeleton = screen.getByTestId("featured-products-skeleton");
    expect(skeleton).toBeInTheDocument();

    // Should render 4 skeleton items
    expect(screen.getAllByTestId(/skeleton-\d+/)).toHaveLength(4);
  });

  it("shows empty state when no products and not loading", () => {
    render(
      <FeaturedProductsSection
        products={[]}
        formatPrice={mockFormatPrice}
        t={mockT}
        isLoading={false}
      />
    );

    expect(screen.getByText("No featured products found.")).toBeInTheDocument();
  });

  it("renders product images with correct attributes", () => {
    render(
      <FeaturedProductsSection
        products={mockProducts}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    const productImages = screen.getAllByRole("img");
    expect(productImages[0]).toHaveAttribute("src", "/test-image-1.jpg");
    expect(productImages[0]).toHaveAttribute("alt", "Test Product 1");
    expect(productImages[1]).toHaveAttribute("src", "/test-image-2.jpg");
    expect(productImages[1]).toHaveAttribute("alt", "Test Product 2");
  });

  it("handles products without images gracefully", () => {
    const productsWithoutImages = [
      {
        id: "3",
        name: "Product Without Image",
        slug: "product-without-image",
        description: "No image product",
        price: 19.99,
        images: [],
      },
    ];

    render(
      <FeaturedProductsSection
        products={productsWithoutImages}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    const productImage = screen.getByRole("img");
    expect(productImage).toHaveAttribute("src", "/images/placeholder.png");
  });

  it("applies responsive grid classes", () => {
    render(
      <FeaturedProductsSection
        products={mockProducts}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    const gridContainer = document.querySelector(".grid");
    expect(gridContainer).toHaveClass(
      "grid-cols-1",
      "xs:grid-cols-2", 
      "lg:grid-cols-4"
    );
  });

  it("includes proper accessibility attributes", () => {
    render(
      <FeaturedProductsSection
        products={mockProducts}
        formatPrice={mockFormatPrice}
        t={mockT}
      />
    );

    const productLinks = screen.getAllByRole("link");
    expect(productLinks[0]).toHaveAttribute("aria-label", "View details for Test Product 1");
    expect(productLinks[1]).toHaveAttribute("aria-label", "View details for Test Product 2");
  });
});
