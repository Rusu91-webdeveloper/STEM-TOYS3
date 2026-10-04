import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useCart } from "@/features/cart";
import { ShippingMethodSelector } from "@/features/checkout/components/ShippingMethodSelector";
import {
  fetchShippingQuotes,
  fetchShippingSettings,
} from "@/features/checkout/lib/checkoutApi";
import { defaultShippingSettings } from "@/lib/shipping/settings";

jest.mock("@/features/cart", () => ({ useCart: jest.fn() }));
jest.mock("@/features/checkout/components/FanboxMapPicker", () => ({
  FanboxMapPicker: () => null,
}));
jest.mock("@/lib/i18n", () => {
  const t = (_key: string, fallback: string) => fallback;
  return { useTranslation: () => ({ t, language: "ro" }) };
});
jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({
    formatPrice: (value: number) => `${value.toFixed(2)} lei`,
  }),
}));
jest.mock("@/features/checkout/lib/checkoutApi", () => ({
  fetchShippingSettings: jest.fn(),
  fetchShippingQuotes: jest.fn(),
  fetchFanboxPickupPoints: jest.fn(),
}));
const onSubmit = jest.fn();
const quote = (price: number) => ({
  id: "fancourier:standard",
  name: "FAN Courier",
  description: "Fixture",
  estimatedDelivery: "24–72 h",
  price,
  codGuaranteeHoldPrice: 19.99,
});
beforeEach(() => {
  jest.resetAllMocks();
  jest
    .mocked(useCart)
    .mockReturnValue({
      items: [
        {
          id: "fixture",
          productId: "fixture",
          price: 206,
          quantity: 3,
          isBook: false,
        },
      ],
      getCartTotal: () => 618,
    } as never);
  jest
    .mocked(fetchShippingSettings)
    .mockResolvedValue(defaultShippingSettings());
});
const draw = () =>
  render(<ShippingMethodSelector onBack={jest.fn()} onSubmit={onSubmit} />);
it("preserves an authoritative price above the threshold instead of replacing it with free delivery", async () => {
  jest
    .mocked(fetchShippingQuotes)
    .mockResolvedValue({
      methods: [quote(23.5)],
      cartRules: { isMixedSupplierCart: true },
    } as never);
  draw();
  expect(await screen.findByText("23.50 lei")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Continuă cu Opțiunea Selectată" })
  );
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      method: expect.objectContaining({
        price: 23.5,
        codGuaranteeHoldPrice: 19.99,
      }),
    })
  );
});
it("preserves the logistics hold on a zero-price server quote", async () => {
  jest
    .mocked(fetchShippingQuotes)
    .mockResolvedValue({ methods: [quote(0)] } as never);
  draw();
  await screen.findByRole("radio");
  fireEvent.click(
    screen.getByRole("button", { name: "Continuă cu Opțiunea Selectată" })
  );
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      method: expect.objectContaining({
        price: 0,
        codGuaranteeHoldPrice: 19.99,
      }),
    })
  );
});
it.each(["failed", "empty"])(
  "prevents checkout from proceeding on a %s quote",
  async failure => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    if (failure === "failed")
      jest.mocked(fetchShippingQuotes).mockRejectedValue(new Error("offline"));
    else
      jest
        .mocked(fetchShippingQuotes)
        .mockResolvedValue({ methods: [] } as never);
    draw();
    await waitFor(() =>
      expect(
        screen.getByText(
          "Nu putem confirma costul livrării. Reîncarcă pagina pentru a încerca din nou."
        )
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Continue to Payment" })
    ).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
    log.mockRestore();
  }
);
