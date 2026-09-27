/**
 * @jest-environment node
 */

import { compare } from "bcryptjs";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/register/route";
import { activateGuestCheckoutForProviderSignIn } from "@/lib/checkout/guest-account-claim";

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

jest.mock("@/lib/email", () => ({
  sendUserVerificationEmails: jest.fn(),
  sendWelcomeEmail: jest.fn(() => Promise.resolve(true)),
  sendVerificationEmail: jest.fn(() => Promise.resolve(true)),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve(true)),
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
    passwordResetToken: {
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
      create: jest.fn(() => Promise.resolve({ id: "reset_1" })),
    },
    $transaction: jest.fn(),
  },
}));

const { db } = require("@/lib/db");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("@/lib/email");
const { EmailTriggerService } = require("@/lib/services/email-trigger-service");

const guest = {
  id: "guest_1",
  email: "guest@example.com",
  name: "Ana Pop",
  password: "$2a$12$random-guest-hash",
  role: "CUSTOMER",
  isActive: false,
  tags: ["guest-checkout"],
  verificationToken: null as string | null,
};

function registerRequest(
  email = "Guest@Example.com",
  password = "secret123",
  name = "Ion Ionescu"
) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

describe("POST /api/auth/register guest claim", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    guest.password = "$2a$12$random-guest-hash";
    guest.isActive = false;
    guest.tags = ["guest-checkout"];
    guest.verificationToken = null;
    db.user.findUnique.mockImplementation(
      ({ where }: { where: { email: string } }) =>
        Promise.resolve(where.email === guest.email ? guest : null)
    );
    db.user.update.mockImplementation(
      ({
        data,
      }: {
        data: {
          password?: string;
          tags?: string[];
          isActive?: boolean;
          verificationToken?: string | null;
        };
      }) => {
        if (typeof data.password === "string") guest.password = data.password;
        if (data.tags) guest.tags = data.tags;
        if (typeof data.isActive === "boolean") guest.isActive = data.isActive;
        if ("verificationToken" in data) {
          guest.verificationToken = data.verificationToken ?? null;
        }
        return Promise.resolve({
          id: guest.id,
          name: guest.name,
          email: guest.email,
        });
      }
    );
  });

  it("sends a reset email and does not change the guest password hash", async () => {
    const passwordBefore = guest.password;
    const response = await POST(registerRequest());
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.message).toMatch(/check your email/i);
    expect(payload.user).toEqual({
      name: "Ion Ionescu",
      email: "guest@example.com",
    });
    expect(payload.user.id).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain(guest.id);
    expect(JSON.stringify(payload)).not.toContain(guest.name);
    expect(JSON.stringify(payload).toLowerCase()).not.toMatch(/order|comand/);
    expect(guest.password).toBe(passwordBefore);
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { email: "guest@example.com" },
    });
    expect(db.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "guest@example.com",
        token: expect.any(String),
      }),
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "guest@example.com",
      expect.any(String)
    );
    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(EmailTriggerService).not.toHaveBeenCalled();
  });

  it("rejects the attacker password after the owner signs in with Google", async () => {
    const attackerPassword = "Attacker1a";
    const response = await POST(
      registerRequest("guest@example.com", attackerPassword)
    );

    expect(response.status).toBe(201);
    expect(guest.password).toBe("$2a$12$random-guest-hash");

    const allowed = await activateGuestCheckoutForProviderSignIn(guest);

    expect(allowed).toBe(true);
    expect(guest.isActive).toBe(true);
    expect(guest.tags).not.toContain("guest-checkout");
    expect(guest.verificationToken).toBeNull();
    expect(guest.password).not.toBe("$2a$12$random-guest-hash");
    expect(await compare(attackerPassword, guest.password)).toBe(false);
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
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
