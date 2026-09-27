import { render, screen } from "@testing-library/react";
import React from "react";

import { CodRambursGuaranteePanel } from "@/features/checkout/components/cod-panels/CodRambursGuaranteePanel";
import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";

jest.mock("@/features/checkout/components/StripeProvider", () => ({
  StripeProvider: ({
    options,
    children,
  }: {
    options?: { locale?: string };
    children: React.ReactNode;
  }) => (
    <div data-testid="guarantee-stripe" data-locale={options?.locale ?? ""}>
      {children}
    </div>
  ),
}));

jest.mock("@/features/checkout/components/StripePaymentForm", () => ({
  StripePaymentForm: ({
    defaultBillingCountry,
    amount,
    submitLabel,
  }: {
    defaultBillingCountry?: string;
    amount: number;
    submitLabel?: string;
  }) => (
    <div
      data-testid="guarantee-element"
      data-country={defaultBillingCountry ?? ""}
      data-amount={String(amount)}
    >
      {submitLabel}
    </div>
  ),
}));

const billingDetails = () => ({
  name: "Ana Pop",
  email: "ana@example.com",
  address: {
    line1: "Florilor 12",
    line2: "",
    city: "Cluj-Napoca",
    state: "CJ",
    postal_code: "400001",
    country: "RO",
  },
});

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof CodRambursGuaranteePanel>> = {}
) {
  return render(
    <I18nProvider initialLanguage="ro">
      <CurrencyProvider>
        <CodRambursGuaranteePanel
          stripeEnabled
          isResolvingCodGuaranteePolicy={false}
          codGuaranteeRequired
          codGuaranteeAmount={19.99}
          codGuaranteeAuthorized={false}
          codGuaranteePaymentIntentId="pi_guarantee"
          codGuaranteeIntentError={null}
          isCreatingCodGuaranteeIntent={false}
          codGuaranteeClientSecret="cs_test"
          codGuaranteeIntentAmount={2500}
          isCalculatingTotal={false}
          getBillingDetails={billingDetails}
          onCODGuaranteeSuccess={jest.fn()}
          onCODGuaranteeError={jest.fn()}
          {...overrides}
        />
      </CurrencyProvider>
    </I18nProvider>
  );
}

describe("CodRambursGuaranteePanel", () => {
  it("shows the server hold amount and Romanian Payment Element defaults", () => {
    renderPanel();

    expect(screen.getByText("25.00 lei")).toBeInTheDocument();
    expect(screen.queryByText("19.99 lei")).not.toBeInTheDocument();
    expect(screen.getByTestId("guarantee-stripe")).toHaveAttribute(
      "data-locale",
      "ro"
    );
    expect(screen.getByTestId("guarantee-element")).toHaveAttribute(
      "data-country",
      "RO"
    );
    expect(screen.getByTestId("guarantee-element")).toHaveAttribute(
      "data-amount",
      "2500"
    );
    expect(screen.getByText(/Autorizează 25.00 lei/)).toBeInTheDocument();
  });

  it("does not show the client shipping estimate before the server amount arrives", () => {
    renderPanel({
      codGuaranteeClientSecret: null,
      codGuaranteePaymentIntentId: undefined,
      codGuaranteeIntentAmount: null,
    });

    expect(screen.getByText("Se calculează...")).toBeInTheDocument();
    expect(screen.queryByText("19.99 lei")).not.toBeInTheDocument();
    expect(screen.queryByTestId("guarantee-element")).not.toBeInTheDocument();
  });

  it("hides the card form when a guarantee is not required", () => {
    renderPanel({ codGuaranteeRequired: false });

    expect(
      screen.getByText("Nu este necesară garanția pe card")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("guarantee-element")).not.toBeInTheDocument();
  });
});
