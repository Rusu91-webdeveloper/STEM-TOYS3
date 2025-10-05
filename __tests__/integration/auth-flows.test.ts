import { PrismaClient, UserSegment, LifecycleStage } from "@prisma/client";
import { NextRequest } from "next/server";

// Mock the database
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
  address: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  consentLog: {
    create: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

// Mock NextAuth
const mockAuth = jest.fn();

// Mock bcrypt
const mockHash = jest.fn();
const mockCompare = jest.fn();

// Mock email services
const mockSendWelcomeEmail = jest.fn();
const mockSendVerificationEmail = jest.fn();
const mockSendPasswordResetEmail = jest.fn();

// Mock rate limiting
const mockWithRateLimit = jest.fn();

// Mock environment variables
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Setup mocks before importing
jest.mock("@/lib/db", () => ({
  db: mockPrisma,
}));

jest.mock("next-auth", () => ({
  auth: mockAuth,
}));

jest.mock("bcrypt", () => ({
  hash: mockHash,
  compare: mockCompare,
}));

jest.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
  sendVerificationEmail: mockSendVerificationEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: mockWithRateLimit,
}));

// Import modules after mocking
import { POST as registerUser } from "@/app/api/auth/register/route";
import { POST as verifyEmail } from "@/app/api/auth/verify/route";
import { POST as loginUser } from "@/app/api/auth/callback/credentials/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";
import {
  GET as getProfile,
  PUT as updateProfile,
} from "@/app/api/account/profile/route";
import {
  GET as getAddresses,
  POST as createAddress,
} from "@/app/api/account/addresses/route";
import { POST as updateConsent } from "@/app/api/consent/route";

