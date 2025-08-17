/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/cart/route";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  db: {
    product: {
      findUnique: jest.fn(),
    },
    cartItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: jest.fn(handler => handler),
}));

jest.mock("@/lib/api-error-handler", () => ({
  withErrorHandler: jest.fn(handler => handler),
}));

describe("/api/cart", () => {
  let mockDb: any;
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mocked dependencies
    mockDb = require("@/lib/db").db;
    mockAuth = require("@/lib/auth").auth;

    // Mock authenticated user by default
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/cart", () => {
    it("should return user cart items when authenticated", async () => {
      // Arrange
      const mockCartItems = [
        {
          id: "cart-item-1",
          productId: "product-1",
          quantity: 2,
          product: {
            id: "product-1",
            name: "Test Product",
            price: 29.99,
            images: ["image1.jpg"],
            slug: "test-product",
          },
        },
      ];

      mockDb.cartItem.findMany.mockResolvedValue(mockCartItems);
      const request = new NextRequest("http://localhost:3000/api/cart");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.items).toEqual(mockCartItems);
      expect(mockDb.cartItem.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              slug: true,
              stock: true,
            },
          },
        },
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);
      const request = new NextRequest("http://localhost:3000/api/cart");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle database errors gracefully", async () => {
      // Arrange
      mockDb.cartItem.findMany.mockRejectedValue(new Error("Database error"));
      const request = new NextRequest("http://localhost:3000/api/cart");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it("should return empty array when cart is empty", async () => {
      // Arrange
      mockDb.cartItem.findMany.mockResolvedValue([]);
      const request = new NextRequest("http://localhost:3000/api/cart");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.items).toEqual([]);
    });
  });

  describe("POST /api/cart", () => {
    const validCartRequest = {
      productId: "product-1",
      quantity: 2,
    };

    beforeEach(() => {
      // Mock product exists
      mockDb.product.findUnique.mockResolvedValue({
        id: "product-1",
        name: "Test Product",
        price: 29.99,
        stock: 10,
      });
    });

    it("should add new item to cart successfully", async () => {
      // Arrange
      mockDb.cartItem.upsert.mockResolvedValue({
        id: "cart-item-1",
        productId: "product-1",
        quantity: 2,
        userId: "user-123",
      });

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartRequest),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Item added to cart");
      expect(mockDb.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          userId_productId: {
            userId: "user-123",
            productId: "product-1",
          },
        },
        update: {
          quantity: { increment: 2 },
        },
        create: {
          userId: "user-123",
          productId: "product-1",
          quantity: 2,
        },
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);
      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartRequest),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for invalid request body", async () => {
      // Arrange
      const invalidRequest = { productId: "", quantity: -1 };
      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(invalidRequest),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 404 when product does not exist", async () => {
      // Arrange
      mockDb.product.findUnique.mockResolvedValue(null);
      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartRequest),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("should return 400 when requested quantity exceeds stock", async () => {
      // Arrange
      mockDb.product.findUnique.mockResolvedValue({
        id: "product-1",
        name: "Test Product",
        price: 29.99,
        stock: 1, // Only 1 in stock
      });

      const requestWithTooMuchQuantity = {
        productId: "product-1",
        quantity: 5, // Requesting more than available
      };

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(requestWithTooMuchQuantity),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Insufficient stock");
    });

    it("should handle malformed JSON in request body", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: "invalid-json",
        headers: { "Content-Type": "application/json" },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid request");
    });

    it("should handle database constraint errors", async () => {
      // Arrange
      mockDb.cartItem.upsert.mockRejectedValue(
        new Error("Unique constraint failed")
      );

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartRequest),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it("should validate quantity is positive integer", async () => {
      // Arrange
      const invalidQuantities = [-1, 0, 1.5, "invalid"];

      for (const quantity of invalidQuantities) {
        const invalidRequest = {
          productId: "product-1",
          quantity,
        };

        const request = new NextRequest("http://localhost:3000/api/cart", {
          method: "POST",
          body: JSON.stringify(invalidRequest),
          headers: { "Content-Type": "application/json" },
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      }
    });

    it("should validate productId is non-empty string", async () => {
      // Arrange
      const invalidProductIds = ["", null, undefined, 123];

      for (const productId of invalidProductIds) {
        const invalidRequest = {
          productId,
          quantity: 1,
        };

        const request = new NextRequest("http://localhost:3000/api/cart", {
          method: "POST",
          body: JSON.stringify(invalidRequest),
          headers: { "Content-Type": "application/json" },
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      }
    });
  });
});
