import { sendEmailWithBrevo } from "@/lib/brevo";
import { db } from "@/lib/db";
import { emailAnalyticsEngine } from "@/lib/email/analytics-engine";
import { EmailService } from "@/lib/email/email-service";
import { emailPerformanceEngine } from "@/lib/email/performance-engine";

jest.mock("@/lib/brevo", () => ({ sendEmailWithBrevo: jest.fn() }));
jest.mock("@/lib/utils/store-settings", () => ({
  getStoreSettings: jest.fn().mockResolvedValue({
    storeName: "Saved store",
    contactEmail: "owner@example.test",
  }),
}));
jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({
          id: "saved-user",
          name: "Saved Name",
          email: "saved@example.test",
        }),
    },
    emailTemplate: {
      findFirst: jest.fn().mockResolvedValue({
        id: "saved-template",
        slug: "welcome",
        name: "Saved template",
        subject: "Saved subject",
        content: "<p>Saved body</p>",
        variables: [],
        category: "welcome",
        isActive: true,
      }),
    },
  },
}));
jest.mock("@/lib/email/base", () => ({
  generateProfessionalEmail: (content: string) => content,
  generatePreviewText: () => "",
}));
jest.mock("@/lib/email/analytics-engine", () => ({
  emailAnalyticsEngine: { trackEmailEvent: jest.fn() },
}));
jest.mock("@/lib/email/automation-engine", () => ({
  emailAutomationEngine: { processUserAction: jest.fn() },
}));
jest.mock("@/lib/email/performance-engine", () => ({
  emailPerformanceEngine: {
    optimizeEmailContent: (content: string) => Promise.resolve(content),
    queueEmail: jest.fn(),
  },
}));
jest.mock("@/lib/email/personalization-engine", () => ({
  personalizationEngine: {
    getUserProfile: jest.fn().mockResolvedValue(null),
    getPersonalizationContext: jest.fn().mockResolvedValue(null),
  },
}));
const request = {
  to: "saved@example.test",
  userId: "saved-user",
  subject: "Saved subject",
  template: "unknown",
  data: {},
};
let log: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  log = jest.spyOn(console, "error").mockImplementation(() => {});
  (db.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
    id: "saved-template",
    slug: "welcome",
    name: "Saved template",
    subject: "Saved subject",
    content: "<p>Saved body</p>",
    variables: [],
    category: "welcome",
    isActive: true,
  });
});
afterEach(() => log.mockRestore());
it("requires real provider acceptance rather than an in-memory queue acknowledgement", async () => {
  (sendEmailWithBrevo as jest.Mock).mockResolvedValue({
    success: true,
    messageId: "provider-id",
  });
  const result = await new EmailService().sendEmail(request);
  expect(result).toMatchObject({ success: true, emailId: "provider-id" });
  expect(emailPerformanceEngine.queueEmail).not.toHaveBeenCalled();
  expect(db.emailTemplate.findFirst).toHaveBeenCalledWith({
    where: { isActive: true, OR: [{ id: "unknown" }, { slug: "unknown" }] },
  });
  expect(sendEmailWithBrevo).toHaveBeenCalledWith(
    expect.objectContaining({
      html: "<p>Saved body</p>",
      subject: "Saved subject",
    })
  );
  expect(emailAnalyticsEngine.trackEmailEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      emailId: "provider-id",
      eventType: "sent",
      metadata: expect.objectContaining({ providerAccepted: true }),
    })
  );
});
it("does not create a send event when the provider fails", async () => {
  (sendEmailWithBrevo as jest.Mock).mockResolvedValue({
    success: false,
    error: "Rejected",
  });
  const result = await new EmailService().sendEmail(request);
  expect(result).toMatchObject({ success: false, error: "Rejected" });
  expect(emailAnalyticsEngine.trackEmailEvent).not.toHaveBeenCalled();
});
it("does not turn acceptance into a retryable send failure if analytics fails", async () => {
  (sendEmailWithBrevo as jest.Mock).mockResolvedValue({
    success: true,
    messageId: "provider-id",
  });
  (emailAnalyticsEngine.trackEmailEvent as jest.Mock).mockRejectedValue(
    new Error("DB down")
  );
  expect(await new EmailService().sendEmail(request)).toMatchObject({
    success: true,
    emailId: "provider-id",
  });
});

it("reports a missing saved template instead of falling back to invented content", async () => {
  (db.emailTemplate.findFirst as jest.Mock).mockResolvedValue(null);
  expect(await new EmailService().sendEmail(request)).toMatchObject({
    success: false,
  });
  expect(sendEmailWithBrevo).not.toHaveBeenCalled();
  expect(emailAnalyticsEngine.trackEmailEvent).not.toHaveBeenCalled();
});

it("welcome sends the stored template rather than reporting a different code template as sent", async () => {
  (sendEmailWithBrevo as jest.Mock).mockResolvedValue({
    success: true,
    messageId: "welcome-provider",
  });
  expect(
    await new EmailService().sendWelcomeEmail(
      "saved-user",
      "saved@example.test"
    )
  ).toMatchObject({ success: true, emailId: "welcome-provider" });
  expect(sendEmailWithBrevo).toHaveBeenCalledWith(
    expect.objectContaining({
      html: "<p>Saved body</p>",
      subject: "Saved subject",
    })
  );
});

it("fills nested variables from the actual send context", async () => {
  (db.emailTemplate.findFirst as jest.Mock).mockResolvedValue({
    id: "saved",
    subject: "Hello {{user.name}}",
    content: "<p>{{order.total}}</p>",
  });
  (sendEmailWithBrevo as jest.Mock).mockResolvedValue({
    success: true,
    messageId: "provider-id",
  });
  expect(
    await new EmailService().sendEmail({
      ...request,
      data: { user: { name: "Saved Name" }, order: { total: 25 } },
    })
  ).toMatchObject({ success: true });
  expect(sendEmailWithBrevo).toHaveBeenCalledWith(
    expect.objectContaining({ subject: "Hello Saved Name", html: "<p>25</p>" })
  );
});
