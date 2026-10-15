/** @jest-environment node */
import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

import { PATCH } from "@/app/api/admin/orders/[id]/route";
import { db } from "@/lib/db";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: "admin", role: "ADMIN" } }),
}));
jest.mock("@/lib/csrf", () => ({
  validateCsrfForRequest: jest.fn().mockResolvedValue({ valid: true }),
}));
jest.mock("@/lib/cache", () => ({ invalidateCachePattern: jest.fn() }));
jest.mock("@/lib/cache/analytics-cache", () => ({
  invalidateAnalyticsOnOrderChange: jest.fn(),
}));
jest.mock("@/lib/checkout/release-cod-hold", () => ({
  releaseCodGuaranteeHoldIfNeeded: jest.fn().mockResolvedValue(null),
}));
jest.mock("@/lib/db", () => ({
  db: {
    order: { findFirst: jest.fn(), update: jest.fn() },
    emailLog: { create: jest.fn().mockResolvedValue({ id: "email-log" }) },
  },
}));
jest.mock("@prisma/client", () => ({ PrismaClient: jest.fn(() => ({})) }));
jest.mock("@/lib/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}));
jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn(),
    })),
  },
}));
jest.mock("@/lib/email/index", () => ({
  getEmailService: () => ({
    sendEmail: jest.fn().mockResolvedValue({
      success: false,
      error: "Brevo API rejected the message (synthetic failure)",
    }),
  }),
}));
jest.mock("@/lib/email/base", () => ({
  getStoreSettings: jest.fn().mockResolvedValue({ storeName: "TechTots" }),
  getBaseUrl: () => "https://shop.example",
  generateProfessionalEmail: (content: string) => content,
  generatePreviewText: (content: string) => content,
  formatPrice: (value: number) => `${value} RON`,
}));
jest.mock("@/lib/products/review-invitation", () => ({}));

const params = { params: Promise.resolve({ id: "internal-order" }) };
const reason = "Produs indisponibil la furnizor";
const updatedOrder = {
  id: "internal-order",
  orderNumber: "ORD-CANCEL-TEST",
  status: "CANCELLED",
  total: 100,
  paymentMethod: "cash_on_delivery",
  createdAt: new Date("2026-10-15T07:00:00Z"),
  user: { name: "Client", email: "client@example.test" },
  items: [{ name: "Robot", quantity: 1, price: 100 }],
};
const originalEnv = { ...process.env };
let sendMail: jest.Mock;

function cancel(cancellationReason: string | null = reason) {
  return PATCH(
    new NextRequest("https://shop.example/api/admin/orders/internal-order", {
      method: "PATCH",
      body: JSON.stringify({
        status: "CANCELLED",
        cancellationReason: cancellationReason ?? undefined,
      }),
    }),
    params
  );
}

beforeAll(async () => {
  process.env.EMAIL_USER = "smtp@example.test";
  process.env.EMAIL_PASS = "synthetic-password";
  process.env.EMAIL_FROM = "smtp@example.test";
  delete process.env.RESEND_API_KEY;
  await import("@/lib/nodemailer");
  sendMail = (nodemailer.createTransport as jest.Mock).mock.results[0].value
    .sendMail;
});
afterAll(() => {
  process.env = originalEnv;
});
beforeEach(() => {
  jest.clearAllMocks();
  (db.order.findFirst as jest.Mock).mockResolvedValue({
    ...updatedOrder,
    status: "PROCESSING",
    notes: "Existing note",
  });
  (db.order.update as jest.Mock).mockResolvedValue(updatedOrder);
  sendMail.mockResolvedValue({
    messageId: "<cancellation@example.test>",
    accepted: ["client@example.test"],
    rejected: [],
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it("sends the reason using the order-confirmation SMTP transport and records acceptance", async () => {
  const response = await cancel();
  expect(response.status).toBe(200);
  expect(console.error).not.toHaveBeenCalled();
  expect((await response.json()).emailNotification).toEqual({
    status: "accepted",
  });
  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "client@example.test",
      subject: expect.stringContaining("ORD-CANCEL-TEST"),
      html: expect.stringContaining(reason),
      text: expect.stringContaining(reason),
    })
  );
  expect(db.emailLog.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: "accepted" }),
    })
  );
  expect(db.order.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        status: "CANCELLED",
        notes: `Existing note | Cancellation reason: ${reason}`,
      },
    })
  );
});

it.each(["exception", "rejected", "missing-id"])(
  "reports SMTP %s separately while keeping the order cancelled",
  async failure => {
    if (failure === "exception")
      sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    if (failure === "rejected")
      sendMail.mockResolvedValueOnce({
        messageId: "rejected",
        rejected: ["client@example.test"],
      });
    if (failure === "missing-id")
      sendMail.mockResolvedValueOnce({ rejected: [] });
    const response = await cancel();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.order.status).toBe("Cancelled");
    expect(data.emailNotification.status).toBe("failed");
    expect(db.emailLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed", sentAt: null }),
      })
    );
    expect(db.order.update).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
  }
);

it("reports a missing customer email without attempting a send", async () => {
  (db.order.update as jest.Mock).mockResolvedValue({
    ...updatedOrder,
    user: null,
  });
  const response = await cancel();
  expect(response.status).toBe(200);
  expect((await response.json()).emailNotification.status).toBe("failed");
  expect(sendMail).not.toHaveBeenCalled();
});

it("does not resend when the submitted status was already cancelled", async () => {
  (db.order.findFirst as jest.Mock).mockResolvedValue({
    ...updatedOrder,
    notes: "Existing reason",
  });
  const response = await cancel();
  expect(response.status).toBe(200);
  expect((await response.json()).emailNotification.status).toBe("not-required");
  expect(sendMail).not.toHaveBeenCalled();
  expect(db.order.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: { status: "CANCELLED" } })
  );
});

it("sends cancellation without inventing a reason when none was supplied", async () => {
  const response = await cancel(null);
  expect((await response.json()).emailNotification.status).toBe("accepted");
  const sent = sendMail.mock.calls[0][0];
  expect(sent.html).not.toContain("Motivul anulării");
  expect(sent.text).not.toContain("undefined");
  expect(sent.text).not.toContain("Motivul anulării");
});

it("preserves Romanian text and treats markup in the reason as text", async () => {
  const response = await cancel('Lipsă stoc <b>robot</b> & "kit"');
  expect((await response.json()).emailNotification.status).toBe("accepted");
  const sent = sendMail.mock.calls[0][0];
  expect(sent.text).toContain('Lipsă stoc <b>robot</b> & "kit"');
  expect(sent.html).toContain(
    "Lipsă stoc &lt;b&gt;robot&lt;/b&gt; &amp; &quot;kit&quot;"
  );
  expect(sent.html).not.toContain("<b>robot</b>");
});

it("keeps accepted mail successful when audit persistence fails", async () => {
  (db.emailLog.create as jest.Mock).mockRejectedValueOnce(
    new Error("Audit unavailable")
  );
  const response = await cancel();
  expect(response.status).toBe(200);
  expect((await response.json()).emailNotification.status).toBe("accepted");
  expect(sendMail).toHaveBeenCalledTimes(1);
});
