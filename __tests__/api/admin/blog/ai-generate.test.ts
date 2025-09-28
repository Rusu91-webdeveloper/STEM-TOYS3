/**
 * AI Blog Generation API Tests
 * Tests for the /api/admin/blog/ai-generate endpoint
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/blog/ai-generate/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Mock dependencies
jest.mock("@/lib/auth");
jest.mock("@/lib/auth/admin");
jest.mock("@/lib/db");
jest.mock("@/lib/ai/ai-blog-enhancement-service");
jest.mock("@/lib/response-headers");

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDb = db as jest.Mocked<typeof db>;

describe("/api/admin/blog/ai-generate", () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth to return admin user
    mockAuth.mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
        name: "Admin User",
      },
    } as any);

    // Mock database
    mockDb.category.findFirst.mockResolvedValue({
      id: "cat-1",
      name: "Educație STEM",
      slug: "educatie-stem",
      isActive: true,
    } as any);

    mockDb.category.create.mockResolvedValue({
      id: "cat-1",
      name: "Educație STEM",
      slug: "educatie-stem",
      isActive: true,
    } as any);

    mockDb.blog.findUnique.mockResolvedValue(null); // No existing blog with slug

    mockDb.blog.create.mockResolvedValue({
      id: "blog-1",
      title: "Test Blog Title",
      slug: "test-blog-title",
      excerpt: "Test excerpt",
      content: "Test content",
      isPublished: false,
      publishedAt: null,
      readingTime: 5,
      stemCategory: "GENERAL",
      category: { id: "cat-1", name: "Educație STEM", slug: "educatie-stem" },
      author: { id: "admin-1", name: "Admin User" },
    } as any);

    // Mock AI service
    const {
      AIBlogEnhancementService,
    } = require("@/lib/ai/ai-blog-enhancement-service");
    AIBlogEnhancementService.mockImplementation(() => ({
      generateBlog: jest.fn().mockResolvedValue({
        success: true,
        generatedBlog: {
          title: "Test Blog Title",
          slug: "test-blog-title",
          excerpt: "Test excerpt about STEM toys",
          content: "Test blog content about STEM toys in Romanian",
          tags: ["STEM", "educație", "copii"],
          stemCategory: "GENERAL",
          readingTime: 5,
          language: "ro",
          wordCount: 250,
          seoMetadata: {
            metaTitle: "Test Blog Title",
            metaDescription: "Test description",
            metaKeywords: ["STEM", "educație"],
            seoScore: 85,
          },
          aiMetadata: {
            aiGenerated: true,
            generatedBy: "dual-provider-blog",
            generationTimestamp: new Date().toISOString(),
            originalPrompt: "Test prompt",
            processingTime: 1500,
            refinementApplied: true,
          },
        },
        processingTime: 1500,
        seoScore: 85,
      }),
    }));
  });

  describe("Authentication", () => {
    it("should return 403 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Test prompt",
          options: { saveToDatabase: false },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(403);
    });

    it("should return 403 if user is not admin", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@test.com",
          role: "CUSTOMER",
        },
      } as any);

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Test prompt",
          options: { saveToDatabase: false },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(403);
    });
  });

  describe("Input Validation", () => {
    it("should validate prompt length", async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Too short",
          options: { saveToDatabase: false },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should validate required fields", async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          // Missing prompt
          options: { saveToDatabase: false },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
    });
  });

  describe("Blog Generation", () => {
    it("should generate blog successfully without saving to database", async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Generate a blog about STEM toys for kids",
          options: {
            saveToDatabase: false,
            includeSEO: true,
            targetStemCategory: "SCIENCE",
          },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.generatedBlog).toBeDefined();
      expect(data.generatedBlog.title).toBe("Test Blog Title");
      expect(data.processingTime).toBeGreaterThan(0);
    });

    it("should save blog to database when requested", async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Generate a blog about STEM toys for kids",
          options: {
            saveToDatabase: true,
            autoPublish: false,
          },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.savedBlog).toBeDefined();
      expect(data.savedBlog.title).toBe("Test Blog Title");
      expect(data.savedBlog.isPublished).toBe(false);

      // Verify database calls
      expect(mockDb.blog.create).toHaveBeenCalled();
    });

    it("should auto-publish blog when requested", async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Generate a blog about STEM toys for kids",
          options: {
            saveToDatabase: true,
            autoPublish: true,
          },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.savedBlog).toBeDefined();
      expect(data.savedBlog.isPublished).toBe(true);
      expect(data.savedBlog.publishedAt).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle AI service failures", async () => {
      const {
        AIBlogEnhancementService,
      } = require("@/lib/ai/ai-blog-enhancement-service");
      AIBlogEnhancementService.mockImplementation(() => ({
        generateBlog: jest.fn().mockResolvedValue({
          success: false,
          error: "AI service unavailable",
          processingTime: 500,
        }),
      }));

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Generate a blog about STEM toys",
          options: { saveToDatabase: false },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("AI service unavailable");
    });

    it("should handle database save failures", async () => {
      mockDb.blog.create.mockRejectedValue(
        new Error("Database connection failed")
      );

      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Generate a blog about STEM toys",
          options: { saveToDatabase: true },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("database save failed");
      expect(data.generatedBlog).toBeDefined(); // Should still return generated blog
    });
  });

  describe("SEO and Metadata", () => {
    it("should include SEO analysis in response", async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          prompt: "Generate a blog about STEM toys",
          options: {
            saveToDatabase: false,
            includeSEO: true,
          },
        }),
      };

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.seoScore).toBeDefined();
      expect(data.generatedBlog.seoMetadata).toBeDefined();
      expect(data.generatedBlog.seoMetadata.seoScore).toBe(85);
    });
  });
});
