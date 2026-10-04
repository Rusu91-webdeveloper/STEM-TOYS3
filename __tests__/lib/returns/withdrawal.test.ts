import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { sendEmailViaUnifiedSystem } from "@/lib/nodemailer";
import {
  createWithdrawalReceipt,
  receiptText,
  withdrawalSchema,
} from "@/lib/returns/withdrawal";
import {
  deliverWithdrawal,
  registerWithdrawal,
} from "@/lib/returns/withdrawal-service";

jest.mock("@/lib/db", () => ({
  db: {
    emailLog: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));
jest.mock("@/lib/nodemailer", () => ({ sendEmailViaUnifiedSystem: jest.fn() }));
jest.mock("@/lib/config/app-config", () => ({
  appConfig: { contactEmail: "shop@example.invalid" },
  getAppConfig: () =>
    Promise.resolve({ contactEmail: "configured-shop@example.invalid" }),
}));
const input = {
  submissionId: "00000000-0000-4000-8000-000000000001",
  name: "Test Client",
  email: "test@example.invalid",
  contract: "Comanda TEST-1, toate produsele",
  confirmed: true as const,
};
const mail = sendEmailViaUnifiedSystem as jest.Mock;
const logs = db.emailLog as unknown as {
  create: jest.Mock;
  findUnique: jest.Mock;
  updateMany: jest.Mock;
};
let record: { status: string; metadata: object };

beforeEach(() => {
  jest.clearAllMocks();
  logs.create.mockImplementation(({ data }) => {
    record = { status: data.status, metadata: data.metadata };
    return Promise.resolve(data);
  });
  logs.findUnique.mockImplementation(() => Promise.resolve(record));
  logs.updateMany.mockImplementation(({ data }) => {
    record = { ...record, ...data };
    return Promise.resolve({ count: 1 });
  });
  mail.mockResolvedValue({ success: true, messageId: "provider-id" });
});

test("records a guest declaration before mailing, with exact content and server timestamp", async () => {
  const receipt = await registerWithdrawal(input);
  expect(logs.create).toHaveBeenCalledTimes(1);
  expect(logs.create.mock.invocationCallOrder[0]).toBeLessThan(
    mail.mock.invocationCallOrder[0]
  );
  expect(receipt.customerNotified).toBe(true);
  expect(receipt.merchantNotified).toBe(true);
  expect(receiptText(receipt)).toContain(input.contract);
  expect(receiptText(receipt)).toContain(receipt.receivedAt);
  expect(mail).toHaveBeenCalledTimes(2);
  expect(mail.mock.calls[1][0].to).toBe("configured-shop@example.invalid");
  expect(mail.mock.calls[1][0].subject).toBe(
    "TechTots — retragere nouă · 00000001"
  );
  expect(mail.mock.calls[0][0].html).toContain(
    "Am primit declarația ta de retragere"
  );
  expect(mail.mock.calls[1][0].html).toContain("Pașii pentru echipa TechTots");
  expect(mail.mock.calls[0][0].text).toBe(receiptText(receipt));
  expect(mail.mock.calls[1][0].text).toBe(receiptText(receipt));
});

test("confirmation is required; reason, login, photos and delivery status are not", () => {
  expect(withdrawalSchema.safeParse(input).success).toBe(true);
  expect(
    withdrawalSchema.safeParse({ ...input, confirmed: false }).success
  ).toBe(false);
  expect(withdrawalSchema.safeParse({ ...input, name: "  " }).success).toBe(
    false
  );
  expect(
    withdrawalSchema.safeParse({ ...input, email: "invalid" }).success
  ).toBe(false);
});

test("duplicate retry preserves the first timestamp and does not resend completed emails", async () => {
  const first = await registerWithdrawal(input);
  logs.create.mockRejectedValueOnce(
    new Prisma.PrismaClientKnownRequestError("Duplicate", {
      code: "P2002",
      clientVersion: "test",
    })
  );
  const duplicate = await registerWithdrawal(input);
  expect(duplicate.receivedAt).toBe(first.receivedAt);
  expect(mail).toHaveBeenCalledTimes(2);
});

test("a reused reference with changed identity cannot reveal the original receipt", async () => {
  await registerWithdrawal(input);
  logs.create.mockRejectedValueOnce(
    new Prisma.PrismaClientKnownRequestError("Duplicate", {
      code: "P2002",
      clientVersion: "test",
    })
  );
  await expect(
    registerWithdrawal({ ...input, email: "other@example.invalid" })
  ).rejects.toThrow("WITHDRAWAL_REFERENCE_CONFLICT");
});

test("email failure keeps the declaration and retries only the failed recipient", async () => {
  mail.mockRejectedValueOnce(new Error("SMTP unavailable"));
  const first = await registerWithdrawal(input);
  expect(first.customerNotified).toBe(false);
  expect(first.merchantNotified).toBe(true);
  expect(record.status).toBe("failed");
  logs.create.mockRejectedValueOnce(
    new Prisma.PrismaClientKnownRequestError("Duplicate", {
      code: "P2002",
      clientVersion: "test",
    })
  );
  const retried = await registerWithdrawal(input);
  expect(retried.receivedAt).toBe(first.receivedAt);
  expect(retried.customerNotified).toBe(true);
  expect(mail).toHaveBeenCalledTimes(3);
});

test("storage failure never sends a confirmation or claims receipt", async () => {
  logs.create.mockRejectedValueOnce(new Error("Database unavailable"));
  await expect(registerWithdrawal(input)).rejects.toThrow(
    "Database unavailable"
  );
  expect(mail).not.toHaveBeenCalled();
});

test("lost atomic claim or active delivery does not send duplicate emails", async () => {
  logs.updateMany.mockResolvedValueOnce({ count: 0 });
  await registerWithdrawal(input);
  expect(mail).not.toHaveBeenCalled();
  record = {
    status: "sending",
    metadata: {
      ...createWithdrawalReceipt(input),
      lastAttemptAt: new Date().toISOString(),
    },
  };
  logs.create.mockRejectedValueOnce(
    new Prisma.PrismaClientKnownRequestError("Duplicate", {
      code: "P2002",
      clientVersion: "test",
    })
  );
  await registerWithdrawal(input);
  expect(mail).not.toHaveBeenCalled();
});

test("receipt uses escaped HTML, and development simulation is not called email delivery", async () => {
  mail.mockResolvedValue({ success: true, messageId: "dev-1@localhost" });
  const receipt = await registerWithdrawal({ ...input, name: "<script>" });
  expect(mail.mock.calls[0][0].html).toContain("&lt;script&gt;");
  expect(mail.mock.calls[0][0].html).not.toContain("<script>");
  expect(receipt.customerNotified).toBe(false);
});

test("a delivery interrupted by process restart can recover without changing the receipt timestamp", async () => {
  const original = createWithdrawalReceipt(
    input,
    new Date("2026-10-04T12:00:00Z")
  );
  record = {
    status: "sending",
    metadata: {
      ...original,
      lastAttemptAt: new Date(Date.now() - 6 * 60000).toISOString(),
      reviewedAt: "2026-10-04T12:01:00Z",
    },
  };
  const result = await deliverWithdrawal(original.reference);
  expect(result.receivedAt).toBe(original.receivedAt);
  expect(result.reviewedAt).toBe("2026-10-04T12:01:00Z");
  expect(result.customerNotified).toBe(true);
  expect(mail).toHaveBeenCalledTimes(2);
});
