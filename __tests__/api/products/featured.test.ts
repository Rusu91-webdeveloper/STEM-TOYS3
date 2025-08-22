import { NextRequest } from "next/server";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { GET } from "@/app/api/products/featured/route";
import { prisma } from "@/lib/prisma";

const mockFindMany = prisma.product.findMany as jest.Mock;
const mockCount = prisma.product.count as jest.Mock;

describe("/api/products/featured", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return featured products successfully", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Test Product 1",
          slug: "test-product-1",
          description: "Test description",
          price: 100,
          featured: true,
          images: [{ url: "image1.jpg" }],
          category: { name: "Science" },
          stock: 10,
          originalPrice: null,
          discount: null,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Test Product 2",
          slug: "test-product-2",
          description: "Test description 2",
          price: 150,
          featured: true,
          images: [{ url: "image2.jpg" }],
          category: { name: "Technology" },
          stock: 5,
          originalPrice: null,
          discount: null,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFindMany.mockResolvedValue(mockProducts);
      mockCount.mockResolvedValue(2);

      const request = new NextRequest(
        "http://localhost:3000/api/products/featured?limit=6"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.products).toHaveLength(2);
      expect(data.products[0].name).toBe("Test Product 1");
      expect(data.products[1].name).toBe("Test Product 2");
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { featured: true, published: true },
        include: {
          category: { select: { name: true } },
          images: { select: { url: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
    });

    it("should handle custom limit parameter", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Test Product",
          slug: "test-product",
          description: "Test description",
          price: 100,
          featured: true,
          images: [{ url: "image1.jpg" }],
          category: { name: "Science" },
          stock: 10,
          originalPrice: null,
          discount: null,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFindMany.mockResolvedValue(mockProducts);
      mockCount.mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/products/featured?limit=3"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
        })
      );
    });

    it("should use default limit when not provided", async () => {
      const mockProducts: any[] = [];
      mockFindMany.mockResolvedValue(mockProducts);
      mockCount.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost:3000/api/products/featured"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 6, // Default limit
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      mockFindMany.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest(
        "http://localhost:3000/api/products/featured"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch featured products");
    });

    it("should handle invalid limit parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/products/featured?limit=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid limit parameter");
    });

    it("should handle limit parameter out of range", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/products/featured?limit=100"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Limit must be between 1 and 20");
    });

    it("should return empty array when no featured products exist", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const request = new NextRequest(
        "http://localhost:3000/api/products/featured"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.products).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it("should include correct metadata in response", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Test Product",
          slug: "test-product",
          description: "Test description",
          price: 100,
          featured: true,
          images: [{ url: "image1.jpg" }],
          category: { name: "Science" },
          stock: 10,
          originalPrice: null,
          discount: null,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFindMany.mockResolvedValue(mockProducts);
      mockCount.mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/products/featured"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.total).toBe(1);
      expect(data.limit).toBe(6);
      expect(data.products).toHaveLength(1);
      expect(data.products[0]).toHaveProperty("id");
      expect(data.products[0]).toHaveProperty("name");
      expect(data.products[0]).toHaveProperty("slug");
      expect(data.products[0]).toHaveProperty("price");
      expect(data.products[0]).toHaveProperty("category");
      expect(data.products[0]).toHaveProperty("image");
    });
  });
});
