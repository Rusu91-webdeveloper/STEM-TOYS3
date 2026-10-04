import { act, render, screen } from "@testing-library/react";

import { useCart } from "@/features/cart";
import { CheckoutSummary } from "@/features/checkout/components/CheckoutSummary";
import {
  fetchCODSettings,
  fetchShippingSettings,
  fetchTaxSettings,
} from "@/features/checkout/lib/checkoutApi";
import { defaultShippingSettings } from "@/lib/shipping/settings";

jest.mock("@/features/cart", () => ({ useCart: jest.fn() }));
jest.mock("@/features/cart/components/CartProductImage", () => ({
  CartProductImage: () => null,
}));
jest.mock("@/features/cart/components/CouponInput", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({
    formatPrice: (value: number) => `${value.toFixed(2)} lei`,
  }),
}));
jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
jest.mock("@/features/checkout/lib/checkoutApi", () => ({
  fetchTaxSettings: jest.fn(),
  fetchCODSettings: jest.fn(),
  fetchShippingSettings: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(useCart).mockReturnValue({
    cartItems: [
      {
        id: "fixture",
        name: "Synthetic physical kit",
        price: 206,
        quantity: 3,
        isBook: false,
      },
    ],
    getCartTotal: () => 618,
    isLoading: false,
  } as never);
  jest
    .mocked(fetchTaxSettings)
    .mockResolvedValue({ active: false, rate: "0", includeInPrice: true });
  jest
    .mocked(fetchCODSettings)
    .mockResolvedValue({ active: true, percentage: "0.01", fixedFee: "5.00" });
  jest
    .mocked(fetchShippingSettings)
    .mockResolvedValue(defaultShippingSettings());
});

it("preserves an authoritative separate-shipment quote above the free-delivery threshold", async () => {
  render(
    <CheckoutSummary
      shippingMethod={{
        id: "fancourier:standard",
        name: "FAN Courier",
        description: "Separate shipments",
        price: 23.5,
        estimatedDelivery: "24–72 h",
      }}
    />
  );
  expect(await screen.findByText("23.50 lei")).toBeInTheDocument();
  expect(screen.getByText("641.50 lei")).toBeInTheDocument();
  expect(screen.queryByText("GRATUIT")).not.toBeInTheDocument();
});

it("keeps unavailable delivery unknown and labels the subtotal as an estimate", async () => {
  jest.mocked(fetchShippingSettings).mockRejectedValue(new Error("offline"));
  render(<CheckoutSummary />);
  expect(
    await screen.findByText("Se calculează la finalizare")
  ).toBeInTheDocument();
  expect(screen.getByText("Total estimat")).toBeInTheDocument();
  expect(screen.queryByText("GRATUIT")).not.toBeInTheDocument();
});

it("shows zero delivery for a digital-only cart", async () => {
  jest.mocked(useCart).mockReturnValue({
    cartItems: [
      {
        id: "book",
        name: "Synthetic ebook",
        price: 90,
        quantity: 1,
        isBook: true,
      },
    ],
    getCartTotal: () => 90,
    isLoading: false,
  } as never);
  await act(async () => {
    render(<CheckoutSummary />);
    await Promise.resolve();
  });
  expect(screen.getByText("GRATUIT")).toBeInTheDocument();
  expect(
    screen.getByText("90.00 lei", { selector: "span.text-primary" })
  ).toBeInTheDocument();
});
