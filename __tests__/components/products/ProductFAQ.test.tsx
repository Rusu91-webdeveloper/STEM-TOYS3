import React from "react";
import { render, screen } from "@testing-library/react";
import ProductFAQ from "@/features/products/components/ProductFAQ";

describe("ProductFAQ", () => {
  it("renders FAQ items when provided", () => {
    const faq = [
      { question: "Is it safe?", answer: "Yes" },
      { question: "Age", answer: "6-8" },
    ];
    render(<ProductFAQ faq={faq as any} />);
    expect(screen.getByText(/FAQ/i)).toBeInTheDocument();
    expect(screen.getByText(/Is it safe\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Age/i)).toBeInTheDocument();
  });
});
