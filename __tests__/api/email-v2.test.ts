/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/email/v2/route";

// Mock providers by mocking their modules
jest.mock("@/lib/email/providers/resend", () => ({
  ResendProvider: class {
    name = "resend";
    async send() {
      return { success: true, messageId: "resend-1" };
    }
  },
}));

jest.mock("@/lib/email/providers/brevo", () => ({
  BrevoProvider: class {
    name = "brevo";
    async send() {
      return { success: true, messageId: "brevo-1" };
    }
  },
}));

jest.mock("@/lib/email/providers/gmail", () => ({
  GmailProvider: class {
    name = "gmail";
    async send() {
      return { success: true, messageId: "gmail-1" };
    }
  },
}));

describe("POST /api/email/v2", () => {
  const validPayload = {
    to: "user@example.com",
    template: "test",
    variables: {},
    subject: "Subject",
    html: "<p>Hi</p>",
  };

  it("returns 200 on success with default provider (resend)", async () => {
    const req = new NextRequest("http://localhost:3000/api/email/v2", {
      method: "POST",
      body: JSON.stringify(validPayload),
    } as any);

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(["resend", "brevo", "gmail"]).toContain(data.provider);
  });

  it("validates payload and returns 400 on invalid input", async () => {
    const req = new NextRequest("http://localhost:3000/api/email/v2", {
      method: "POST",
      body: JSON.stringify({ ...validPayload, to: "not-an-email" }),
    } as any);

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.issues).toBeDefined();
  });
});
