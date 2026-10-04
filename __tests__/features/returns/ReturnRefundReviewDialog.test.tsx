import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReturnRefundReviewDialog } from "@/features/returns/components/ReturnRefundReviewDialog";
jest.mock("@/hooks/useCsrfToken", () => ({
  useCsrfToken: () => ({
    token: "local",
    addToHeaders: (headers: object) => ({
      ...headers,
      "X-CSRF-Token": "local",
    }),
  }),
}));
const target = {
  id: "r1",
  order: {
    orderNumber: "O1",
    total: 120,
    shippingCost: 20,
    discountAmount: 0,
    paymentMethod: "stripe_new",
  },
  orderItem: { name: "Test toy", price: 100, quantity: 1 },
};
const fetchMock = fetch as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ return: target }),
  });
});
test("Stripe refund requires an explicit amount review and includes delivery when the admin confirms 120 lei", async () => {
  render(
    <ReturnRefundReviewDialog
      target={target}
      onClose={jest.fn()}
      onUpdated={jest.fn()}
    />
  );
  expect(
    screen.getByRole("button", { name: "Confirmă rambursarea Stripe" })
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Suma exactă de rambursat (lei)"), {
    target: { value: "120,00" },
  });
  fireEvent.change(screen.getByLabelText("Explicația calculului"), {
    target: { value: "Produse 100 + livrare standard 20." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmă rambursarea Stripe" })
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    status: "REFUNDED",
    refundReview: {
      amountRon: 120,
      notes: "Produse 100 + livrare standard 20.",
      confirmed: true,
    },
  });
  expect(fetchMock.mock.calls[0][1].headers["X-CSRF-Token"]).toBe("local");
});
test("COD offers proof recording rather than a Stripe refund button", () => {
  render(
    <ReturnRefundReviewDialog
      target={{
        ...target,
        order: { ...target.order, paymentMethod: "cash_on_delivery" },
      }}
      onClose={jest.fn()}
      onUpdated={jest.fn()}
    />
  );
  expect(
    screen.queryByRole("button", { name: "Confirmă rambursarea Stripe" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByLabelText("Referința dovezii rambursării efectuate")
  ).toBeVisible();
  expect(
    screen.getByRole("button", {
      name: "Înregistrează rambursarea deja efectuată",
    })
  ).toBeDisabled();
  expect(fetchMock).not.toHaveBeenCalled();
});
