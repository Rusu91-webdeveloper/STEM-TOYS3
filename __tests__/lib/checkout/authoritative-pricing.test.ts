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

jest.mock("@/lib/utils/store-settings", () => ({
  getCODSettings: jest.fn(),
  getShippingSettings: jest.fn(),
  getTaxSettings: jest.fn(),
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
  getCODSettings,
  getShippingSettings,
  getTaxSettings,
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
