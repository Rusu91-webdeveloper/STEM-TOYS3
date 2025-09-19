import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

jest.mock("@/hooks/useABTest", () => ({
  useABTest: () => ({
    variantName: "variant-a",
    isControl: false,
    trackConversion: jest.fn(),
  }),
  useConversionTracking: () => ({ trackEvent: jest.fn() }),
}));

import { ProductsHeroSection } from "@/features/products/components/ProductsHeroSection";

describe("ProductsHeroSection", () => {
  const baseProps = {
    categoryImagePath: "/test.jpg",
    activeCategory: null,
    activeCategoryInfo: {
      icon: () => null as any,
      bgColor: "bg-blue-500",
      textColor: "text-white",
      letter: "S",
    },
    getCategoryTitle: () => "All STEM Toys",
    getCategoryDescription: () => "Discover the best STEM toys",
    t: (k: string, f?: string) => f || k,
  };

  it("fires tracking on CTA clicks", () => {
    const { container } = render(<ProductsHeroSection {...baseProps} />);

    // get mocked trackEvent
    const { useConversionTracking } = jest.requireMock("@/hooks/useABTest");
    const { trackEvent } = useConversionTracking();

    fireEvent.click(screen.getByText("getPersonalizedRecommendations"));
    fireEvent.click(screen.getByText("seeSuccessStories"));

    expect(trackEvent).toHaveBeenCalled();
  });
});
