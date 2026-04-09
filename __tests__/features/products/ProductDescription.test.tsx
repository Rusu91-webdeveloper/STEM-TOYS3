import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductDescription } from "@/features/products/components/ProductDescription";

const t = (key: string, fallback?: string) => fallback ?? key;

describe("ProductDescription", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders title, description body, and category footer", () => {
    render(
      <ProductDescription
        description="Hello world"
        categoryName="Robotics"
        t={t}
      />
    );
    expect(
      screen.getByRole("heading", { name: /Descriere produs/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(
      screen.getByText(/Jucărie STEM concepută pentru/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Robotics/)).toBeInTheDocument();
  });

  it("does not show read more when clamped height is not exceeded", () => {
    jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(100);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
    render(
      <ProductDescription description="Short" categoryName="Cat" t={t} />
    );
    expect(
      screen.queryByRole("button", { name: /read more/i })
    ).not.toBeInTheDocument();
  });

  it("shows read more when overflow is detected and toggles to show less", async () => {
    const user = userEvent.setup();
    jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(400);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(80);

    render(
      <ProductDescription
        description={"Long text ".repeat(40)}
        categoryName="Cat"
        t={t}
      />
    );

    const expand = await screen.findByRole("button", { name: /read more/i });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    await user.click(expand);

    const collapse = screen.getByRole("button", { name: /show less/i });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
  });
});
