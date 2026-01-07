import React from "react";
import { render, screen } from "@testing-library/react";

import { PaymentMethodSelector } from "@/features/checkout/components/PaymentMethodSelector";
import { I18nProvider } from "@/lib/i18n";

function renderPaymentMethodSelector(
  props: Partial<React.ComponentProps<typeof PaymentMethodSelector>> = {}
) {
  const defaultProps: React.ComponentProps<typeof PaymentMethodSelector> = {
    selectedPaymentMethod: "cash_on_delivery",
    onPaymentMethodChange: jest.fn(),
    savedCards: [],
    isLoadingCards: false,
    userLocation: "",
    userLocale: "en-US",
    billingCountry: "",
    shippingCountry: "",
  };

  return render(
    <I18nProvider initialLanguage="ro">
      <PaymentMethodSelector {...defaultProps} {...props} />
    </I18nProvider>
  );
}

describe("PaymentMethodSelector (COD visibility)", () => {
  const originalStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED;
  const originalNetopiaEnabled = process.env.NEXT_PUBLIC_NETOPIA_ENABLED;

  beforeEach(() => {
    // Make tests deterministic: hide Stripe & Netopia so only COD can appear when eligible.
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = "false";
    process.env.NEXT_PUBLIC_NETOPIA_ENABLED = "false";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = originalStripeEnabled;
    process.env.NEXT_PUBLIC_NETOPIA_ENABLED = originalNetopiaEnabled;
  });

  it("shows COD when shipping country is RO (even if locale is en)", () => {
    renderPaymentMethodSelector({
      userLocale: "en-US",
      shippingCountry: "RO",
      billingCountry: "",
    });

    expect(
      screen.getByText("Plată la livrare (Ramburs)")
    ).toBeInTheDocument();
  });

  it("shows COD when locale is ro-RO (even if shipping is not RO)", () => {
    renderPaymentMethodSelector({
      userLocale: "ro-RO",
      shippingCountry: "United States",
      billingCountry: "United States",
    });

    expect(
      screen.getByText("Plată la livrare (Ramburs)")
    ).toBeInTheDocument();
  });

  it("does not show COD when there is no Romanian signal", () => {
    renderPaymentMethodSelector({
      userLocale: "en-US",
      shippingCountry: "United States",
      billingCountry: "United States",
      userLocation: "United States",
    });

    expect(
      screen.queryByText("Plată la livrare (Ramburs)")
    ).not.toBeInTheDocument();
  });
});


