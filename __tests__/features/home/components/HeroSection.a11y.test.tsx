import React from "react";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/features/home/components";

const t = (k: string, d?: string) => d || k;

describe("HeroSection accessibility", () => {
  it("renders a single H1 and labelled section", () => {
    render(<HeroSection t={t} />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s.length).toBe(1);
    expect(screen.getByLabelText(/hero|homepage/i)).toBeInTheDocument();
  });
});
