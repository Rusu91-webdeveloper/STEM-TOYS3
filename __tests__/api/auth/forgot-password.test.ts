import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/forgot-password/route";

// Mock the dependencies
jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: jest.fn((handler: any) => handler),
}));

// Mock crypto
jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => "mock-token-123"),
  })),
}));

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

describe("/api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe("OAuth User Handling", () => {
    it("should reject OAuth users with appropriate message", async () => {
      // Mock OAuth user (empty password)
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        password: "", // Empty password indicates OAuth user
        isActive: true,
      });

      const request = createMockRequest({
        email: "user@example.com",
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe(
        "This account uses Google sign-in. Please use the 'Sign in with Google' button instead of resetting your password."
      );
      expect(responseData.isOAuthUser).toBe(true);

      // Should not create password reset token
      expect(db.passwordResetToken.deleteMany).not.toHaveBeenCalled();
      expect(db.passwordResetToken.create).not.toHaveBeenCalled();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("should handle null password as OAuth user", async () => {
      // Mock OAuth user with null password
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        password: null,
        isActive: true,
      });

      const request = createMockRequest({
        email: "user@example.com",
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.isOAuthUser).toBe(true);
    });
  });

  describe("Regular User Handling", () => {
    it("should process regular users with passwords normally", async () => {
      // Mock regular user with password
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        password: "hashed-password-123",
        isActive: true,
      });

      (db.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({});
      (db.passwordResetToken.create as jest.Mock).mockResolvedValue({
        id: "token-123",
        token: "mock-token-123",
        email: "user@example.com",
        expires: new Date(Date.now() + 3600000), // 1 hour from now
      });

      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        email: "user@example.com",
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.message).toBe("Password reset instructions sent");
      expect(responseData.isOAuthUser).toBeUndefined();

      // Should create password reset token
      expect(db.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
      expect(db.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          token: "mock-token-123",
          email: "user@example.com",
          expires: expect.any(Date),
        },
      });
      expect(sendPasswordResetEmail).toHaveBeenCalled();
    });

    it("should handle non-existent users securely", async () => {
      // Mock non-existent user
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        email: "nonexistent@example.com",
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.message).toBe("Password reset instructions sent");

      // Should not create password reset token or send email
      expect(db.passwordResetToken.deleteMany).not.toHaveBeenCalled();
      expect(db.passwordResetToken.create).not.toHaveBeenCalled();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation", () => {
    it("should reject invalid email format", async () => {
      const request = createMockRequest({
        email: "invalid-email",
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe("Invalid email address");
    });

    it("should reject missing email", async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe("Invalid email address");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      (db.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = createMockRequest({
        email: "user@example.com",
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe("An error occurred");
    });

    it("should continue if email sending fails for regular users", async () => {
      // Mock regular user
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        password: "hashed-password-123",
        isActive: true,
      });

      (db.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({});
      (db.passwordResetToken.create as jest.Mock).mockResolvedValue({
        id: "token-123",
        token: "mock-token-123",
        email: "user@example.com",
        expires: new Date(Date.now() + 3600000),
      });

      // Mock email sending failure
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(
        new Error("Email service down")
      );

      const request = createMockRequest({
        email: "user@example.com",
      });

      const response = await POST(request);
      const responseData = await response.json();

      // Should still return success even if email fails
      expect(response.status).toBe(200);
      expect(responseData.message).toBe("Password reset instructions sent");

      // Should still create token
      expect(db.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe("Development Environment", () => {
    it("should log token in development mode", async () => {
      const originalEnv = process.env.NODE_ENV;

      // Mock process.env for this test
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Mock regular user
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
        password: "hashed-password-123",
        isActive: true,
      });

      (db.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({});
      (db.passwordResetToken.create as jest.Mock).mockResolvedValue({
        id: "token-123",
        token: "mock-token-123",
        email: "user@example.com",
        expires: new Date(Date.now() + 3600000),
      });

      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        email: "user@example.com",
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Password reset token for user@example.com: mock-token-123"
      );

      consoleSpy.mockRestore();

      // Restore original environment
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });
  });
});
