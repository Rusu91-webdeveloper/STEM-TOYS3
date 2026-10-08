import { prisma } from "@/lib/prisma";
import {
  getShippingSettings,
  getCODSettings,
  getTaxSettings,
} from "@/lib/utils/store-settings";

jest.mock("@/lib/prisma", () => ({
  prisma: { storeSettings: { findFirst: jest.fn() } },
}));
jest.mock("@/lib/cache", () => ({
  invalidateCache: jest.fn(),
  CacheKeys: { product: (key: string) => key },
}));
jest.mock("@/lib/config/app-config", () => ({
  appConfig: {
    contactEmail: "shop@example.test",
    storePhoneFormatted: "+40700000000",
  },
}));
const record = (price: string) => ({
  shippingSettings: { deliveryPrice: { price, active: true } },
  paymentSettings: {
    codSettings: { fixedFee: price, percentage: "0", active: true },
  },
  taxSettings: {
    rate: "19",
    active: true,
    includeInPrice: false,
    vatRegistered: true,
  },
});

describe("saved settings used by checkout", () => {
  beforeEach(() => jest.clearAllMocks());
  it("reads the latest persisted revision for each quote instead of another server's stale cache", async () => {
    (prisma.storeSettings.findFirst as jest.Mock).mockResolvedValue(
      record("10.00")
    );
    expect((await getShippingSettings()).deliveryPrice.price).toBe("10.00");
    (prisma.storeSettings.findFirst as jest.Mock).mockResolvedValue(
      record("21.35")
    );
    expect((await getShippingSettings()).deliveryPrice.price).toBe("21.35");
    expect((await getCODSettings()).fixedFee).toBe("21.35");
    expect((await getTaxSettings()).rate).toBe("19");
  });
  it("uses the saved VAT registration flag and disables tax when registration is false", async () => {
    (prisma.storeSettings.findFirst as jest.Mock).mockResolvedValue({
      ...record("10"),
      taxSettings: { rate: "19", active: true, vatRegistered: false },
    });
    expect(await getTaxSettings()).toEqual({
      rate: "0",
      active: false,
      includeInPrice: true,
    });
  });
  it("fails the quote if saved configuration cannot be loaded, even after a previous success", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    (prisma.storeSettings.findFirst as jest.Mock).mockResolvedValue(
      record("21.35")
    );
    await getShippingSettings();
    (prisma.storeSettings.findFirst as jest.Mock).mockRejectedValue(
      new Error("Database unavailable")
    );
    for (const load of [getShippingSettings, getCODSettings, getTaxSettings])
      await expect(load()).rejects.toThrow("Database unavailable");
    error.mockRestore();
  });
});
