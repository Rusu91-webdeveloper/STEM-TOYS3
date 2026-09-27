import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { ProductPurchaseActions } from "@/features/products/components/ProductPurchaseActions";

describe("ProductPurchaseActions", () => {
  it("renders a labelled Romanian add-to-cart button", async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    render(
      <ProductPurchaseActions
        productName="Kit robotică"
        price={129}
        isOutOfStock={false}
        isAdding={false}
        justAdded={false}
        onAdd={onAdd}
      />
    );

    const button = screen.getByTestId("add-to-cart");
    expect(button).toHaveTextContent("Adaugă în coș");
    expect(screen.queryByTestId("pdp-sticky-add-to-cart")).not.toBeInTheDocument();
    await user.click(button);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("shows the Romanian loading and added labels", () => {
    const { rerender } = render(
      <ProductPurchaseActions
        productName="Kit"
        price={10}
        isOutOfStock={false}
        isAdding
        justAdded={false}
        onAdd={jest.fn()}
      />
    );
    expect(screen.getByTestId("add-to-cart")).toHaveTextContent("Se adaugă…");

    rerender(
      <ProductPurchaseActions
        productName="Kit"
        price={10}
        isOutOfStock={false}
        isAdding={false}
        justAdded
        onAdd={jest.fn()}
      />
    );
    expect(screen.getByTestId("add-to-cart")).toHaveTextContent("Adăugat în coș");
  });

  it("disables the button when out of stock and hides the sticky bar", () => {
    render(
      <ProductPurchaseActions
        productName="Kit"
        price={10}
        isOutOfStock
        isAdding={false}
        justAdded={false}
        onAdd={jest.fn()}
      />
    );

    expect(screen.getByTestId("add-to-cart")).toBeDisabled();
    expect(screen.getByTestId("add-to-cart")).toHaveTextContent("Stoc epuizat");
    expect(screen.queryByTestId("pdp-sticky-add-to-cart")).not.toBeInTheDocument();
  });
});
