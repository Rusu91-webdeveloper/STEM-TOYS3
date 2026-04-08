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
      update: jest.fn(),
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
const { validateCsrfForRequest } = require("@/lib/csrf");
const {
  resolveCheckoutPricing,
} = require("@/lib/checkout/authoritative-pricing");
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
    db.order.findUnique.mockResolvedValue({
      id: "ord_1",
      paymentStatus: "PENDING",
      items: [
        {
          id: "item_1",
          bookId: "book_1",
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
});
