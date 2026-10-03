import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { PaymentForm } from "@/features/checkout/components/PaymentForm";
import { fetchCodGuaranteePolicy } from "@/features/checkout/lib/checkoutApi";
import { useOptimizedSession } from "@/lib/auth/SessionContext";

jest.mock("@/features/cart", () => {
  const items = [{ productId: "toy-1", price: 168, quantity: 1 }];
  const getCartTotal = () => 168;
  return { useCart: () => ({ items, getCartTotal }) };
});
jest.mock("@/lib/auth/SessionContext", () => ({
  useOptimizedSession: jest.fn(),
}));
jest.mock("@/lib/i18n", () => {
  const t = (_key: string, fallback: string) => fallback;
  return { useTranslation: () => ({ t }) };
});
jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({ formatPrice: (n: number) => `${n.toFixed(2)} lei` }),
}));
jest.mock("@/features/checkout/hooks/useCheckoutSettings", () => {
  const settings = {
    checkoutAdminOnly: false,
    shippingSettings: { deliveryPrice: { active: true, price: "19.99" } },
  };
  return { useCheckoutSettings: () => ({ settings }) };
});
jest.mock("@/features/checkout/lib/checkoutApi", () => ({
  fetchCODSettings: jest
    .fn()
    .mockResolvedValue({ percentage: "1", fixedFee: "5" }),
  fetchCodGuaranteePolicy: jest.fn(),
}));
jest.mock("@/features/checkout/components/PaymentMethodSelector", () => ({
  PaymentMethodSelector: () => null,
}));
jest.mock("@/features/checkout/components/PaymentSummary", () => ({
  PaymentSummary: () => null,
}));
jest.mock("@/features/checkout/components/BillingAddressForm", () => ({
  BillingAddressForm: () => null,
}));
jest.mock("@/features/checkout/components/StripeProvider", () => ({
  StripeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
const mockAuthorize = jest.fn();
jest.mock("@/features/checkout/components/StripePaymentForm", () => ({
  StripePaymentForm: (props: {
    submitButtonClassName: string;
    submitLabel: string;
    paymentIntentId: string;
    onSuccess: (details: { stripePaymentIntentId: string }) => void;
  }) => (
    <div>
      <button
        className={props.submitButtonClassName}
        onClick={() => mockAuthorize()}
      >
        {props.submitLabel}
      </button>
      <button
        onClick={() =>
          props.onSuccess({ stripePaymentIntentId: props.paymentIntentId })
        }
      >
        Simulate Stripe success
      </button>
    </div>
  ),
}));

describe("PaymentForm mandatory COD authorization", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = "true";
    jest
      .mocked(useOptimizedSession)
      .mockReturnValue({ data: null } as ReturnType<
        typeof useOptimizedSession
      >);
    jest.mocked(fetchCodGuaranteePolicy).mockResolvedValue({
      required: false,
      mode: "risk_based",
      reasons: [],
      thresholds: {
        highOrderValue: 500,
        newCustomerMinTotal: 200,
        b2bMinTotal: 700,
        codRtoCount: 1,
      },
    });
    jest.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          clientSecret: "synthetic-secret",
          paymentIntentId: "pi_hold",
          amount: 1999,
        }),
    } as Response);
  });
  afterEach(() => {
    if (originalEnabled === undefined)
      delete process.env.NEXT_PUBLIC_STRIPE_ENABLED;
    else process.env.NEXT_PUBLIC_STRIPE_ENABLED = originalEnabled;
  });

  function renderCod(holdPrice: number | null = 19.99) {
    const onSubmit = jest.fn();
    render(
      <PaymentForm
        initialPaymentMethod="cash_on_delivery"
        initialCodConsentAccepted
        shippingAddress={{
          fullName: "Test Shopper",
          email: "guest@example.com",
          addressLine1: "Test address",
          city: "București",
          state: "B",
          postalCode: "010101",
          country: "RO",
          phone: "0711111111",
        }}
        shippingMethod={{
          id: "fancourier:standard",
          name: "FanCourier Standard",
          description: "Home delivery",
          price: 19.99,
          estimatedDelivery: "24–72 h",
          codGuaranteeHoldPrice: holdPrice,
        }}
        onSubmit={onSubmit}
        onBack={jest.fn()}
      />
    );
    return onSubmit;
  }

  it.each(["guest", "returning customer"])(
    "requires a 19.99 lei shipping hold for a 168 lei %s order despite a stale exemption",
    async kind => {
      if (kind === "returning customer")
        jest.mocked(useOptimizedSession).mockReturnValue({
          data: { user: { id: "customer-1", email: "buyer@example.com" } },
        } as ReturnType<typeof useOptimizedSession>);
      const onSubmit = renderCod();
      await screen.findByRole("button", { name: "Autorizează 19.99 lei" });
      expect(
        screen.queryByText("Nu este necesară garanția pe card")
      ).not.toBeInTheDocument();
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Continuă la verificare" })
        ).toBeEnabled()
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Continuă la verificare" })
      );
      expect(mockAuthorize).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
      fireEvent.click(
        screen.getByRole("button", { name: "Simulate Stripe success" })
      );
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: "cash_on_delivery",
          codGuaranteePaymentIntentId: "pi_hold",
          codGuaranteeAmount: 19.99,
          codConsentVersion: "2026-10-04",
        })
      );
      const payload = JSON.parse(
        jest.mocked(fetch).mock.calls[0][1]?.body as string
      );
      expect(payload.amount).toBe(1999);
      expect(payload.checkoutContext.paymentMethod).toBe("cash_on_delivery");
    }
  );

  it("blocks continuation when the shipping hold price is missing", async () => {
    const onSubmit = renderCod(null);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Continuă la verificare" })
      ).toBeEnabled()
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continuă la verificare" })
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(/Momentan nu putem autoriza garanția/).length
    ).toBeGreaterThan(0);
  });
});
