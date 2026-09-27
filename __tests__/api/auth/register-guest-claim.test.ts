/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/register/route";

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

jest.mock("@/lib/email", () => ({
  sendUserVerificationEmails: jest.fn(),
  sendWelcomeEmail: jest.fn(() => Promise.resolve(true)),
  sendVerificationEmail: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("@/lib/services/email-trigger-service", () => ({
  EmailTriggerService: jest.fn().mockImplementation(() => ({
    processSegmentTriggers: jest.fn(),
  })),
}));

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const { db } = require("@/lib/db");
const { sendVerificationEmail } = require("@/lib/email");
const { EmailTriggerService } = require("@/lib/services/email-trigger-service");

const guest = {
  id: "guest_1",
  email: "guest@example.com",
  name: "Ana Pop",
  password: "$2a$12$random-guest-hash",
  role: "CUSTOMER",
  isActive: false,
  tags: ["guest-checkout"],
};

function registerRequest(email = "Guest@Example.com") {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Ana Pop",
      email,
      password: "secret123",
    }),
  });
}

describe("POST /api/auth/register guest claim", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.user.findUnique.mockImplementation(
      ({ where }: { where: { email: string } }) =>
        Promise.resolve(where.email === guest.email ? guest : null)
    );
    db.user.update.mockResolvedValue({
      id: guest.id,
      name: "Ana Pop",
      email: guest.email,
    });
  });

  it("lets a guest-checkout email set a password without mentioning an order", async () => {
    const response = await POST(registerRequest());
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.message).toMatch(/check your email/i);
    expect(JSON.stringify(payload).toLowerCase()).not.toMatch(/order|comand/);
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "guest_1" },
        data: expect.objectContaining({
          name: "Ana Pop",
          isActive: false,
          emailVerified: null,
          verificationToken: expect.any(String),
        }),
      })
    );
    const savedPassword = db.user.update.mock.calls[0][0].data.password;
    expect(savedPassword).not.toBe("secret123");
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "Guest@Example.com",
      "Ana Pop",
      expect.any(String)
    );
    expect(EmailTriggerService).not.toHaveBeenCalled();
  });

  it("still rejects an active account with the normal conflict", async () => {
    db.user.findUnique.mockResolvedValue({
      ...guest,
      isActive: true,
      tags: ["guest-checkout"],
    });

    const response = await POST(registerRequest("guest@example.com"));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toMatch(/already exists/i);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
