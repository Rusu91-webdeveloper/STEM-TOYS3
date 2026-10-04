import { act, renderHook, waitFor } from "@testing-library/react";

import { useCartShippingEstimate } from "@/features/cart/hooks/useCartShippingEstimate";
import { fetchShippingSettings } from "@/features/checkout/lib/checkoutApi";
import { defaultShippingSettings } from "@/lib/shipping/settings";

jest.mock("@/features/checkout/lib/checkoutApi", () => ({
  fetchShippingSettings: jest.fn(),
}));
const fetchSettings = jest.mocked(fetchShippingSettings);

describe("cart shipping estimates", () => {
  beforeEach(() => fetchSettings.mockReset());

  it("keeps shipping unknown until settings arrive, then charges below 500 and frees it at 500", async () => {
    let resolve!: (value: ReturnType<typeof defaultShippingSettings>) => void;
    fetchSettings.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    const { result, rerender } = renderHook(
      ({ subtotal }) => useCartShippingEstimate(subtotal, true),
      { initialProps: { subtotal: 206 } }
    );
    expect(result.current.shippingCost).toBeNull();
    expect(result.current.freeThreshold).toBeNull();
    await act(async () => {
      resolve(defaultShippingSettings());
      await Promise.resolve();
    });
    expect(result.current.shippingCost).toBe(19.99);
    rerender({ subtotal: 499.99 });
    expect(result.current.shippingCost).toBe(19.99);
    rerender({ subtotal: 500 });
    expect(result.current.shippingCost).toBe(0);
    rerender({ subtotal: 618 });
    expect(result.current.shippingCost).toBe(0);
    rerender({ subtotal: 206 });
    expect(result.current.shippingCost).toBe(19.99);
  });

  it("keeps a failed request unknown instead of advertising free delivery", async () => {
    fetchSettings.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useCartShippingEstimate(206, true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shippingCost).toBeNull();
  });

  it("respects disabled free delivery and configured service prices", async () => {
    const settings = defaultShippingSettings();
    settings.freeThreshold.active = false;
    settings.couriers = settings.couriers.map(courier => ({
      ...courier,
      services: courier.services.map(service => ({
        ...service,
        priceOverride: "23.50",
      })),
    }));
    fetchSettings.mockResolvedValue(settings);
    const { result } = renderHook(() => useCartShippingEstimate(618, true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shippingCost).toBe(23.5);
    expect(result.current.freeThreshold).toBeNull();
  });

  it("does not charge delivery for a digital-only cart", () => {
    const { result } = renderHook(() => useCartShippingEstimate(90, false));
    expect(result.current.shippingCost).toBe(0);
    expect(fetchSettings).not.toHaveBeenCalled();
  });
});
