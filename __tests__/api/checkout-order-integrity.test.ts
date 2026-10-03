/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { POST } from "@/app/api/checkout/order/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/csrf", () => ({
  validateCsrfForRequest: jest.fn(),
}));

jest.mock("@/lib/email/order-email-integration", () => ({
  sendOrderConfirmationImproved: jest.fn().mockResolvedValue({
    success: true,
  }),
  sendAdminNewOrderNotification: jest.fn().mockResolvedValue({
    success: true,
  }),
}));

jest.mock("@/lib/checkout/authoritative-pricing", () => ({
  CheckoutPricingError: class CheckoutPricingError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(
      code: string,
      message: string,
      status = 400,
      details?: Record<string, unknown>
    ) {
      super(message);
      this.code = code;
      this.status = status;
      this.details = details;
    }
  },
  deriveInitialPaymentStatus: jest.fn(
    ({ isCODPayment, isNetopiaPayment, requiresOnlineAuthorization }) =>
      isCODPayment || isNetopiaPayment || requiresOnlineAuthorization
        ? "PENDING"
        : "PAID"
  ),
  resolveCheckoutPricing: jest.fn(),
}));

jest.mock("@/lib/checkout/admin-order-notifications", () => ({
  shouldSendImmediateAdminOrderNotification: jest.fn(() => false),
}));

jest.mock("@/lib/checkout/cod-guarantee-policy", () => ({
  evaluateCodGuaranteePolicy: jest.fn(() => ({ required: false, reasons: [] })),
  isLockerShippingMethodId: jest.fn(() => false),
}));

jest.mock("@/lib/checkout/cod-guarantee-risk", () => ({
  getCodGuaranteeUserStats: jest.fn(() => ({
    priorOrderCount: 0,
    priorCodRtoCount: 0,
  })),
  resolveCodGuaranteeCustomerStats: jest.fn(async () => ({
    priorOrderCount: 0,
    priorCodRtoCount: 0,
  })),
}));

jest.mock("@/lib/email/admin-notification-service", () => ({
  AdminNotificationService: {
    sendNewOrderNotification: jest.fn(),
    sendOrderIssueNotification: jest.fn(),
    sendLowStockAlert: jest.fn(),
  },
}));

jest.mock("@/lib/email/database-template-service", () => ({
  DatabaseTemplateService: {
    sendOrderConfirmationEmail: jest.fn(async () => ({ success: true })),
  },
}));

jest.mock("@/lib/shipping/cod-thresholds", () => ({
  getCodThreshold: jest.fn(() => 500),
  getRecipientType: jest.fn(() => "individual"),
}));

jest.mock("@/lib/shipping/declared-value", () => ({
  calculateDeclaredValue: jest.fn(() => ({
    declaredValue: null,
    reason: "n/a",
  })),
  getInsuranceThreshold: jest.fn(async () => 500),
}));

jest.mock("@/lib/stripe-config", () => ({
  getStripeApiVersion: jest.fn(() => "2025-06-30.basil"),
  getStripeCurrency: jest.fn(() => "ron"),
}));

jest.mock("stripe", () => {
  const paymentIntents = {
    retrieve: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    cancel: jest.fn(),
    capture: jest.fn(),
  };
  const StripeMock = jest.fn().mockImplementation(() => ({ paymentIntents }));
  return Object.assign(StripeMock, { paymentIntents });
});

jest.mock("@/lib/utils/order-processing", () => ({
  shouldAutoFulfillOrder: jest.fn(() => false),
  calculateProcessingTime: jest.fn(() => 24),
  shouldHoldForReview: jest.fn(() => false),
  isSignatureRequired: jest.fn(() => false),
  getWarehouseLocation: jest.fn(() => "main"),
  getPackagingNotes: jest.fn(() => ""),
  isQualityCheckRequired: jest.fn(() => false),
  shouldAlertHighValueOrder: jest.fn(() => false),
  getNotificationSettings: jest.fn(() => ({
    orderConfirmation: true,
    adminAlerts: {
      highValueOrders: false,
      outOfStockItems: false,
    },
  })),
}));

