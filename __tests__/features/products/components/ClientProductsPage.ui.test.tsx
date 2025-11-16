import React from "react";
import { render } from "@testing-library/react";
import ClientProductsPage from "@/features/products/components/ClientProductsPage";

describe("ClientProductsPage - products section background", () => {
  it("renders products section with subtle silver gradient background", () => {
    const { container } = render(
      <ClientProductsPage
        initialProducts={[]}
        searchParams={{}}
        allSidebarCategories={[]}
      />
    );
    const gradientDiv = Array.from(container.querySelectorAll("div")).find(el =>
      (el as HTMLElement).style?.background?.includes("linear-gradient")
    ) as HTMLElement | undefined;
    expect(gradientDiv).toBeTruthy();
    expect(gradientDiv!.style.background).toContain("linear-gradient");
  });
});


