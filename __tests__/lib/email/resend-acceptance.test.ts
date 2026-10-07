/** @jest-environment node */
import { ResendProvider } from "@/lib/email/providers/resend";
import { UnifiedEmailService } from "@/lib/email/unified-service";

const mockSend = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
const input = {
  to: "fixture@example.invalid",
  template: "return",
  variables: {},
  html: "<p>Fixture</p>",
};
const originalKey = process.env.RESEND_API_KEY;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.RESEND_API_KEY = "synthetic-test-key";
});
afterEach(() => {
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
});
test("a provider rejection is reported as failed email acceptance", async () => {
  mockSend.mockResolvedValue({
    data: null,
    error: { message: "Fixture rejection" },
  });
  const service = new UnifiedEmailService({
    primaryProvider: new ResendProvider(),
    fromEmail: "fixture@example.invalid",
  });
  expect(await service.sendEmail(input)).toEqual(
    expect.objectContaining({ success: false, error: "Fixture rejection" })
  );
});
test("accepted mail records the SDK message id", async () => {
  mockSend.mockResolvedValue({ data: { id: "fixture-message" }, error: null });
  expect(await new ResendProvider().send(input)).toEqual(
    expect.objectContaining({ success: true, messageId: "fixture-message" })
  );
});
test("an unacknowledged message cannot be reported as accepted", async () => {
  mockSend.mockResolvedValue({ data: null, error: null });
  await expect(new ResendProvider().send(input)).rejects.toThrow(
    "did not acknowledge"
  );
});
test("a false primary result retries the fallback provider", async () => {
  const fallback = {
    name: "fixture-fallback",
    send: jest
      .fn()
      .mockResolvedValue({ success: true, messageId: "fallback-message" }),
  };
  const service = new UnifiedEmailService({
    primaryProvider: {
      name: "fixture-primary",
      send: jest.fn().mockResolvedValue({ success: false }),
    },
    fallbackProvider: fallback,
    fromEmail: "fixture@example.invalid",
  });
  expect(await service.sendEmail(input)).toEqual(
    expect.objectContaining({
      success: true,
      messageId: "fallback-message",
      provider: "fixture-fallback",
    })
  );
});
