/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { StemGuideLanding } from "@/features/guides/components/StemGuideLanding";

const mockTranslation = jest.fn(key => key);

jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({
    t: mockTranslation,
  }),
}));

const renderComponent = () => render(React.createElement(StemGuideLanding));

describe.skip("StemGuideLanding (skipped due to jest module transform limitations)", () => {
  afterEach(() => {
    mockTranslation.mockImplementation(key => key);
    mockTranslation.mockClear();
  });

  it("renders hero headline and product CTA", () => {
    renderComponent();

    expect(screen.getByText("guide2025H1")).toBeInTheDocument();

    const productLinks = screen.getAllByRole("link", { name: "guide2025SeeProducts" });
    expect(productLinks.some(link => link.getAttribute("href") === "/products")).toBe(true);
  });

  it("creates anchor sections for navigation", () => {
    renderComponent();

    expect(document.getElementById("categorii")).not.toBeNull();
    expect(document.getElementById("varsta")).not.toBeNull();
    expect(document.getElementById("faq")).not.toBeNull();
  });

  it("falls back to translation keys when values are empty", () => {
    mockTranslation.mockImplementation(() => "");

    renderComponent();

    expect(screen.getByText("guide2025QuickSummary1")).toBeInTheDocument();
    expect(screen.getByText("guide2025QuickSummary5")).toBeInTheDocument();
  });
});

