import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

const PageWithH1 = () => (
  <div>
    <h1>Primary Heading</h1>
    <section>
      <h2>Subheading</h2>
    </section>
  </div>
);

describe("Heading structure", () => {
  it("has one H1 present on page component", () => {
    const { container } = render(<PageWithH1 />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});
