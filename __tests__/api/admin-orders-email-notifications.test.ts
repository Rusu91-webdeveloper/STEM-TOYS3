import { NextRequest } from "next/server";

// Mock the email template
jest.mock("@/lib/email/order-templates", () => ({
  sendOrderCancellationEmail: jest.fn().mockResolvedValue(undefined),
  sendOrderCompletedEmail: jest.fn().mockResolvedValue(undefined),
}));

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn().mockResolvedValue({
    user: {
      id: "admin-user-id",
      email: "admin@techtots.com",
      role: "ADMIN",
    },
  }),
}));

describe("Admin Order Email Notifications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send cancellation email when order status is changed to CANCELLED", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/[orderId]/route");
    const { db } = await import("@/lib/db");
    const { sendOrderCancellationEmail } = await import(
      "@/lib/email/order-templates"
    );

    // Mock database responses
    (db.order.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      status: "PROCESSING",
    } as any);

    (db.order.update as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      orderNumber: "ORD-123",
      status: "CANCELLED",
      total: 100.0,
      createdAt: new Date("2024-01-01"),
      deliveredAt: null,
      paymentMethod: "Credit Card",
      user: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      },
      items: [
        {
          id: "item-1",
          name: "Test Product",
          quantity: 1,
          price: 100.0,
          product: {
            images: ["test-image.jpg"],
          },
        },
      ],
      shippingAddress: {
        addressLine1: "123 Test St",
        city: "Test City",
        state: "Test State",
        postalCode: "12345",
        country: "Test Country",
      },
    } as any);

    // Create request
    const request = new NextRequest(
      "http://localhost:3000/api/admin/orders/order-123",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "CANCELLED",
          cancellationReason: "Out of stock",
        }),
      }
    );

    // Call the API
    const response = await PATCH(request, {
      params: Promise.resolve({ orderId: "order-123" }),
    });

    // Verify response
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.order.status).toBe("Cancelled");

    // Verify email was sent
    expect(sendOrderCancellationEmail).toHaveBeenCalledWith({
      to: "john@example.com",
      customerName: "John Doe",
      orderId: "ORD-123",
      orderItems: [
        {
          name: "Test Product",
          quantity: 1,
          price: 100.0,
          image: "test-image.jpg",
        },
      ],
      totalAmount: 100.0,
      cancellationReason: "Out of stock",
      cancelledAt: expect.any(String),
    });
  });

  it("should handle cancellation without reason", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/[orderId]/route");
    const { db } = await import("@/lib/db");
    const { sendOrderCancellationEmail } = await import(
      "@/lib/email/order-templates"
    );

    // Mock database responses
    (db.order.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      status: "PROCESSING",
    } as any);

    (db.order.update as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      orderNumber: "ORD-123",
      status: "CANCELLED",
      total: 100.0,
      createdAt: new Date("2024-01-01"),
      deliveredAt: null,
      paymentMethod: "Credit Card",
      user: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      },
      items: [
        {
          id: "item-1",
          name: "Test Product",
          quantity: 1,
          price: 100.0,
          product: {
            images: ["test-image.jpg"],
          },
        },
      ],
      shippingAddress: {
        addressLine1: "123 Test St",
        city: "Test City",
        state: "Test State",
        postalCode: "12345",
        country: "Test Country",
      },
    } as any);

    // Create request without cancellation reason
    const request = new NextRequest(
      "http://localhost:3000/api/admin/orders/order-123",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      }
    );

    // Call the API
    const response = await PATCH(request, {
      params: Promise.resolve({ orderId: "order-123" }),
    });

    // Verify response
    expect(response.status).toBe(200);

    // Verify email was sent without cancellation reason
    expect(sendOrderCancellationEmail).toHaveBeenCalledWith({
      to: "john@example.com",
      customerName: "John Doe",
      orderId: "ORD-123",
      orderItems: [
        {
          name: "Test Product",
          quantity: 1,
          price: 100.0,
          image: "test-image.jpg",
        },
      ],
      totalAmount: 100.0,
      cancellationReason: undefined,
      cancelledAt: expect.any(String),
    });
  });

  it("should save cancellation reason in order notes", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/[orderId]/route");
    const { db } = await import("@/lib/db");

    // Mock database responses
    (db.order.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      status: "PROCESSING",
    } as any);

    (db.order.update as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      orderNumber: "ORD-123",
      status: "CANCELLED",
      total: 100.0,
      createdAt: new Date("2024-01-01"),
      deliveredAt: null,
      paymentMethod: "Credit Card",
      notes: "Cancellation reason: Customer request",
      user: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      },
      items: [
        {
          id: "item-1",
          name: "Test Product",
          quantity: 1,
          price: 100.0,
          product: {
            images: ["test-image.jpg"],
          },
        },
      ],
      shippingAddress: {
        addressLine1: "123 Test St",
        city: "Test City",
        state: "Test State",
        postalCode: "12345",
        country: "Test Country",
      },
    } as any);

    // Create request with cancellation reason
    const request = new NextRequest(
      "http://localhost:3000/api/admin/orders/order-123",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "CANCELLED",
          cancellationReason: "Customer request",
        }),
      }
    );

    // Call the API
    const response = await PATCH(request, {
      params: Promise.resolve({ orderId: "order-123" }),
    });

    // Verify response
    expect(response.status).toBe(200);

    // Verify that the update was called with the cancellation reason in notes
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: "order-123" },
      data: {
        status: "CANCELLED",
        notes: "Cancellation reason: Customer request",
      },
      include: expect.any(Object),
    });
  });

  it("should send completion email when order status is changed to COMPLETED", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/[orderId]/route");
    const { db } = await import("@/lib/db");
    const { sendOrderCompletedEmail } = await import(
      "@/lib/email/order-templates"
    );

    // Mock database responses
    (db.order.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      status: "DELIVERED",
    } as any);

    (db.order.update as jest.Mock).mockResolvedValueOnce({
      id: "order-123",
      orderNumber: "ORD-123",
      status: "COMPLETED",
      total: 100.0,
      createdAt: new Date("2024-01-01"),
      deliveredAt: new Date("2024-01-15"),
      paymentMethod: "Credit Card",
      user: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      },
      items: [
        {
          id: "item-1",
          name: "Test Product",
          quantity: 1,
          price: 100.0,
          product: {
            images: ["test-image.jpg"],
          },
        },
      ],
      shippingAddress: {
        addressLine1: "123 Test St",
        city: "Test City",
        state: "Test State",
        postalCode: "12345",
        country: "Test Country",
      },
    } as any);

    // Create request
    const request = new NextRequest(
      "http://localhost:3000/api/admin/orders/order-123",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      }
    );

    // Call the API
    const response = await PATCH(request, {
      params: Promise.resolve({ orderId: "order-123" }),
    });

    // Verify response
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.order.status).toBe("Completed");

    // Verify email was sent
    expect(sendOrderCompletedEmail).toHaveBeenCalledWith({
      to: "john@example.com",
      customerName: "John Doe",
      orderId: "ORD-123",
      orderItems: [
        {
          name: "Test Product",
          quantity: 1,
          price: 100.0,
          image: "test-image.jpg",
        },
      ],
      totalAmount: 100.0,
      shippingAddress:
        "123 Test St, Test City, Test State, 12345, Test Country",
      completedAt: expect.any(String),
    });
  });
});
