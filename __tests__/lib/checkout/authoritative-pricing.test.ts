/**
 * @jest-environment node
 */

jest.mock("@/lib/db", () => ({
  db: {
    book: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/shipping/shipping-pricing", () => ({
  resolveShippingService: jest.fn(),
  calculateShippingQuote: jest.fn(),
}));

jest.mock("@/lib/utils/store-settings", () => ({
  getCODSettings: jest.fn(),
  getShippingSettings: jest.fn(),
  getTaxSettings: jest.fn(),
  getStoreSettings: jest.fn(),
}));

jest.mock("@/lib/services/discount-service", () => ({
  AutoDiscountService: {
    getNewUserDiscount: jest.fn(async () => null),
    compareDiscounts: jest.fn(() => null),
  },
}));

import {
  deriveInitialPaymentStatus,
  resolveCheckoutPricing,
} from "@/lib/checkout/authoritative-pricing";

const { db } = require("@/lib/db");
const {
  resolveShippingService,
  calculateShippingQuote,
} = require("@/lib/shipping/shipping-pricing");
const {
  getCODSettings,
  getShippingSettings,
  getTaxSettings,
  getStoreSettings,
} = require("@/lib/utils/store-settings");

describe("deriveInitialPaymentStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.book.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([]);
    db.coupon.findUnique.mockResolvedValue(null);
    getCODSettings.mockResolvedValue({
      percentage: "3",
      fixedFee: "5.00",
      active: true,
    });
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "15.00", active: true },
      freeThreshold: { price: "199.00", active: true },
      couriers: [],
    });
    getTaxSettings.mockResolvedValue({
      rate: "0",
      active: false,
      includeInPrice: true,
    });
    getStoreSettings.mockResolvedValue({
      weightUnit: "kg",
    });
  });

  it("keeps COD orders pending regardless of client input", () => {
    expect(
      deriveInitialPaymentStatus({
        isCODPayment: true,
        isNetopiaPayment: false,
        requiresOnlineAuthorization: false,
      })
    ).toBe("PENDING");
  });

  it("keeps Netopia orders pending until webhook confirmation", () => {
    expect(
      deriveInitialPaymentStatus({
        isCODPayment: false,
        isNetopiaPayment: true,
        requiresOnlineAuthorization: false,
      })
    ).toBe("PENDING");
  });

  it("marks zero-total orders as paid", () => {
    expect(
      deriveInitialPaymentStatus({
        isCODPayment: false,
        isNetopiaPayment: false,
        requiresOnlineAuthorization: false,
      })
    ).toBe("PAID");
  });

  it("uses catalog prices instead of forged client prices", async () => {
    db.book.findMany.mockResolvedValue([
      {
        id: "book_1",
        name: "Physics Book",
        price: 49.99,
      },
    ]);

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "book_1",
          quantity: 1,
          isBook: true,
          price: 0.01,
          name: "Forged book",
        },
      ],
      paymentMethod: "stripe_new",
    });

    expect(pricing.items[0]).toMatchObject({
      productId: "book_1",
      name: "Physics Book",
      price: 49.99,
    });
    expect(pricing.subtotal).toBe(49.99);
    expect(pricing.orderTotal).toBe(49.99);
  });
});


