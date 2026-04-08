/**
 * @jest-environment node
 */

export {};

const mockAuth = jest.fn();
const mockSendMarketingEmail = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: (...args: any[]) => mockAuth(...args),
}));

jest.mock("@/lib/email/marketing-email-service", () => ({
  MarketingEmailService: {
    sendMarketingEmail: (...args: any[]) => mockSendMarketingEmail(...args),
  },
}));

describe("/api/marketing/email", () => {
  let GET: typeof import("@/app/api/marketing/email/route").GET;
  let POST: typeof import("@/app/api/marketing/email/route").POST;

  beforeAll(() => {
    ({ GET, POST } = require("@/app/api/marketing/email/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks non-admin users from sending marketing emails", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "CUSTOMER", email: "user@example.com", name: "User" },
    });

    const request = new Request("http://localhost:3000/api/marketing/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "lead@example.com",
        templateType: "welcome",
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Admin");
    expect(mockSendMarketingEmail).not.toHaveBeenCalled();
  });

  it("lets admins run the marketing email health check", async () => {
    mockAuth.mockResolvedValue({
      user: { role: "ADMIN", email: "admin@example.com", name: "Admin" },
    });
    mockSendMarketingEmail.mockResolvedValue({
      success: true,
      messageId: "msg-1",
      provider: "brevo",
    });

    const request = new Request("http://localhost:3000/api/marketing/email", {
      method: "GET",
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSendMarketingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        templateType: "welcome",
      })
    );
  });
});
