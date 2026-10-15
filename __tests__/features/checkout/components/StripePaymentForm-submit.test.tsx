import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { StripePaymentForm } from "@/features/checkout/components/StripePaymentForm";

const mockStripe = {
  retrievePaymentIntent: jest.fn(),
  confirmPayment: jest.fn(),
};
const mockElements = {};

jest.mock("@stripe/react-stripe-js", () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  PaymentElement: () => <div data-testid="payment-element" />,
}));
jest.mock("@/components/checkout/StripeBypassProvider", () => ({
  useStripeBypass: () => ({ stripeFailed: false }),
}));
jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({ formatPrice: (n: number) => `${n.toFixed(2)} lei` }),
}));

const defaultProps = {
  clientSecret: "fixture-secret",
  amount: 1999,
  onSuccess: jest.fn(),
  onError: jest.fn(),
  submitLabel: "Authorize guarantee",
};

describe("StripePaymentForm submission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe.retrievePaymentIntent.mockResolvedValue({
      paymentIntent: { status: "requires_payment_method" },
    });
    mockStripe.confirmPayment.mockResolvedValue({
      paymentIntent: { id: "pi_hold", status: "requires_capture" },
    });
  });

  it("keeps the normal card payment action visible", () => {
    render(<StripePaymentForm {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Authorize guarantee" })
    ).toBeVisible();
  });

  it("blocks native form submission without COD consent and reports progress after acceptance", async () => {
    const onProcessingChange = jest.fn();
    const { rerender } = render(
      <StripePaymentForm
        {...defaultProps}
        hideSubmitButton
        isSubmitDisabled
        onProcessingChange={onProcessingChange}
      />
    );
    const form = screen.getByTestId("payment-element").closest("form")!;
    expect(
      screen.queryByRole("button", { name: "Authorize guarantee" })
    ).not.toBeInTheDocument();
    fireEvent.submit(form);
    expect(mockStripe.retrievePaymentIntent).not.toHaveBeenCalled();

    rerender(
      <StripePaymentForm
        {...defaultProps}
        hideSubmitButton
        onProcessingChange={onProcessingChange}
      />
    );
    fireEvent.submit(form);
    await waitFor(() =>
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ stripePaymentIntentId: "pi_hold" })
      )
    );
    expect(onProcessingChange.mock.calls).toEqual([[true], [false]]);
    expect(mockStripe.confirmPayment).toHaveBeenCalledTimes(1);
  });

  it("restores the action after a card error", async () => {
    const onProcessingChange = jest.fn();
    mockStripe.confirmPayment.mockResolvedValue({
      error: { code: "expired_card" },
    });
    render(
      <StripePaymentForm
        {...defaultProps}
        onProcessingChange={onProcessingChange}
      />
    );
    fireEvent.submit(screen.getByTestId("payment-element").closest("form")!);
    await waitFor(() => expect(defaultProps.onError).toHaveBeenCalled());
    expect(onProcessingChange.mock.calls).toEqual([[true], [false]]);
    expect(
      screen.getByRole("button", { name: "Authorize guarantee" })
    ).toBeEnabled();
  });
});
