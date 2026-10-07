import { render, screen } from "@testing-library/react";
import React from "react";

import { OrderDetailsClient } from "@/app/account/orders/[orderId]/OrderDetailsClient";

jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));
jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({ formatPrice: (price: number) => `${price} lei` }),
}));
const fixture = (
  isDigital: boolean,
  status: string,
  paymentStatus: string
) => ({
  id: "order",
  orderNumber: "TEST",
  status,
  paymentStatus,
  paymentMethod: "stripe_new",
  subtotal: 20,
  shippingCost: 0,
  tax: 0,
  total: 20,
  createdAt: "2026-10-07T10:00:00Z",
  deliveredAt: "2026-10-07T10:00:00Z",
  items: [
    {
      id: "item",
      name: "Fixture",
      price: 20,
      quantity: 1,
      productId: "",
      product: null,
      reviews: [],
      isDigital,
      returnStatus: "NONE",
    },
  ],
  shippingAddress: {
    fullName: "Test",
    addressLine1: "Test",
    addressLine2: null,
    city: "Test",
    state: "Test",
    postalCode: "000000",
    country: "RO",
    phone: "TEST",
  },
});

test.each([
  [true, "PROCESSING", "PAID"],
  [false, "COMPLETED", "PAID"],
])(
  "the customer can reach review for digital=%s / status=%s",
  (digital, status, paymentStatus) => {
    render(
      <OrderDetailsClient order={fixture(digital, status, paymentStatus)} />
    );
    expect(
      screen.getByRole("link", { name: "Returnează produsul" })
    ).toHaveAttribute("href", "/account/orders/order/return?itemId=item");
  }
);

test("unpaid digital content does not expose a return entry", () => {
  render(<OrderDetailsClient order={fixture(true, "PROCESSING", "PENDING")} />);
  expect(
    screen.queryByRole("link", { name: "Returnează produsul" })
  ).not.toBeInTheDocument();
});
