import React from "react";
import { render } from "@testing-library/react";
import { StemBenefitsSection } from "@/features/products/components/StemBenefitsSection";
import { Brain } from "lucide-react";

describe("StemBenefitsSection", () => {
  const t = (key: string, fallback?: string) => fallback || key;

  it("renders glassmorphism cards with blur and translucent bg", () => {
    const { container } = render(
      <StemBenefitsSection
        stemBenefits={[
          { icon: Brain, titleKey: "title", descKey: "desc" },
          { icon: Brain, titleKey: "title2", descKey: "desc2" },
        ]}
        activeCategory={null}
        t={t}
      />
    );

    // look for updated glass card styles
    const card = container.querySelector(
      ".backdrop-blur-lg.border.rounded-2xl"
    );
    expect(card).toBeTruthy();
  });
});


