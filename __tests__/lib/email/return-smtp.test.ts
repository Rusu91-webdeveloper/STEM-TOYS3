/** @jest-environment node */
import { SmtpProvider } from "@/lib/email/providers/smtp";
import { getReturnEmailService } from "@/lib/email/return-service";
import { UnifiedEmailService } from "@/lib/email/unified-service";
const mockSend = jest.fn();
const mockCreate = jest.fn();
const mockLegacy = jest.fn();
jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: (...args: unknown[]) => mockCreate(...args) },
}));
jest.mock("@/lib/email/index", () => ({ getEmailService: () => mockLegacy() }));
const oldEnv = { ...process.env };
const request = {
  to: "qa@example.invalid",
  template: "return-approved",
  variables: {},
  subject: "Synthetic return",
  html: "<p>TEST</p>",
  text: "TEST",
  attachments: [
    {
      filename: "TEST.pdf",
      content: Buffer.from("PDF fixture").toString("base64"),
      contentType: "application/pdf",
    },
  ],
};
beforeEach(() => {
  jest.clearAllMocks();
  process.env.EMAIL_USER = "qa@example.invalid";
  process.env.EMAIL_PASS = "synthetic";
  process.env.EMAIL_HOST = "smtp.gmail.com";
  process.env.EMAIL_PORT = "587";
  mockCreate.mockReturnValue({ sendMail: mockSend });
  mockSend.mockResolvedValue({
    accepted: ["qa@example.invalid"],
    rejected: [],
    messageId: "TEST@invalid",
  });
});
afterEach(() => {
  process.env = { ...oldEnv };
});
test("configured SMTP is selected for return notices while unconfigured environments retain their existing provider", () => {
  expect(getReturnEmailService()).toBeInstanceOf(UnifiedEmailService);
  expect(mockLegacy).not.toHaveBeenCalled();
  delete process.env.EMAIL_PASS;
  getReturnEmailService();
  expect(mockLegacy).toHaveBeenCalledTimes(1);
});
test("uses verified STARTTLS, the existing SMTP credentials and decoded PDF attachments", async () => {
  const result = await new SmtpProvider().send(request);
  expect(result.success).toBe(true);
  expect(result.messageId).toBe("TEST@invalid");
  expect(mockCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      tls: { rejectUnauthorized: true },
      auth: { user: "qa@example.invalid", pass: "synthetic" },
    })
  );
  expect(mockSend.mock.calls[0][0].attachments[0].content.toString()).toBe(
    "PDF fixture"
  );
  expect(mockSend.mock.calls[0][0].text).toBe("TEST");
});
test("SMTP recipient rejection and transport failure are reported as failures without a simulation or duplicate fallback", async () => {
  mockSend.mockResolvedValueOnce({
    accepted: [],
    rejected: ["qa@example.invalid"],
    messageId: "TEST",
  });
  expect((await getReturnEmailService().sendEmail(request)).success).toBe(
    false
  );
  mockSend.mockRejectedValueOnce(new Error("SMTP test rejection"));
  const result = await getReturnEmailService().sendEmail(request);
  expect(result.success).toBe(false);
  expect(result.error).toBe("SMTP test rejection");
  expect(mockLegacy).not.toHaveBeenCalled();
});