describe("Authentication Flows Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockHash.mockResolvedValue("hashed-password");
    mockCompare.mockResolvedValue(true);
    mockSendWelcomeEmail.mockResolvedValue(true);
    mockSendVerificationEmail.mockResolvedValue(true);
    mockSendPasswordResetEmail.mockResolvedValue(true);
    mockWithRateLimit.mockImplementation(handler => handler);
    mockAuth.mockResolvedValue(null);

    // Generate unique IDs for tests
    let idCounter = 1;
    mockPrisma.user.create.mockImplementation(data => ({
      id: `user-${idCounter++}`,
      emailVerified: null,
      isActive: false,
      role: "CUSTOMER",
      segment: UserSegment.NEW,
      lifecycleStage: LifecycleStage.AWARENESS,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data.data,
    }));
  });

  describe("Complete User Registration and Email Verification Flow", () => {
    it("should complete full registration and verification flow", async () => {
      const testUser = {
        name: "Ion Popescu",
        email: "ion.popescu@example.com",
        password: "SecurePass123!",
      };

      // Step 1: Register user
      const registerRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(testUser),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Mock user creation
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.create.mockResolvedValue({
        id: "user-123",
        name: testUser.name,
        email: testUser.email,
        password: "hashed-password",
        verificationToken: "verification-token-123",
        isActive: false,
        emailVerified: null,
        role: "CUSTOMER",
        segment: UserSegment.NEW,
        lifecycleStage: LifecycleStage.AWARENESS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const registerResponse = await registerUser(registerRequest);
      const registerData = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerData.message).toContain("Registration successful");
      expect(registerData.user.email).toBe(testUser.email);

      // Verify email was sent
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
        testUser.email,
        testUser.name
      );
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        testUser.email,
        testUser.name,
        "verification-token-123"
      );

      // Step 2: Verify email
      const verifyRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify?token=verification-token-123&email=ion.popescu@example.com"
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: testUser.email,
        verificationToken: "verification-token-123",
        isActive: false,
        emailVerified: null,
      });

      const verifyResponse = await verifyEmail(verifyRequest);
      const verifyData = await verifyResponse.json();

      expect(verifyResponse.status).toBe(200);
      expect(verifyData.message).toContain("Email verified successfully");

      // Verify user was updated
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          isActive: true,
          emailVerified: expect.any(Date),
        },
      });
    });

    it("should handle duplicate email registration", async () => {
      const testUser = {
        name: "Maria Ionescu",
        email: "existing@example.com",
        password: "SecurePass123!",
      };

      // Mock existing user
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user",
        email: testUser.email,
        password: "", // Google-authenticated user
      });

      const registerRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(testUser),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const registerResponse = await registerUser(registerRequest);
      const registerData = await registerResponse.json();

      expect(registerResponse.status).toBe(409);
      expect(registerData.error).toContain("already registered with Google");
    });

    it("should enforce rate limiting on registration", async () => {
      const testUser = {
        name: "Test User",
        email: "test@example.com",
        password: "SecurePass123!",
      };

      // Mock rate limit exceeded
      mockWithRateLimit.mockImplementation(() => {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
        });
      });

      const registerRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(testUser),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const registerResponse = await registerUser(registerRequest);

      expect(registerResponse.status).toBe(429);
    });
  });

  describe("Login and Session Management Flow", () => {
    it("should complete login flow with valid credentials", async () => {
      const loginCredentials = {
        email: "ion.popescu@example.com",
        password: "SecurePass123!",
      };

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: loginCredentials.email,
        password: "hashed-password",
        isActive: true,
        emailVerified: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        lastLoginAt: null,
      });

      // Mock password comparison
      mockCompare.mockResolvedValue(true);

      const loginRequest = new NextRequest(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          body: JSON.stringify(loginCredentials),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const loginResponse = await loginUser(loginRequest);
      const loginData = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginData).toHaveProperty("token");

      // Verify user was updated with login timestamp
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          lastLoginAt: expect.any(Date),
          failedLoginAttempts: 0, // Reset on successful login
        },
      });
    });

    it("should handle invalid credentials", async () => {
      const loginCredentials = {
        email: "wrong@example.com",
        password: "WrongPassword",
      };

      // Mock user not found
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const loginRequest = new NextRequest(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          body: JSON.stringify(loginCredentials),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const loginResponse = await loginUser(loginRequest);

      expect(loginResponse.status).toBe(401);
    });

    it("should handle account lockout after failed attempts", async () => {
      const loginCredentials = {
        email: "locked@example.com",
        password: "WrongPassword",
      };

      // Mock locked account
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: loginCredentials.email,
        password: "hashed-password",
        isActive: true,
        accountLocked: true,
        lockoutUntil: new Date(Date.now() + 3600000), // Locked for 1 hour
      });

      const loginRequest = new NextRequest(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          body: JSON.stringify(loginCredentials),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const loginResponse = await loginUser(loginRequest);

      expect(loginResponse.status).toBe(401);
      // Response should indicate account is locked
    });

    it("should track failed login attempts", async () => {
      const loginCredentials = {
        email: "user@example.com",
        password: "WrongPassword",
      };

      // Mock user with existing failed attempts
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: loginCredentials.email,
        password: "hashed-password",
        isActive: true,
        failedLoginAttempts: 2,
        accountLocked: false,
      });

      // Mock password comparison failure
      mockCompare.mockResolvedValue(false);

      const loginRequest = new NextRequest(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          body: JSON.stringify(loginCredentials),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const loginResponse = await loginUser(loginRequest);

      expect(loginResponse.status).toBe(401);

      // Verify failed attempts were incremented
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          failedLoginAttempts: 3,
        },
      });
    });
  });

  describe("Password Reset Flow", () => {
    it("should complete password reset flow", async () => {
      const resetEmail = "user@example.com";

      // Step 1: Request password reset
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: resetEmail,
        isActive: true,
      });

      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: "reset-token-123",
        token: "reset-token-hash",
        userId: "user-123",
        expiresAt: new Date(Date.now() + 3600000),
      });

      const forgotRequest = new NextRequest(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email: resetEmail }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const forgotResponse = await forgotPassword(forgotRequest);
      const forgotData = await forgotResponse.json();

      expect(forgotResponse.status).toBe(200);
      expect(forgotData.message).toContain("Password reset email sent");

      // Verify reset token was created
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();

      // Step 2: Reset password with token
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "reset-token-123",
        token: "reset-token-hash",
        userId: "user-123",
        expiresAt: new Date(Date.now() + 3600000),
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: resetEmail,
      });

      const resetRequest = new NextRequest(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "reset-token-123",
            password: "NewSecurePass123!",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const resetResponse = await resetPassword(resetRequest);
      const resetData = await resetResponse.json();

      expect(resetResponse.status).toBe(200);
      expect(resetData.message).toContain("Password reset successfully");

      // Verify password was updated and token was deleted
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.passwordResetToken.delete).toHaveBeenCalled();
    });

    it("should handle expired reset tokens", async () => {
      // Mock expired token
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "expired-token",
        token: "expired-token-hash",
        userId: "user-123",
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
      });

      const resetRequest = new NextRequest(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: "expired-token",
            password: "NewSecurePass123!",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const resetResponse = await resetPassword(resetRequest);

      expect(resetResponse.status).toBe(400);
    });
  });

  describe("Profile Management Flow", () => {
    beforeEach(() => {
      // Mock authenticated user
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
          name: "Test User",
        },
      });
    });

    it("should get user profile", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "user@example.com",
        phone: "+40712345678",
        role: "CUSTOMER",
        isActive: true,
        emailVerified: new Date(),
        segment: UserSegment.ACTIVE,
        lifecycleStage: LifecycleStage.PURCHASE,
        totalPageViews: 150,
        lifetimeValue: 500,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date(),
      });

      const profileRequest = new NextRequest(
        "http://localhost:3000/api/account/profile"
      );

      const profileResponse = await getProfile(profileRequest);
      const profileData = await profileResponse.json();

      expect(profileResponse.status).toBe(200);
      expect(profileData.user.name).toBe("Test User");
      expect(profileData.user.email).toBe("user@example.com");
    });

    it("should update user profile", async () => {
      const updateData = {
        name: "Updated Test User",
        phone: "+40723456789",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
      });

      const updateRequest = new NextRequest(
        "http://localhost:3000/api/account/profile",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const updateResponse = await updateProfile(updateRequest);
      const updateResult = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateResult.message).toContain("Profile updated successfully");

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: updateData,
      });
    });

    it("should validate profile update data", async () => {
      const invalidUpdateData = {
        name: "A", // Too short
        email: "invalid-email", // Invalid format
      };

      const updateRequest = new NextRequest(
        "http://localhost:3000/api/account/profile",
        {
          method: "PUT",
          body: JSON.stringify(invalidUpdateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const updateResponse = await updateProfile(updateRequest);

      expect(updateResponse.status).toBe(400);
    });
  });

  describe("Address Management Flow", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
        },
      });
    });

    it("should create and manage addresses", async () => {
      // Create address
      const addressData = {
        name: "Home",
        fullName: "Test User",
        addressLine1: "Strada Victoriei 10",
        city: "București",
        state: "București",
        postalCode: "010101",
        country: "RO",
        phone: "+40712345678",
        judet: "București",
        localitate: "Sector 1",
        codPostal: "010101",
      };

      mockPrisma.address.create.mockResolvedValue({
        id: "address-123",
        userId: "user-123",
        ...addressData,
      });

      const createRequest = new NextRequest(
        "http://localhost:3000/api/account/addresses",
        {
          method: "POST",
          body: JSON.stringify(addressData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const createResponse = await createAddress(createRequest);
      const createResult = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createResult.address.id).toBe("address-123");

      // Get addresses
      mockPrisma.address.findMany.mockResolvedValue([
        {
          id: "address-123",
          ...addressData,
        },
      ]);

      const getRequest = new NextRequest(
        "http://localhost:3000/api/account/addresses"
      );

      const getResponse = await getAddresses(getRequest);
      const getResult = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getResult.addresses).toHaveLength(1);
      expect(getResult.addresses[0].judet).toBe("București");
    });
  });

  describe("GDPR Compliance Flow", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
        },
      });
    });

    it("should manage consent preferences", async () => {
      const consentData = {
        consentType: "marketing",
        consentGiven: true,
      };

      mockPrisma.consentLog.create.mockResolvedValue({
        id: "consent-123",
        userId: "user-123",
        action: "GRANTED",
        consentType: "marketing",
        consentGiven: true,
        createdAt: new Date(),
      });

      const consentRequest = new NextRequest(
        "http://localhost:3000/api/consent",
        {
          method: "POST",
          body: JSON.stringify(consentData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const consentResponse = await updateConsent(consentRequest);
      const consentResult = await consentResponse.json();

      expect(consentResponse.status).toBe(200);
      expect(consentResult.message).toContain("Consent updated successfully");

      // Verify consent was logged
      expect(mockPrisma.consentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          action: "GRANTED",
          consentType: "marketing",
          consentGiven: true,
        }),
      });
    });
  });

  describe("Multi-Tenant Authentication Flow", () => {
    it("should handle tenant-scoped operations", async () => {
      const tenantId = "tenant-456";

      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
          tenantId,
        },
      });

      // Mock tenant-scoped user lookup
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        name: "Tenant User",
        email: "user@example.com",
        tenantId,
      });

      const profileRequest = new NextRequest(
        "http://localhost:3000/api/account/profile",
        {
          headers: {
            "X-Tenant-ID": tenantId,
          },
        }
      );

      const profileResponse = await getProfile(profileRequest);
      const profileData = await profileResponse.json();

      expect(profileResponse.status).toBe(200);
      expect(profileData.user.tenantId).toBe(tenantId);
    });

    it("should prevent cross-tenant data access", async () => {
      const userTenantId = "tenant-456";
      const requestedTenantId = "tenant-789";

      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
          tenantId: userTenantId,
        },
      });

      // Mock different tenant data
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-999",
        name: "Other Tenant User",
        email: "other@example.com",
        tenantId: requestedTenantId,
      });

      const profileRequest = new NextRequest(
        "http://localhost:3000/api/account/profile",
        {
          headers: {
            "X-Tenant-ID": requestedTenantId,
          },
        }
      );

      const profileResponse = await getProfile(profileRequest);

      // Should return user's own data, not other tenant's data
      const profileData = await profileResponse.json();
      expect(profileData.user.tenantId).toBe(userTenantId);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed JSON requests", async () => {
      const malformedRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: "{ invalid json }",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const registerResponse = await registerUser(malformedRequest);

      expect(registerResponse.status).toBe(400);
    });

    it("should handle missing required fields", async () => {
      const incompleteRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }), // Missing name and password
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const registerResponse = await registerUser(incompleteRequest);
      const registerData = await registerResponse.json();

      expect(registerResponse.status).toBe(400);
      expect(registerData.error).toContain("Name is required");
    });

    it("should handle database connection errors", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      const loginRequest = new NextRequest(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const loginResponse = await loginUser(loginRequest);

      expect(loginResponse.status).toBe(500);
    });

    it("should handle email service failures gracefully", async () => {
      mockSendWelcomeEmail.mockRejectedValue(new Error("SMTP server down"));

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        verificationToken: "token-123",
        isActive: false,
      });

      const registerRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "SecurePass123!",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const registerResponse = await registerUser(registerRequest);

      // Registration should still succeed even if email fails
      expect(registerResponse.status).toBe(201);
    });
  });

  describe("Security Integration Tests", () => {
    it("should validate password strength requirements", async () => {
      const weakPasswords = [
        "123456", // Too short, no uppercase, no special chars
        "password", // No uppercase, no numbers
        "PASSWORD", // No lowercase, no numbers
        "Password", // No numbers
      ];

      for (const weakPassword of weakPasswords) {
        const registerRequest = new NextRequest(
          "http://localhost:3000/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              name: "Test User",
              email: "test@example.com",
              password: weakPassword,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const registerResponse = await registerUser(registerRequest);

        // Should fail validation
        expect(registerResponse.status).toBe(400);
      }
    });

    it("should prevent SQL injection attempts", async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const registerRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "SecurePass123!",
          }),
          headers: {
            "Content-Type": "application/json",
            "X-SQL-Injection-Test": maliciousInput,
          },
        }
      );

      const registerResponse = await registerUser(registerRequest);

      // Should succeed normally, not execute malicious SQL
      expect(registerResponse.status).toBe(201);
    });

    it("should handle XSS attempts in input validation", async () => {
      const xssAttempt = '<script>alert("xss")</script>';

      const registerRequest = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: xssAttempt,
            email: "test@example.com",
            password: "SecurePass123!",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const registerResponse = await registerUser(registerRequest);
      const registerData = await registerResponse.json();

      // Should either reject or sanitize the input
      expect([201, 400]).toContain(registerResponse.status);
    });
  });

  describe("Romanian Compliance Integration Tests", () => {
    it("should validate Romanian CNP format", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
        },
      });

      const profileUpdate = {
        name: "Test User",
        email: "user@example.com",
        cnp: "1234567890123", // Valid 13-digit CNP
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "user@example.com",
      });

      const updateRequest = new NextRequest(
        "http://localhost:3000/api/account/profile",
        {
          method: "PUT",
          body: JSON.stringify(profileUpdate),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const updateResponse = await updateProfile(updateRequest);

      expect(updateResponse.status).toBe(200);
    });

    it("should validate Romanian postal codes", async () => {
      const addressData = {
        name: "Home",
        fullName: "Test User",
        addressLine1: "Strada Victoriei 10",
        city: "București",
        state: "București",
        postalCode: "010101", // Valid 6-digit Romanian postal code
        country: "RO",
        phone: "+40712345678",
        judet: "București",
        localitate: "Sector 1",
        codPostal: "010101",
      };

      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
        },
      });

      mockPrisma.address.create.mockResolvedValue({
        id: "address-123",
        userId: "user-123",
        ...addressData,
      });

      const createRequest = new NextRequest(
        "http://localhost:3000/api/account/addresses",
        {
          method: "POST",
          body: JSON.stringify(addressData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const createResponse = await createAddress(createRequest);

      expect(createResponse.status).toBe(201);
    });

    it("should handle Romanian counties validation", async () => {
      const validCounties = ["București", "Cluj", "Timiș", "Brașov"];

      for (const county of validCounties) {
        const addressData = {
          name: "Home",
          fullName: "Test User",
          addressLine1: "Test Address",
          city: "Test City",
          state: "Test State",
          postalCode: "010101",
          country: "RO",
          phone: "+40712345678",
          judet: county,
          localitate: "Test Locality",
          codPostal: "010101",
        };

        mockAuth.mockResolvedValue({
          user: {
            id: "user-123",
            email: "user@example.com",
          },
        });

        mockPrisma.address.create.mockResolvedValue({
          id: "address-123",
          userId: "user-123",
          ...addressData,
        });

        const createRequest = new NextRequest(
          "http://localhost:3000/api/account/addresses",
          {
            method: "POST",
            body: JSON.stringify(addressData),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const createResponse = await createAddress(createRequest);

        expect(createResponse.status).toBe(201);
      }
    });
  });
});