jest.mock("@/lib/db", () => ({
  db: {
    address: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    supplierOrder: {
      count: jest.fn(),
    },
    shipment: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const { auth } = require("@/lib/auth");
const {
  resolveCheckoutPricing,
} = require("@/lib/checkout/authoritative-pricing");
const { validateCsrfForRequest } = require("@/lib/csrf");
const { db } = require("@/lib/db");

describe("POST /api/checkout/order integrity", () => {
  let txOrderCreate: jest.Mock;
  let txBookFindUnique: jest.Mock;
  let txProductFindUnique: jest.Mock;
  let txProductUpdateMany: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    auth.mockResolvedValue({
      user: {
        id: "user_1",
        email: "buyer@example.com",
        role: "USER",
        name: "Buyer",
      },
    });
    validateCsrfForRequest.mockResolvedValue({ valid: true });

    db.address.findFirst.mockResolvedValue(null);
    db.address.create.mockResolvedValue({ id: "addr_1" });
    db.order.findFirst.mockResolvedValue(null);
    db.order.findUnique.mockResolvedValue({
      id: "ord_1",
      paymentStatus: "PENDING",
      items: [
        {
          id: "item_1",
          bookId: "book_1",
          productId: null,
          name: "Server Book",
          price: 99,
          quantity: 1,
          isDigital: true,
        },
      ],
    });
    db.product.findMany.mockResolvedValue([]);
    txOrderCreate = jest.fn(async ({ data }) => ({
      id: "ord_1",
      orderNumber: data.orderNumber,
      paymentStatus: data.paymentStatus,
    }));
    txBookFindUnique = jest.fn(async () => ({
      id: "book_1",
      name: "Server Book",
      isActive: true,
    }));
    txProductFindUnique = jest.fn();
    txProductUpdateMany = jest.fn();
    db.$transaction.mockImplementation(async (callback: any) =>
      callback({
        order: {
          create: txOrderCreate,
          update: jest.fn(),
        },
        couponUsage: {
          create: jest.fn(),
        },
        coupon: {
          update: jest.fn(),
        },
        book: {
          findUnique: txBookFindUnique,
        },
        product: {
          findUnique: txProductFindUnique,
          updateMany: txProductUpdateMany,
        },
        orderItem: {
          create: jest.fn(async ({ data }) => ({
            id: "item_1",
            ...data,
          })),
        },
      })
    );
  });

  it("ignores forged client paymentStatus for netopia orders", async () => {
    resolveCheckoutPricing.mockResolvedValue({
      items: [
        {
          productId: "book_1",
          name: "Server Book",
          price: 99,
          quantity: 1,
          isBook: true,
        },
      ],
      subtotal: 99,
      tax: 0,
      taxRatePercentage: "0",
      includeInPrice: true,
      finalShippingCost: 0,
      shippingBasePrice: 0,
      shippingTotalEstimate: 0,
      pricingVersion: null,
      discountAmount: 0,
      appliedCoupon: null,
      codFee: 0,
      orderTotal: 99,
      codGuaranteeAmount: 0,
      isDigitalOnlyOrder: true,
      supplierCartAnalysis: {
        isMixedSupplierCart: false,
        supplierCount: 0,
        supplierNames: [],
        fulfillmentSourceIds: [],
        requiresPrepaid: false,
        mixedSupplierExtraShipments: 0,
      },
      products: [],
    });

    const request = new NextRequest("http://localhost/api/checkout/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        shippingAddress: {
          fullName: "Buyer",
          addressLine1: "Street 1",
          city: "Bucharest",
          state: "B",
          postalCode: "010101",
          country: "RO",
          phone: "+40700000000",
        },
        items: [
          {
            productId: "book_1",
            name: "Forged Name",
            price: 0.01,
            quantity: 1,
            isBook: true,
          },
        ],
        paymentMethod: "netopia_card",
        paymentProvider: "netopia",
        paymentStatus: "PAID",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.analytics).toMatchObject({
      transaction_id: "ord_1",
      value: 99,
      payment_status: "PENDING",
      payment_method: "netopia",
      items: [
        { item_id: "book_1", item_name: "Server Book", price: 99, quantity: 1 },
      ],
    });
    expect(JSON.stringify(payload.analytics)).not.toContain(
      "buyer@example.com"
    );
    expect(JSON.stringify(payload.analytics)).not.toContain("Forged Name");
    expect(txOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentStatus: "PENDING",
        }),
      })
    );
    expect(txBookFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "book_1" },
      })
    );
  });

  it("fails cleanly when stock is lost during transactional reservation", async () => {
    db.product.findMany.mockResolvedValue([
      {
        id: "prod_1",
        name: "Robot Kit",
        stockQuantity: 1,
      },
    ]);

    txProductFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "prod_1",
        name: "Robot Kit",
        isActive: true,
        stockQuantity: 1,
      })
      .mockResolvedValueOnce({
        id: "prod_1",
        name: "Robot Kit",
        isActive: true,
        stockQuantity: 0,
      });
    txProductUpdateMany = jest.fn(async () => ({ count: 0 }));

    db.$transaction.mockImplementationOnce(async (callback: any) =>
      callback({
        order: {
          create: jest.fn(async ({ data }) => ({
            id: "ord_2",
            orderNumber: data.orderNumber,
            paymentStatus: data.paymentStatus,
          })),
          update: jest.fn(),
        },
        couponUsage: {
          create: jest.fn(),
        },
        coupon: {
          update: jest.fn(),
        },
        book: {
          findUnique: jest.fn(),
        },
        product: {
          findUnique: txProductFindUnique,
          updateMany: txProductUpdateMany,
        },
        orderItem: {
          create: jest.fn(),
        },
      })
    );

    resolveCheckoutPricing.mockResolvedValue({
      items: [
        {
          productId: "prod_1",
          name: "Robot Kit",
          price: 199,
          quantity: 1,
          isBook: false,
        },
      ],
      subtotal: 199,
      tax: 0,
      taxRatePercentage: "0",
      includeInPrice: true,
      finalShippingCost: 15,
      shippingBasePrice: 15,
      shippingTotalEstimate: 15,
      pricingVersion: "v1",
      discountAmount: 0,
      appliedCoupon: null,
      codFee: 0,
      orderTotal: 214,
      codGuaranteeAmount: 0,
      isDigitalOnlyOrder: false,
      supplierCartAnalysis: {
        isMixedSupplierCart: false,
        supplierCount: 1,
        supplierNames: ["Internal stock"],
        fulfillmentSourceIds: ["__INTERNAL__"],
        requiresPrepaid: false,
        mixedSupplierExtraShipments: 0,
      },
      products: [],
    });

    const request = new NextRequest("http://localhost/api/checkout/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        shippingAddress: {
          fullName: "Buyer",
          addressLine1: "Street 1",
          city: "Bucharest",
          state: "B",
          postalCode: "010101",
          country: "RO",
          phone: "+40700000000",
        },
        shippingMethod: {
          id: "fancourier:home",
          price: 15,
        },
        items: [
          {
            productId: "prod_1",
            name: "Robot Kit",
            price: 1,
            quantity: 1,
          },
        ],
        paymentMethod: "netopia_card",
        paymentProvider: "netopia",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe("INSUFFICIENT_STOCK");
    expect(payload.details).toMatchObject({
      productName: "Robot Kit",
      requested: 1,
      available: 0,
    });
    expect(txProductUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "prod_1",
        }),
      })
    );
  });

  it("accepts a guest COD order and emails the guest address", async () => {
    const {
      COD_CONSENT_TEXT,
      COD_CONSENT_VERSION,
    } = require("@/lib/checkout/cod-consent");
    const {
      sendOrderConfirmationImproved,
    } = require("@/lib/email/order-email-integration");

    auth.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({
      id: "guest_1",
      email: "guest@example.com",
      name: "Ana Pop",
      role: "CUSTOMER",
    });
    resolveCheckoutPricing.mockResolvedValue({
      items: [
        {
          productId: "book_1",
          name: "Server Book",
          price: 99,
          quantity: 1,
          isBook: true,
        },
      ],
      subtotal: 99,
      tax: 0,
      taxRatePercentage: "0",
      includeInPrice: true,
      finalShippingCost: 19.99,
      shippingBasePrice: 19.99,
      shippingTotalEstimate: 19.99,
      pricingVersion: null,
      discountAmount: 0,
      appliedCoupon: null,
      codFee: 0,
      orderTotal: 118.99,
      codGuaranteeAmount: 0,
      isDigitalOnlyOrder: true,
      supplierCartAnalysis: {
        isMixedSupplierCart: false,
        supplierCount: 0,
        supplierNames: [],
        fulfillmentSourceIds: [],
        requiresPrepaid: false,
        mixedSupplierExtraShipments: 0,
      },
      products: [],
    });

    const request = new NextRequest("http://localhost/api/checkout/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        guestEmail: "Guest@Example.com",
        shippingAddress: {
          fullName: "Ana Pop",
          addressLine1: "Strada Florilor 12",
          city: "Cluj-Napoca",
          state: "CJ",
          postalCode: "400001",
          country: "RO",
          phone: "0712345678",
          email: "Guest@Example.com",
        },
        shippingMethod: {
          id: "fancourier:standard",
          name: "FanCourier Standard",
          price: 19.99,
        },
        items: [
          {
            productId: "book_1",
            name: "Server Book",
            price: 99,
            quantity: 1,
            isBook: true,
          },
        ],
        paymentMethod: "cash_on_delivery",
        paymentProvider: "cod",
        codConsentAccepted: true,
        codConsentAcceptedAt: "2026-09-27T10:00:00.000Z",
        codConsentVersion: COD_CONSENT_VERSION,
        codConsentText: COD_CONSENT_TEXT,
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "guest@example.com",
          isActive: false,
        }),
      })
    );
    expect(txOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "guest_1",
          paymentMethod: "cash_on_delivery",
          paymentStatus: "PENDING",
        }),
      })
    );
    expect(sendOrderConfirmationImproved).toHaveBeenCalledWith("ord_1");
    const createOrder = db.user.create.mock.invocationCallOrder[0];
    const priceOrder = resolveCheckoutPricing.mock.invocationCallOrder[0];
    expect(priceOrder).toBeLessThan(createOrder);
  });

  it("does not create a guest user when price or stock validation fails", async () => {
    const {
      CheckoutPricingError,
    } = require("@/lib/checkout/authoritative-pricing");
    const {
      COD_CONSENT_TEXT,
      COD_CONSENT_VERSION,
    } = require("@/lib/checkout/cod-consent");

    auth.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);
    resolveCheckoutPricing.mockRejectedValue(
      new CheckoutPricingError("PRODUCT_NOT_FOUND", "Missing product", 400)
    );

    const request = new NextRequest("http://localhost/api/checkout/order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.77",
      },
      body: JSON.stringify({
        guestEmail: "guest@example.com",
        shippingAddress: {
          fullName: "Ana Pop",
          addressLine1: "Strada Florilor 12",
          city: "Cluj-Napoca",
          state: "CJ",
          postalCode: "400001",
          country: "RO",
          phone: "0712345678",
        },
        items: [
          {
            productId: "missing",
            name: "Missing",
            price: 10,
            quantity: 1,
          },
        ],
        paymentMethod: "cash_on_delivery",
        paymentProvider: "cod",
        codConsentAccepted: true,
        codConsentAcceptedAt: "2026-09-27T10:00:00.000Z",
        codConsentVersion: COD_CONSENT_VERSION,
        codConsentText: COD_CONSENT_TEXT,
      }),
    });

    const response = await POST(request);
    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.error).toBe("PRODUCT_NOT_FOUND");
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("still places the guest order when the confirmation email throws", async () => {
    const {
      COD_CONSENT_TEXT,
      COD_CONSENT_VERSION,
    } = require("@/lib/checkout/cod-consent");
    const {
      sendOrderConfirmationImproved,
    } = require("@/lib/email/order-email-integration");

    auth.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue({
      id: "guest_existing",
      email: "parent@example.com",
      name: "Parent",
      role: "CUSTOMER",
    });
    sendOrderConfirmationImproved.mockRejectedValueOnce(new Error("smtp down"));
    resolveCheckoutPricing.mockResolvedValue({
      items: [
        {
          productId: "book_1",
          name: "Server Book",
          price: 99,
          quantity: 1,
          isBook: true,
        },
      ],
      subtotal: 99,
      tax: 0,
      taxRatePercentage: "0",
      includeInPrice: true,
      finalShippingCost: 0,
      shippingBasePrice: 0,
      shippingTotalEstimate: 0,
      pricingVersion: null,
      discountAmount: 0,
      appliedCoupon: null,
      codFee: 0,
      orderTotal: 99,
      codGuaranteeAmount: 0,
      isDigitalOnlyOrder: true,
      supplierCartAnalysis: {
        isMixedSupplierCart: false,
        supplierCount: 0,
        supplierNames: [],
        fulfillmentSourceIds: [],
        requiresPrepaid: false,
        mixedSupplierExtraShipments: 0,
      },
      products: [],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/checkout/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestEmail: "parent@example.com",
          shippingAddress: {
            fullName: "Parent",
            addressLine1: "Strada Florilor 12",
            city: "Cluj-Napoca",
            state: "CJ",
            postalCode: "400001",
            country: "RO",
            phone: "0712345678",
          },
          items: [
            {
              productId: "book_1",
              name: "Server Book",
              price: 99,
              quantity: 1,
              isBook: true,
            },
          ],
          paymentMethod: "cash_on_delivery",
          paymentProvider: "cod",
          codConsentAccepted: true,
          codConsentAcceptedAt: "2026-09-27T10:00:00.000Z",
          codConsentVersion: COD_CONSENT_VERSION,
          codConsentText: COD_CONSENT_TEXT,
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(db.user.create).not.toHaveBeenCalled();
    expect(txOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "guest_existing",
        }),
      })
    );
  });

  describe("guest home COD guarantee policy", () => {
    const previousMode = process.env.COD_GUARANTEE_MODE;

    function useRealCodPolicy() {
      const policy = require("@/lib/checkout/cod-guarantee-policy");
      const actual = jest.requireActual("@/lib/checkout/cod-guarantee-policy");
      process.env.COD_GUARANTEE_MODE = "risk_based";
      policy.evaluateCodGuaranteePolicy.mockImplementation(
        actual.evaluateCodGuaranteePolicy
      );
    }

    function restorePolicyMock() {
      const policy = require("@/lib/checkout/cod-guarantee-policy");
      policy.evaluateCodGuaranteePolicy.mockImplementation(() => ({
        required: false,
        reasons: [],
      }));
      if (previousMode === undefined) {
        delete process.env.COD_GUARANTEE_MODE;
      } else {
        process.env.COD_GUARANTEE_MODE = previousMode;
      }
    }

    function price(orderTotal: number) {
      return {
        items: [
          {
            productId: "book_1",
            name: "Server Book",
            price: orderTotal,
            quantity: 1,
            isBook: true,
          },
        ],
        subtotal: orderTotal,
        tax: 0,
        taxRatePercentage: "0",
        includeInPrice: true,
        finalShippingCost: 19.99,
        shippingBasePrice: 19.99,
        shippingTotalEstimate: 19.99,
        pricingVersion: null,
        discountAmount: 0,
        appliedCoupon: null,
        codFee: 0,
        orderTotal,
        codGuaranteeAmount: 19.99,
        isDigitalOnlyOrder: true,
        supplierCartAnalysis: {
          isMixedSupplierCart: false,
          supplierCount: 0,
          supplierNames: [],
          fulfillmentSourceIds: [],
          requiresPrepaid: false,
          mixedSupplierExtraShipments: 0,
        },
        products: [],
      };
    }

    let guestRequestCount = 0;

    function guestCodRequest(
      orderTotal: number,
      extra: Record<string, unknown> = {}
    ) {
      guestRequestCount += 1;
      const {
        COD_CONSENT_TEXT,
        COD_CONSENT_VERSION,
      } = require("@/lib/checkout/cod-consent");
      return new NextRequest("http://localhost/api/checkout/order", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `203.0.113.${guestRequestCount}`,
        },
        body: JSON.stringify({
          guestEmail: "Guest@Example.com",
          shippingAddress: {
            fullName: "Ana Pop",
            addressLine1: "Strada Florilor 12",
            city: "Cluj-Napoca",
            state: "CJ",
            postalCode: "400001",
            country: "RO",
            phone: "0712345678",
            email: "Guest@Example.com",
          },
          shippingMethod: {
            id: "fancourier:standard",
            name: "FanCourier Standard",
            price: 19.99,
          },
          items: [
            {
              productId: "book_1",
              name: "Server Book",
              price: orderTotal,
              quantity: 1,
              isBook: true,
            },
          ],
          paymentMethod: "cash_on_delivery",
          paymentProvider: "cod",
          codConsentAccepted: true,
          codConsentAcceptedAt: "2026-09-27T10:00:00.000Z",
          codConsentVersion: COD_CONSENT_VERSION,
          codConsentText: COD_CONSENT_TEXT,
          ...extra,
        }),
      });
    }

    beforeEach(() => {
      useRealCodPolicy();
      auth.mockResolvedValue(null);
      db.user.findUnique.mockResolvedValue(null);
      db.user.create.mockResolvedValue({
        id: "guest_1",
        email: "guest@example.com",
        name: "Ana Pop",
        role: "CUSTOMER",
      });
    });

    afterEach(() => {
      restorePolicyMock();
      delete process.env.STRIPE_SECRET_KEY;
    });

    it("requires a guarantee for a new guest under 200 lei", async () => {
      resolveCheckoutPricing.mockResolvedValue(price(199));

      const response = await POST(guestCodRequest(199));
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toBe("COD_GUARANTEE_REQUIRED");
      expect(txOrderCreate).not.toHaveBeenCalled();
    });

    it("requires a guarantee for a new guest at 200 lei", async () => {
      resolveCheckoutPricing.mockResolvedValue(price(200));

      const response = await POST(guestCodRequest(200));
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toBe("COD_GUARANTEE_REQUIRED");
      expect(txOrderCreate).not.toHaveBeenCalled();
    });

    it("passes the checkout phone into the same stats function for guests", async () => {
      const stats = require("@/lib/checkout/cod-guarantee-risk");
      resolveCheckoutPricing.mockResolvedValue(price(120));

      await POST(guestCodRequest(120));

      expect(stats.resolveCodGuaranteeCustomerStats).toHaveBeenCalledWith({
        userId: undefined,
        guestEmail: "Guest@Example.com",
        phone: "0712345678",
      });
    });

    it("rejects a small home COD order that skips authorization", async () => {
      resolveCheckoutPricing.mockResolvedValue(price(120));

      const response = await POST(guestCodRequest(120));
      const payload = await response.json();
      const policy = require("@/lib/checkout/cod-guarantee-policy");

      expect(response.status).toBe(400);
      expect(payload.error).toBe("COD_GUARANTEE_REQUIRED");
      expect(policy.evaluateCodGuaranteePolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderTotal: 120,
          isLockerDelivery: false,
          priorOrderCount: 0,
          priorCodRtoCount: 0,
        })
      );
      expect(txOrderCreate).not.toHaveBeenCalled();
    });

    it("requires a guarantee above the new-customer threshold and accepts a matching guest intent", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      resolveCheckoutPricing.mockResolvedValue(price(420));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_guest_guarantee",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "guest@example.com",
          paymentFlow: "cod_guarantee",
        },
      });

      const rejected = await POST(guestCodRequest(420));
      const rejectedPayload = await rejected.json();
      expect(rejected.status).toBe(400);
      expect(rejectedPayload.error).toBe("COD_GUARANTEE_REQUIRED");
      expect(db.user.create).not.toHaveBeenCalled();

      db.user.create.mockClear();
      const accepted = await POST(
        guestCodRequest(420, {
          codGuaranteePaymentIntentId: "pi_guest_guarantee",
          codGuaranteeAmount: 19.99,
        })
      );
      const acceptedPayload = await accepted.json();

      expect(accepted.status).toBe(200);
      expect(acceptedPayload.success).toBe(true);
      expect(Stripe.paymentIntents.retrieve).toHaveBeenCalledWith(
        "pi_guest_guarantee"
      );
      expect(txOrderCreate).toHaveBeenCalled();
      expect(Stripe.paymentIntents.update).toHaveBeenCalledWith(
        "pi_guest_guarantee",
        expect.objectContaining({
          metadata: expect.objectContaining({ orderId: "ord_1" }),
        })
      );
    });

    it.each(["requires_payment_method", "processing", "canceled", "succeeded"])(
      "rejects a low-value COD guarantee with status %s",
      async status => {
        const Stripe = require("stripe");
        process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
        resolveCheckoutPricing.mockResolvedValue(price(120));
        Stripe.paymentIntents.retrieve.mockResolvedValue({
          id: "pi_not_held",
          amount: 1999,
          currency: "ron",
          status,
          metadata: {
            guestEmail: "guest@example.com",
            paymentFlow: "cod_guarantee",
          },
        });
        const response = await POST(
          guestCodRequest(120, {
            codGuaranteePaymentIntentId: "pi_not_held",
            codGuaranteeAmount: 19.99,
          })
        );
        expect(response.status).toBe(400);
        expect((await response.json()).error).toBe(
          "COD_GUARANTEE_INTENT_INVALID"
        );
        expect(txOrderCreate).not.toHaveBeenCalled();
        expect(Stripe.paymentIntents.capture).not.toHaveBeenCalled();
      }
    );

    it("requires authorization for a returning signed-in customer below 200 lei", async () => {
      auth.mockResolvedValue({
        user: { id: "user_1", email: "buyer@example.com" },
      });
      const stats = require("@/lib/checkout/cod-guarantee-risk");
      stats.resolveCodGuaranteeCustomerStats.mockResolvedValueOnce({
        priorOrderCount: 4,
        priorCodRtoCount: 0,
      });
      resolveCheckoutPricing.mockResolvedValue(price(120));
      const request = guestCodRequest(120);
      const response = await POST(request);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("COD_GUARANTEE_REQUIRED");
      expect(txOrderCreate).not.toHaveBeenCalled();
      expect(validateCsrfForRequest).toHaveBeenCalledWith(
        request,
        expect.any(Object)
      );
    });

    it("rejects a guest guarantee issued for a different email", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      resolveCheckoutPricing.mockResolvedValue(price(420));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_other",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "other@example.com",
          paymentFlow: "cod_guarantee",
        },
      });

      const response = await POST(
        guestCodRequest(420, {
          codGuaranteePaymentIntentId: "pi_other",
          codGuaranteeAmount: 19.99,
        })
      );
      const payload = await response.json();

      expect(response.status).toBe(403);
      expect(payload.error).toBe("COD_GUARANTEE_EMAIL_MISMATCH");
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("rejects another guest's low-value guarantee without cancellation", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      resolveCheckoutPricing.mockResolvedValue(price(120));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_other",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "other@example.com",
          paymentFlow: "cod_guarantee",
        },
      });

      const response = await POST(
        guestCodRequest(120, {
          codGuaranteePaymentIntentId: "pi_other",
          codGuaranteeAmount: 19.99,
        })
      );

      expect(response.status).toBe(403);
      expect((await response.json()).error).toBe(
        "COD_GUARANTEE_EMAIL_MISMATCH"
      );
      expect(txOrderCreate).not.toHaveBeenCalled();
      expect(Stripe.paymentIntents.cancel).not.toHaveBeenCalled();
    });

    it("retains a matching low-value guarantee for shipping protection", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      resolveCheckoutPricing.mockResolvedValue(price(120));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_own",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "guest@example.com",
          paymentFlow: "cod_guarantee",
        },
      });

      const response = await POST(
        guestCodRequest(120, {
          codGuaranteePaymentIntentId: "pi_own",
          codGuaranteeAmount: 19.99,
        })
      );

      expect(response.status).toBe(200);
      expect(Stripe.paymentIntents.cancel).not.toHaveBeenCalled();
      expect(txOrderCreate).toHaveBeenCalled();
    });

    it("rejects a low-value guarantee already attached to an order", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      resolveCheckoutPricing.mockResolvedValue(price(120));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_used",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "guest@example.com",
          paymentFlow: "cod_guarantee",
          orderId: "ord_previous",
        },
      });

      const response = await POST(
        guestCodRequest(120, {
          codGuaranteePaymentIntentId: "pi_used",
          codGuaranteeAmount: 19.99,
        })
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("COD_GUARANTEE_INTENT_REUSED");
      expect(txOrderCreate).not.toHaveBeenCalled();
      expect(Stripe.paymentIntents.cancel).not.toHaveBeenCalled();
    });

    it("rejects a guarantee intent whose metadata already has an order id", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      resolveCheckoutPricing.mockResolvedValue(price(420));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_used",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "guest@example.com",
          paymentFlow: "cod_guarantee",
          orderId: "ord_previous",
        },
      });

      const response = await POST(
        guestCodRequest(420, {
          codGuaranteePaymentIntentId: "pi_used",
          codGuaranteeAmount: 19.99,
        })
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toBe("COD_GUARANTEE_INTENT_REUSED");
      expect(txOrderCreate).not.toHaveBeenCalled();
    });

    it("rejects a guarantee intent already attached to an order", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      resolveCheckoutPricing.mockResolvedValue(price(420));
      db.order.findFirst.mockResolvedValue({ id: "ord_existing" });
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_attached",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "guest@example.com",
          paymentFlow: "cod_guarantee",
        },
      });

      const response = await POST(
        guestCodRequest(420, {
          codGuaranteePaymentIntentId: "pi_attached",
          codGuaranteeAmount: 19.99,
        })
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toBe("COD_GUARANTEE_INTENT_REUSED");
      expect(txOrderCreate).not.toHaveBeenCalled();
      expect(db.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { stripePaymentIntentId: "pi_attached" },
              { notes: { contains: "pi_attached" } },
            ]),
          }),
        })
      );
    });

    it("rejects a logged-in guarantee intent owned by another user", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      auth.mockResolvedValue({
        user: {
          id: "user_1",
          email: "buyer@example.com",
          role: "USER",
          name: "Buyer",
        },
      });
      resolveCheckoutPricing.mockResolvedValue(price(420));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_other_user",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: { userId: "user_other", paymentFlow: "cod_guarantee" },
      });

      const response = await POST(
        guestCodRequest(420, {
          codGuaranteePaymentIntentId: "pi_other_user",
          codGuaranteeAmount: 19.99,
        })
      );
      const payload = await response.json();

      expect(response.status).toBe(403);
      expect(payload.error).toBe("PAYMENT_INTENT_USER_MISMATCH");
      expect(txOrderCreate).not.toHaveBeenCalled();
      expect(Stripe.paymentIntents.cancel).not.toHaveBeenCalled();
    });

    it("accepts a logged-in guarantee intent owned by the session user", async () => {
      const Stripe = require("stripe");
      process.env.STRIPE_SECRET_KEY = "sk_test_guest_cod";
      auth.mockResolvedValue({
        user: {
          id: "user_1",
          email: "buyer@example.com",
          role: "USER",
          name: "Buyer",
        },
      });
      resolveCheckoutPricing.mockResolvedValue(price(420));
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_user_guarantee",
        amount: 1999,
        currency: "ron",
        status: "requires_capture",
        metadata: { userId: "user_1", paymentFlow: "cod_guarantee" },
      });

      const response = await POST(
        guestCodRequest(420, {
          codGuaranteePaymentIntentId: "pi_user_guarantee",
          codGuaranteeAmount: 19.99,
        })
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(Stripe.paymentIntents.update).toHaveBeenCalledWith(
        "pi_user_guarantee",
        expect.objectContaining({
          metadata: expect.objectContaining({ orderId: "ord_1" }),
        })
      );
    });

    it("keeps logged-in COD scoring on the session user", async () => {
      const stats = require("@/lib/checkout/cod-guarantee-risk");
      auth.mockResolvedValue({
        user: {
          id: "user_1",
          email: "buyer@example.com",
          role: "USER",
          name: "Buyer",
        },
      });
      resolveCheckoutPricing.mockResolvedValue(price(120));

      const response = await POST(guestCodRequest(120));

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("COD_GUARANTEE_REQUIRED");
      expect(stats.resolveCodGuaranteeCustomerStats).toHaveBeenCalledWith({
        userId: "user_1",
        guestEmail: null,
        phone: "0712345678",
      });
    });

    it("rejects COD order with mismatched guarantee amount", async () => {
      const Stripe = require("stripe");
      const policy = require("@/lib/checkout/cod-guarantee-policy");
      const codThresholds = require("@/lib/shipping/cod-thresholds");

      policy.evaluateCodGuaranteePolicy.mockImplementation(() => ({
        required: true,
        reasons: ["high_order_value"],
        mode: "risk_based",
        thresholds: {
          highOrderValue: 500,
          newCustomerMinTotal: 200,
          b2bMinTotal: 700,
          codRtoCount: 1,
        },
      }));

      codThresholds.getCodThreshold.mockReturnValue(1000);

      resolveCheckoutPricing.mockResolvedValue({
        ...price(520),
        codGuaranteeAmount: 19.99,
      });

      process.env.STRIPE_SECRET_KEY = "sk_test_123";
      Stripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_guarantee_mismatch",
        amount: 2500,
        currency: "ron",
        status: "requires_capture",
        metadata: {
          guestEmail: "guest@example.com",
          paymentFlow: "cod_guarantee",
        },
      });

      const response = await POST(
        guestCodRequest(520, {
          codGuaranteePaymentIntentId: "pi_guarantee_mismatch",
          codGuaranteeAmount: 25.0,
        })
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe("COD_GUARANTEE_AMOUNT_MISMATCH");
      expect(payload.details).toMatchObject({
        expectedAmount: 19.99,
        providedAmount: 25.0,
      });
    });

    it("blocks COD order when guarantee required and price missing", async () => {
      const policy = require("@/lib/checkout/cod-guarantee-policy");
      const codThresholds = require("@/lib/shipping/cod-thresholds");

      policy.evaluateCodGuaranteePolicy.mockImplementation(() => ({
        required: true,
        reasons: ["high_order_value"],
        mode: "risk_based",
        thresholds: {
          highOrderValue: 500,
          newCustomerMinTotal: 200,
          b2bMinTotal: 700,
          codRtoCount: 1,
        },
      }));

      codThresholds.getCodThreshold.mockReturnValue(1000);

      resolveCheckoutPricing.mockResolvedValue({
        ...price(520),
        codGuaranteeAmount: null,
        codGuaranteeConfigError: true,
      });

      const response = await POST(guestCodRequest(520));
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.error).toBe("COD_GUARANTEE_PRICE_NOT_CONFIGURED");
      expect(payload.message).toContain("Momentan nu putem autoriza garanția");
    });

    it("allows COD order without guarantee despite config error", async () => {
      const policy = require("@/lib/checkout/cod-guarantee-policy");
      policy.evaluateCodGuaranteePolicy.mockImplementation(() => ({
        required: false,
        reasons: [],
        mode: "risk_based",
        thresholds: {
          highOrderValue: 500,
          newCustomerMinTotal: 200,
          b2bMinTotal: 700,
          codRtoCount: 1,
        },
      }));

      resolveCheckoutPricing.mockResolvedValue({
        ...price(150),
        codGuaranteeAmount: null,
        codGuaranteeConfigError: true,
      });

      const response = await POST(guestCodRequest(150));
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(txOrderCreate).toHaveBeenCalled();
    });
  });
});
