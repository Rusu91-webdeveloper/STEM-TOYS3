import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SeoJsonLd } from "@/components/seo/SeoJsonLd";

describe("SeoJsonLd", () => {
  it("renders a single JSON-LD object", () => {
    const { container } = render(
      <SeoJsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Thing",
          name: "Test",
        }}
      />
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('"@type":"Thing"');
  });

  it("renders an array as JSON-LD array", () => {
    const { container } = render(
      <SeoJsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Thing", name: "A" },
          { "@context": "https://schema.org", "@type": "Thing", name: "B" },
        ]}
      />
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('"name":"A"');
    expect(script?.innerHTML).toContain('"name":"B"');
  });
});
