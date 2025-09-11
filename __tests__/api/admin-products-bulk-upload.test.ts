/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/products/bulk-upload/route";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));
jest.mock("@/lib/cache", () => ({
  invalidateCachePattern: jest.fn(),
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("/api/admin/products/bulk-upload", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires admin auth", async () => {
    auth.mockResolvedValue({ user: { role: "CUSTOMER" } });
    const req = new NextRequest(
      "http://localhost/api/admin/products/bulk-upload",
      {
        method: "POST",
        body: JSON.stringify({ products: [] }),
      }
    );
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("validates required fields", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });

    const invalidProduct = {
      name: "", // Empty name should fail
      description: "Short", // Too short description
      price: 0, // Invalid price
      category: "", // Empty category
      stockQuantity: -1, // Negative stock
    };

    const req = new NextRequest(
      "http://localhost/api/admin/products/bulk-upload",
      {
        method: "POST",
        body: JSON.stringify({ products: [invalidProduct] }),
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("successfully creates products with valid data", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });

    // Mock category exists
    db.category.findFirst.mockResolvedValue({
      id: "cat1",
      name: "Robotics",
      isActive: true,
    });

    // Mock no existing product with same slug or SKU
    db.product.findUnique.mockResolvedValue(null);
    db.product.findFirst.mockResolvedValue(null);

    // Mock successful product creation
    db.product.create.mockResolvedValue({
      id: "prod1",
      name: "Test Robot",
      slug: "test-robot",
      price: 299.99,
      categoryId: "cat1",
      status: "APPROVED",
    });

    const validProduct = {
      name: "Test Robot",
      description: "A great educational robot for learning programming",
      price: 299.99,
      compareAtPrice: 349.99,
      sku: "ROBOT-001",
      stockQuantity: 50,
      category: "Robotics",
      tags: "programming,robotics,STEM",
      ageGroup: "ELEMENTARY_6_8",
      stemDiscipline: "TECHNOLOGY",
      productType: "ROBOTICS",
      learningOutcomes: "PROBLEM_SOLVING,LOGIC",
      specialCategories: "NEW_ARRIVALS",
      images: "https://example.com/robot.jpg",
      isActive: true,
      featured: false,
    };

    const req = new NextRequest(
      "http://localhost/api/admin/products/bulk-upload",
      {
        method: "POST",
        body: JSON.stringify({ products: [validProduct] }),
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const result = await res.json();
    expect(result.success).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.summary.successRate).toBe("100.0%");
  });

  it("creates new category if it doesn't exist", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });

    // Mock category doesn't exist initially
    db.category.findFirst.mockResolvedValue(null);

    // Mock category creation
    db.category.create.mockResolvedValue({
      id: "new-cat1",
      name: "New Category",
      slug: "new-category",
    });

    // Mock no existing product
    db.product.findUnique.mockResolvedValue(null);
    db.product.findFirst.mockResolvedValue(null);

    // Mock successful product creation
    db.product.create.mockResolvedValue({
      id: "prod1",
      name: "Test Product",
      slug: "test-product",
      price: 199.99,
      categoryId: "new-cat1",
      status: "APPROVED",
    });

    const productWithNewCategory = {
      name: "Test Product",
      description: "A product in a new category",
      price: 199.99,
      stockQuantity: 25,
      category: "New Category",
    };

    const req = new NextRequest(
      "http://localhost/api/admin/products/bulk-upload",
      {
        method: "POST",
        body: JSON.stringify({ products: [productWithNewCategory] }),
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const result = await res.json();
    expect(result.success).toBe(1);
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0].message).toContain("Created new category");
  });

  it("handles duplicate SKU errors", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });

    // Mock category exists
    db.category.findFirst.mockResolvedValue({
      id: "cat1",
      name: "Robotics",
      isActive: true,
    });

    // Mock existing product with same SKU
    db.product.findFirst.mockResolvedValue({
      id: "existing-prod",
      sku: "ROBOT-001",
    });

    const productWithDuplicateSKU = {
      name: "Test Robot",
      description: "A great educational robot for learning programming",
      price: 299.99,
      sku: "ROBOT-001", // This SKU already exists
      stockQuantity: 50,
      category: "Robotics",
    };

    const req = new NextRequest(
      "http://localhost/api/admin/products/bulk-upload",
      {
        method: "POST",
        body: JSON.stringify({ products: [productWithDuplicateSKU] }),
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const result = await res.json();
    expect(result.success).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toBe("SKU already exists");
  });

  it("validates categorization fields", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });

    // Mock category exists
    db.category.findFirst.mockResolvedValue({
      id: "cat1",
      name: "Robotics",
      isActive: true,
    });

    // Mock no existing product
    db.product.findUnique.mockResolvedValue(null);
    db.product.findFirst.mockResolvedValue(null);

    const productWithInvalidCategorization = {
      name: "Test Robot",
      description: "A great educational robot for learning programming",
      price: 299.99,
      stockQuantity: 50,
      category: "Robotics",
      ageGroup: "INVALID_AGE_GROUP", // Invalid age group
      stemDiscipline: "INVALID_DISCIPLINE", // Invalid discipline
      productType: "INVALID_TYPE", // Invalid product type
    };

    const req = new NextRequest(
      "http://localhost/api/admin/products/bulk-upload",
      {
        method: "POST",
        body: JSON.stringify({ products: [productWithInvalidCategorization] }),
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(400);

    const result = await res.json();
    expect(result.error).toBe("Validation error");
  });
});
