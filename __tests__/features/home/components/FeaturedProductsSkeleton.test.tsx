/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { FeaturedProductsSkeleton } from "@/features/home/components/FeaturedProductsSkeleton";

// Mock the skeleton component from ui
jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className, variant, ...props }: any) => (
    <div
      data-testid="skeleton"
      data-variant={variant}
      className={className}
      {...props}
    />
  ),
}));

describe("FeaturedProductsSkeleton", () => {
  it("renders default number of skeleton cards", () => {
    render(<FeaturedProductsSkeleton />);

    const skeletonCards = screen.getAllByTestId("skeleton");
    // Default count is 4, each card has multiple skeleton elements
    expect(skeletonCards.length).toBeGreaterThan(4);
  });

  it("renders specified number of skeleton cards", () => {
    render(<FeaturedProductsSkeleton count={2} />);

    // Each card has multiple skeleton elements (image, title, description lines, price, button)
    // So we check for the container structure
    const gridContainer = document.querySelector(".grid");
    expect(gridContainer?.children).toHaveLength(2);
  });

  it("applies correct grid layout classes", () => {
    render(<FeaturedProductsSkeleton />);

    const gridContainer = document.querySelector(".grid");
    expect(gridContainer).toHaveClass(
      "grid-cols-1",
      "xs:grid-cols-2",
      "lg:grid-cols-4"
    );
  });

  it("renders skeleton elements with wave animation", () => {
    render(<FeaturedProductsSkeleton count={1} />);

    const skeletonElements = screen.getAllByTestId("skeleton");
    skeletonElements.forEach(skeleton => {
      expect(skeleton).toHaveAttribute("data-variant", "wave");
    });
  });

  it("matches product card structure with proper dimensions", () => {
    render(<FeaturedProductsSkeleton count={1} />);

    // Check for image skeleton with correct height classes
    const imageSkeletons = screen
      .getAllByTestId("skeleton")
      .filter(
        skeleton =>
          skeleton.className.includes("h-full") &&
          skeleton.className.includes("rounded-t-xl")
      );
    expect(imageSkeletons.length).toBe(1);

    // Check for title skeleton
    const titleSkeletons = screen
      .getAllByTestId("skeleton")
      .filter(
        skeleton =>
          skeleton.className.includes("h-4") &&
          skeleton.className.includes("xs:h-5")
      );
    expect(titleSkeletons.length).toBeGreaterThan(0);
  });

  it("renders skeleton card with proper styling", () => {
    render(<FeaturedProductsSkeleton count={1} />);

    const cardContainer = document.querySelector(".bg-background");
    expect(cardContainer).toHaveClass(
      "bg-background",
      "rounded-xl",
      "shadow-md",
      "border-gray-200"
    );
  });

  it("includes skeleton for price and button elements", () => {
    render(<FeaturedProductsSkeleton count={1} />);

    // Check for price skeleton (w-20)
    const priceSkeletons = screen
      .getAllByTestId("skeleton")
      .filter(skeleton => skeleton.className.includes("w-20"));
    expect(priceSkeletons.length).toBeGreaterThanOrEqual(1);

    // Check for button skeleton (rounded)
    const buttonSkeletons = screen
      .getAllByTestId("skeleton")
      .filter(
        skeleton =>
          skeleton.className.includes("rounded") &&
          skeleton.className.includes("ml-2")
      );
    expect(buttonSkeletons.length).toBe(1);
  });

  it("renders multiple description lines", () => {
    render(<FeaturedProductsSkeleton count={1} />);

    // Should have 2 description lines with different widths
    const descriptionSkeletons = screen
      .getAllByTestId("skeleton")
      .filter(
        skeleton =>
          skeleton.className.includes("h-3") &&
          skeleton.className.includes("xs:h-4")
      );
    expect(descriptionSkeletons.length).toBe(2);

    // Check that one is full width and one is 2/3 width
    const fullWidthDesc = descriptionSkeletons.find(skeleton =>
      skeleton.className.includes("w-full")
    );
    const partialWidthDesc = descriptionSkeletons.find(skeleton =>
      skeleton.className.includes("w-2/3")
    );

    expect(fullWidthDesc).toBeTruthy();
    expect(partialWidthDesc).toBeTruthy();
  });
});