describe("curated Boribon checkout freshness", () => {
  it("rejects stale supplier stock before resolving payment totals", async () => {
    db.book.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([{ id: "boribon-test", supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14", metadata: { boribon: {} }, supplierProducts: [{ status: "MAPPED", lastSyncAt: new Date(0) }] }]);
    await expect(resolveCheckoutPricing({ userId: "user", items: [{ productId: "boribon-test", quantity: 1 }] })).rejects.toMatchObject({ code: "SUPPLIER_STOCK_UNAVAILABLE", status: 503 });
  });
});

describe("COD guarantee admin-driven pricing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.book.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([
      {
        id: "product_1",
        name: "Test Product",
        price: 100.0,
        weight: 1.0,
        dimensions: null,
        supplierId: "supplier_1",
        metadata: null,
        stockQuantity: 10,
        supplierProducts: [],
        supplier: {
          id: "supplier_1",
          name: "Test Supplier",
          companyName: "Test Supplier Co",
        },
      },
    ]);
    db.coupon.findUnique.mockResolvedValue(null);
    getCODSettings.mockResolvedValue({
      percentage: "3",
      fixedFee: "5.00",
      active: true,
    });
    getTaxSettings.mockResolvedValue({
      rate: "0",
      active: false,
      includeInPrice: true,
    });
    getStoreSettings.mockResolvedValue({
      weightUnit: "kg",
    });
    resolveShippingService.mockReturnValue({
      id: "standard",
      name: "Standard",
      mode: "standard",
    });
    calculateShippingQuote.mockReturnValue({
      basePrice: 25,
      totalPrice: 25,
      pricingVersion: "v1",
    });
  });

  it("uses admin deliveryPrice for COD guarantee when free shipping applies", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "19.99", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 6,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.subtotal).toBe(600.0);
    expect(pricing.finalShippingCost).toBe(0);
    expect(pricing.codGuaranteeAmount).toBe(19.99);
    expect(pricing.codGuaranteeConfigError).toBe(false);
  });

  it("uses updated admin deliveryPrice when changed from 19.99 to 22.50", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "22.50", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(22.5);
    expect(pricing.codGuaranteeConfigError).toBe(false);
  });

  it("sets codGuaranteeAmount to null and flags config error when deliveryPrice is missing", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(null);
    expect(pricing.codGuaranteeConfigError).toBe(true);
  });

  it("sets codGuaranteeAmount to null and flags config error when deliveryPrice is inactive", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "19.99", active: false },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(null);
    expect(pricing.codGuaranteeConfigError).toBe(true);
  });

  it("sets codGuaranteeAmount to null and flags config error when deliveryPrice is non-numeric", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "abc", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(null);
    expect(pricing.codGuaranteeConfigError).toBe(true);
  });

  it("sets codGuaranteeAmount to null and flags config error when deliveryPrice is zero", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "0", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(null);
    expect(pricing.codGuaranteeConfigError).toBe(true);
  });

  it("uses service priceOverride instead of deliveryPrice when available", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "19.99", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
              priceOverride: 25.0,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(25.0);
    expect(pricing.codGuaranteeConfigError).toBe(false);
  });

  it("sets codGuaranteeAmount to 0 for digital-only orders with COD", async () => {
    db.book.findMany.mockResolvedValue([
      {
        id: "book_1",
        name: "Test Book",
        price: 50.0,
      },
    ]);
    db.product.findMany.mockResolvedValue([]);

    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "19.99", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "book_1",
          quantity: 1,
          isBook: true,
        },
      ],
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(0);
    expect(pricing.codGuaranteeConfigError).toBe(false);
  });

  it("uses deliveryPrice when priceOverride is 0", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "19.99", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
              priceOverride: "0",
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.finalShippingCost).toBe(0);
    expect(pricing.codGuaranteeAmount).toBe(19.99);
    expect(pricing.codGuaranteeConfigError).toBe(false);
  });

  it("uses priceOverride of 30 for hold when base is 25", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "19.99", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
              priceOverride: "30",
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(30);
    expect(pricing.finalShippingCost).toBe(30);
    expect(pricing.codGuaranteeConfigError).toBe(false);
  });

  it("charges quote when active deliveryPrice is 0", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "0", active: true },
      freeThreshold: { price: "500", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.finalShippingCost).toBe(0);
    expect(pricing.codGuaranteeAmount).toBe(null);
    expect(pricing.codGuaranteeConfigError).toBe(true);
  });

  // TODO: Re-enable when module mocking is fixed
  // it("picks up admin price change after cache invalidation", async () => {

  it("sets config error when shipping settings come from defaults", async () => {
    getShippingSettings.mockResolvedValue({
      deliveryPrice: { price: "15.00", active: true },
      freeThreshold: { price: "199.00", active: true },
      couriers: [
        {
          id: "fancourier",
          name: "FAN Courier",
          enabled: true,
          services: [
            {
              id: "standard",
              name: "Standard",
              enabled: true,
            },
          ],
        },
      ],
      __source: "default",
    });

    const pricing = await resolveCheckoutPricing({
      userId: "user_1",
      items: [
        {
          productId: "product_1",
          quantity: 1,
          isBook: false,
        },
      ],
      shippingMethodId: "fancourier:standard",
      paymentMethod: "cash_on_delivery",
    });

    expect(pricing.codGuaranteeAmount).toBe(null);
    expect(pricing.codGuaranteeConfigError).toBe(true);
  });
});
