import React from "react";
import { render, screen } from "@testing-library/react";
import { ProductsHeroSection } from "@/features/products/components/ProductsHeroSection";
import { Atom } from "lucide-react";

describe("ProductsHeroSection", () => {
  const t = (key: string, fallback?: string) => fallback || key;

  it("renders with reduced height classes (~half current)", () => {
    render(
      <ProductsHeroSection
        categoryImagePath="/test.jpg"
        activeCategory={null}
        activeCategoryInfo={{
          icon: Atom,
          bgColor: "bg-blue-500",
          textColor: "text-blue-500",
          letter: "S",
        }}
        getCategoryTitle={() => "Title"}
        getCategoryDescription={() => "Description"}
        t={t}
      />
    );

    // Assert the hero wrapper exists
    const heroContainers = screen.getAllByRole("img", { hidden: true });
    expect(heroContainers.length).toBeGreaterThan(0);

    // Check for one of the reduced height classes present in the DOM
    const reducedHeight = document.querySelector(
      ".h-\\[12vh\\],.xs\\:h-\\[15vh\\],.sm\\:h-\\[18vh\\]"
    );
    expect(reducedHeight).toBeTruthy();
  });
});


