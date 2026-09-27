/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/reset-password/route";

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

jest.mock("@/lib/email/email-triggers", () => ({
  triggerPasswordChangeEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/lib/db", () => ({
  db: {
    passwordResetToken: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

const { db } = require("@/lib/db");

function resetRequest() {
  return new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: "reset-token",
      email: "guest@example.com",
      password: "NewPass123",
    }),
  });
}

describe("POST /api/auth/reset-password guest checkout tag", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes the guest-checkout tag when the reset completes", async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({
      token: "reset-token",
      email: "guest@example.com",
      expires: new Date(Date.now() + 60_000),
      user: {
        id: "guest_1",
        email: "guest@example.com",
        tags: ["guest-checkout", "newsletter"],
      },
    });
    db.user.update.mockResolvedValue({ id: "guest_1" });

    const response = await POST(resetRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toMatch(/successful/i);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { email: "guest@example.com" },
      data: expect.objectContaining({
        isActive: true,
        tags: ["newsletter"],
      }),
    });
  });

  it("leaves tags untouched when the account was not a guest checkout", async () => {
    db.passwordResetToken.findUnique.mockResolvedValue({
      token: "reset-token",
      email: "buyer@example.com",
      expires: new Date(Date.now() + 60_000),
      user: {
        id: "user_1",
        email: "buyer@example.com",
        tags: ["newsletter"],
      },
    });
    db.user.update.mockResolvedValue({ id: "user_1" });

    const response = await POST(resetRequest());

    expect(response.status).toBe(200);
    const update = db.user.update.mock.calls[0][0];
    expect(update.data.tags).toBeUndefined();
    expect(update.data.isActive).toBe(true);
  });
});
