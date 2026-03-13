/**
 * @jest-environment node
 */

const mockAfter = jest.fn();
const mockGetAppConfig = jest.fn();
const mockSendEmailViaUnifiedSystem = jest.fn();

jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");

  return {
    ...actual,
    after: (callback: () => Promise<void> | void) => mockAfter(callback),
  };
});

jest.mock("@/lib/config/app-config", () => ({
  appConfig: {
    contactEmail: "fallback@techtots.ro",
    supportEmail: "fallback@techtots.ro",
    alertEmail: "alerts@techtots.ro",
    fromEmail: "noreply@techtots.ro",
    storePhone: "+40771248029",
    storePhoneFormatted: "+40 771 248 029",
    streetAddress: "Strada Mehedinti 54-56",
    city: "Cluj-Napoca",
    state: "Cluj",
    postalCode: "400000",
    fullAddress: "Strada Mehedinti 54-56, Cluj-Napoca, Romania",
  },
  getAppConfig: (...args: any[]) => mockGetAppConfig(...args),
}));

jest.mock("@/lib/nodemailer", () => ({
  sendEmailViaUnifiedSystem: (...args: any[]) =>
    mockSendEmailViaUnifiedSystem(...args),
}));

describe("POST /api/contact", () => {
  let POST: (request: Request) => Promise<Response>;

  const validPayload = {
    name: "Alice Example",
    email: "alice@example.com",
    subject: "general",
    message: "As vrea mai multe detalii despre produsele STEM.",
  };

  beforeAll(() => {
    ({ POST } = require("@/app/api/contact/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAfter.mockImplementation(() => undefined);
    mockGetAppConfig.mockResolvedValue({
      storeName: "TechTots",
      contactEmail: "contact@techtots.ro",
      supportEmail: "contact@techtots.ro",
      contactPhone: "+40771248029",
      storePhoneFormatted: "+40 771 248 029",
      alertEmail: "alerts@techtots.ro",
      fromEmail: "noreply@techtots.ro",
      streetAddress: "Strada Mehedinti 54-56",
      city: "Cluj-Napoca",
      state: "Cluj",
      postalCode: "400000",
      country: "Romania",
      fullAddress: "Strada Mehedinti 54-56, Cluj-Napoca, Romania",
      legalName: "WEBIRA REM S.R.L.",
    });
    mockSendEmailViaUnifiedSystem.mockResolvedValue({
      success: true,
      jobId: "job-1",
    });
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, message: "short" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid form data");
    expect(mockSendEmailViaUnifiedSystem).not.toHaveBeenCalled();
  });

  it("sends the admin email in-request and defers the confirmation email", async () => {
    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSendEmailViaUnifiedSystem).toHaveBeenCalledTimes(1);
    expect(mockSendEmailViaUnifiedSystem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "contact@techtots.ro",
        subject: expect.stringContaining("[Contact Form] General Inquiry"),
        html: expect.any(String),
        text: expect.stringContaining("Alice Example"),
      })
    );
    expect(mockAfter).toHaveBeenCalledTimes(1);

    const deferredTask = mockAfter.mock.calls[0][0];
    await deferredTask();

    expect(mockSendEmailViaUnifiedSystem).toHaveBeenCalledTimes(2);
    expect(mockSendEmailViaUnifiedSystem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "alice@example.com",
        subject: expect.stringContaining("Confirmare"),
        html: expect.any(String),
        text: expect.stringContaining("Alice Example"),
      })
    );
  });

  it("falls back to env config when store config loading fails", async () => {
    mockGetAppConfig.mockRejectedValueOnce(new Error("database unavailable"));

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockSendEmailViaUnifiedSystem).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "fallback@techtots.ro",
      })
    );
  });

  it("returns 500 when the primary contact email fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockSendEmailViaUnifiedSystem.mockResolvedValueOnce({
      success: false,
      error: "provider down",
    });

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Mesajul nu a putut fi trimis");
    expect(mockAfter).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
