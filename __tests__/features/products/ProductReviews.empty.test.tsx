import { render, screen } from "@testing-library/react";
import React from "react";

import { ProductReviews } from "@/features/products/components/ProductReviews";

describe("ProductReviews empty state", () => {
  it("shows an honest Romanian empty state and no star rating", () => {
    const { container } = render(
      <ProductReviews productId="p1" reviews={[]} userLoggedIn={false} />
    );

    expect(screen.getByText("Încă nu există recenzii")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scrie o recenzie" })).toBeDisabled();
    expect(screen.queryByText(/Customer Reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No reviews yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Write a review/i)).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryByText(/stea/i)).not.toBeInTheDocument();
  });
});
