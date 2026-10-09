import { db } from "@/lib/db";
import { auditEmailDelivery } from "@/lib/email/delivery-audit";
jest.mock("@/lib/db", () => ({ db: { emailLog: { create: jest.fn() } } }));
beforeEach(() => {
  jest.clearAllMocks();
  (db.emailLog.create as jest.Mock).mockResolvedValue({ id: "saved-log" });
});
it("logs only a real provider acknowledgement as accepted", async () => {
  const result = await auditEmailDelivery(
    "recipient@example.com",
    "Saved subject",
    "smtp",
    () => Promise.resolve({ success: true, messageId: "real-provider-id" }),
    { templateId: "saved-template" }
  );
  expect(result.success).toBe(true);
  expect(db.emailLog.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      status: "accepted",
      to: "recipient@example.com",
      templateId: "saved-template",
      sentAt: expect.any(Date),
    }),
  });
});
it.each([
  { success: true, messageId: "dev-123@localhost" },
  { success: true },
  { success: false, error: "Rejected" },
])("does not invent sent mail for %j", async outcome => {
  const result = await auditEmailDelivery(
    "recipient@example.com",
    "Subject",
    "smtp",
    () => Promise.resolve(outcome)
  );
  expect(result.success).toBe(false);
  expect(db.emailLog.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ status: "failed", sentAt: null }),
  });
});
it("records thrown provider errors", async () => {
  const result = await auditEmailDelivery(
    "recipient@example.com",
    "Subject",
    "smtp",
    () => Promise.reject(new Error("Disconnected"))
  );
  expect(result).toMatchObject({ success: false, error: "Disconnected" });
});
it("audit failure cannot cause a successful send to be retried", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  (db.emailLog.create as jest.Mock).mockRejectedValue(new Error("DB down"));
  expect(
    await auditEmailDelivery("recipient@example.com", "Subject", "smtp", () =>
      Promise.resolve({ success: true, messageId: "real" })
    )
  ).toMatchObject({ success: true, messageId: "real" });
  log.mockRestore();
});

it("records rejected SMTP recipients as failed even when other recipients are accepted", async () => {
  const result = await auditEmailDelivery(
    ["accepted@example.test", "rejected@example.test"],
    "Saved subject",
    "smtp",
    () =>
      Promise.resolve({
        success: true,
        messageId: "provider-id",
        rejectedRecipients: ["rejected@example.test"],
      })
  );
  expect(result.success).toBe(true);
  expect(db.emailLog.create).toHaveBeenNthCalledWith(1, {
    data: expect.objectContaining({
      to: "accepted@example.test",
      status: "accepted",
    }),
  });
  expect(db.emailLog.create).toHaveBeenNthCalledWith(2, {
    data: expect.objectContaining({
      to: "rejected@example.test",
      status: "failed",
      sentAt: null,
    }),
  });
});
it("does not count an acknowledgement when SMTP rejects every recipient", async () => {
  const result = await auditEmailDelivery(
    "rejected@example.test",
    "Subject",
    "smtp",
    () =>
      Promise.resolve({
        success: true,
        messageId: "provider-id",
        rejectedRecipients: ["rejected@example.test"],
      })
  );
  expect(result.success).toBe(false);
  expect(db.emailLog.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ status: "failed" }),
  });
});
