import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { CodPaymentNotice } from "@/components/storefront/CodPaymentNotice";
import { EnhancedCheckoutStepper } from "@/features/checkout/components/EnhancedCheckoutStepper";
import { OptimizedProductImage } from "@/features/products/components/OptimizedProductImage";
import ProductSpecs from "@/features/products/components/ProductSpecs";

jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

it("displays the supplied photo before the load event without guessing a WebP filename", () => {
  render(
    <OptimizedProductImage
      src="/real-product.jpg"
      alt="Produs"
      width={400}
      height={400}
    />
  );
  expect(screen.getByRole("img", { name: "Produs" })).toBeVisible();
  expect(screen.getByRole("img", { name: "Produs" })).not.toHaveClass(
    "opacity-0"
  );
  const image = screen.getByRole("img", { name: "Produs" }) as HTMLImageElement;
  expect(new URL(image.src).searchParams.get("url")).toBe("/real-product.jpg");
});

it("discloses the current admin COD fee and mandatory card hold before checkout", () => {
  render(
    <CodPaymentNotice
      settings={{ active: true, fixedFee: "12.50", percentage: "0" }}
    />
  );
  expect(screen.getByText(/Ramburs la adresă: \+12,50 lei/)).toBeVisible();
  expect(screen.getByText(/Fiecare comandă ramburs necesită/)).toBeVisible();
});

it("does not promise a zero fee for invalid settings", () => {
  render(
    <CodPaymentNotice
      settings={{ active: true, fixedFee: "invalid", percentage: "0" }}
    />
  );
  expect(screen.getByText(/taxa se confirmă la finalizare/)).toBeVisible();
});

it("groups delivery into one stage and only permits returning to completed stages", () => {
  const change = jest.fn();
  const view = render(
    <EnhancedCheckoutStepper
      currentStep="shipping-method"
      checkoutData={{}}
      onStepChange={change}
    />
  );
  expect(screen.getByRole("button", { name: /Livrare/ })).toHaveAttribute(
    "aria-current",
    "step"
  );
  expect(screen.getByRole("button", { name: /Plată/ })).toBeDisabled();
  view.rerender(
    <EnhancedCheckoutStepper
      currentStep="review"
      checkoutData={{
        shippingMethod: {
          id: "fan",
          name: "FanCourier",
          description: "",
          price: 20,
          estimatedDelivery: "1–4 zile",
        },
      }}
      onStepChange={change}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /Plată/ }));
  expect(change).toHaveBeenCalledWith("payment");
});

it("localizes supplier attributes without displaying missing translation keys", () => {
  render(
    <ProductSpecs
      product={{
        learningOutcomes: ["pattern recognition", "logică"],
        specialCategories: ["marble-run"],
      }}
    />
  );
  expect(screen.getByText("recunoașterea tiparelor, logică")).toBeVisible();
  expect(screen.getByText("Traseu cu bile")).toBeVisible();
  expect(document.body.textContent).not.toContain("learningOutcome.");
});
