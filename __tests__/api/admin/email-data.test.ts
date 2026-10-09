import { NextRequest } from "next/server";

import { POST as campaignSEND } from "@/app/api/admin/email-campaigns/[id]/send/route";
import { GET as dashboardGET } from "@/app/api/admin/email-dashboard/route";
import { GET as logsGET } from "@/app/api/admin/email-logs/route";
import { GET as metricsGET } from "@/app/api/admin/email-metrics/route";
import { POST as sequencePOST } from "@/app/api/admin/email-sequences/route";
import { GET as subscribersGET } from "@/app/api/admin/email-subscribers/route";
import {
  GET as templatesGET,
  POST as templatesPOST,
} from "@/app/api/admin/email-templates/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendAuditedAdminEmail } from "@/lib/email/admin-delivery";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => {
  const table = () => ({
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  });
  return {
    db: {
      emailTemplate: table(),
      newsletter: table(),
      emailLog: table(),
      emailTrigger: table(),
      emailTriggerExecution: table(),
      emailSequence: table(),
      emailCampaign: table(),
      emailEvent: table(),
      $queryRaw: jest.fn(),
    },
  };
});
jest.mock("@/lib/email/admin-delivery", () => ({
  sendAuditedAdminEmail: jest.fn(),
}));
const request = (path: string, body?: unknown) =>
  new NextRequest(`http://localhost:3012${path}`, {
    method: body ? "POST" : "GET",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
const template = {
  id: "saved-template",
  name: "Confirmare",
  slug: "confirmare",
  subject: "Comanda",
  content: "<p>Conținut salvat</p>",
  category: "returns",
  isActive: true,
};
const admin = { user: { role: "ADMIN", id: "actual-admin" } };
beforeEach(() => {
  jest.clearAllMocks();
  (auth as jest.Mock).mockResolvedValue(admin);
  for (const name of [
    "emailTemplate",
    "newsletter",
    "emailLog",
    "emailTrigger",
    "emailTriggerExecution",
    "emailSequence",
    "emailCampaign",
  ] as const) {
    (db[name].count as jest.Mock).mockResolvedValue(0);
    (db[name].findMany as jest.Mock).mockResolvedValue([]);
  }
  (db.$queryRaw as jest.Mock).mockResolvedValue([
    {
      sent: BigInt(0),
      opened: BigInt(0),
      clicked: BigInt(0),
      bounced: BigInt(0),
      unsubscribed: BigInt(0),
      delivered: BigInt(0),
    },
  ]);
});

it.each([
  null,
  { user: { role: "CUSTOMER" } },
  { user: { role: "VISITOR" } },
  { user: { role: "SUPPLIER" } },
])("denies all private email reads for %j", async session => {
  (auth as jest.Mock).mockResolvedValue(session);
  for (const handler of [
    templatesGET,
    dashboardGET,
    subscribersGET,
    logsGET,
    metricsGET,
  ]) {
    const response = await handler(request("/api/admin/email"));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  }
  expect(db.emailTemplate.findMany).not.toHaveBeenCalled();
  expect(db.$queryRaw).not.toHaveBeenCalled();
});
it("All means no category/status restriction and returns saved content/categories", async () => {
  (db.emailTemplate.findMany as jest.Mock)
    .mockResolvedValueOnce([template])
    .mockResolvedValueOnce([{ category: "returns" }]);
  (db.emailTemplate.count as jest.Mock).mockResolvedValue(1);
  const response = await templatesGET(
    request("/api/admin/email-templates?category=all&isActive=all")
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(db.emailTemplate.findMany).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ where: {}, skip: 0, take: 20 })
  );
  expect(await response.json()).toMatchObject({
    templates: [template],
    categories: ["returns"],
    pagination: { total: 1 },
  });
});
it.each(["page=-1", "limit=101", "isActive=unknown"])(
  "rejects invalid list query %s",
  async query => {
    expect(
      (await templatesGET(request(`/api/admin/email-templates?${query}`)))
        .status
    ).toBe(400);
    expect(db.emailTemplate.findMany).not.toHaveBeenCalled();
  }
);
it("explicit inactive filtering stays inactive", async () => {
  await templatesGET(request("/api/admin/email-templates?isActive=false"));
  expect(db.emailTemplate.count).toHaveBeenCalledWith({
    where: { isActive: false },
  });
});
it("counts subscribers from newsletter, independently of template count", async () => {
  (db.emailTemplate.count as jest.Mock).mockResolvedValue(28);
  (db.newsletter.count as jest.Mock).mockImplementation(({ where }) =>
    Promise.resolve(where.isActive ? 7 : 2)
  );
  const result = await (await dashboardGET()).json();
  expect(result.counts).toMatchObject({
    templates: 28,
    subscribers: 7,
    inactiveSubscribers: 2,
  });
  expect(result.metrics.openRate).toBeNull();
});
it("database failure is an error, never an empty list or zero dashboard", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  (db.emailTemplate.count as jest.Mock).mockRejectedValue(new Error("DB down"));
  const response = await dashboardGET();
  expect(response.status).toBe(500);
  expect((await response.json()).counts).toBeUndefined();
  log.mockRestore();
});
it("does not bypass authentication for template creation", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  expect(
    (await templatesPOST(request("/api/admin/email-templates", template)))
      .status
  ).toBe(401);
  expect(db.emailTemplate.create).not.toHaveBeenCalled();
});
it("creates sequences with real persisted step content and cooldownHours", async () => {
  (db.emailTemplate.findMany as jest.Mock).mockResolvedValue([template]);
  (db.emailSequence.create as jest.Mock).mockResolvedValue({
    id: "persisted-sequence",
  });
  const response = await sequencePOST(
    request("/api/admin/email-sequences", {
      name: "Saved",
      trigger: "USER_REGISTRATION",
      maxEmails: 2,
      cooldownHours: 12,
      steps: [{ templateId: template.id, delayHours: 4 }],
    })
  );
  expect(response.status).toBe(201);
  expect(db.emailSequence.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        createdBy: "actual-admin",
        cooldownHours: 12,
        steps: {
          create: [
            expect.objectContaining({
              content: template.content,
              subject: template.subject,
              delayHours: 4,
            }),
          ],
        },
      }),
    })
  );
});
it("rejects unsupported visual-flow fields instead of pretending they were saved", async () => {
  expect(
    (
      await sequencePOST(
        request("/api/admin/email-sequences", {
          name: "Flow",
          trigger: "CUSTOM",
          flowData: {},
        })
      )
    ).status
  ).toBe(400);
  expect(db.emailSequence.create).not.toHaveBeenCalled();
});
const draft = {
  id: "campaign",
  status: "DRAFT",
  subject: "Salut",
  content: "<p>Salut</p>",
  templateId: template.id,
  template,
};
it("refuses campaign recipients absent from active subscriptions", async () => {
  (db.emailCampaign.findUnique as jest.Mock).mockResolvedValue(draft);
  const response = await campaignSEND(
    request("/api/admin/email-campaigns/campaign/send", {
      recipientEmails: ["chosen@example.com"],
    }),
    { params: Promise.resolve({ id: "campaign" }) }
  );
  expect(response.status).toBe(400);
  expect(sendAuditedAdminEmail).not.toHaveBeenCalled();
});
it("test sends use the chosen recipient, direct provider delivery, and never complete the draft", async () => {
  (db.emailCampaign.findUnique as jest.Mock).mockResolvedValue(draft);
  (sendAuditedAdminEmail as jest.Mock).mockResolvedValue({
    success: true,
    jobId: "provider-real-id",
  });
  const response = await campaignSEND(
    request("/api/admin/email-campaigns/campaign/send", {
      recipientEmails: ["chosen@example.com"],
      testMode: true,
    }),
    { params: Promise.resolve({ id: "campaign" }) }
  );
  expect(response.status).toBe(200);
  expect(sendAuditedAdminEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "chosen@example.com",
      subject: draft.subject,
      html: draft.content,
      audit: expect.objectContaining({ testMode: true }),
    })
  );
  expect(db.emailCampaign.update).not.toHaveBeenCalled();
});
it("provider failure reports failed and never records SENT or BOUNCED", async () => {
  (db.emailCampaign.findUnique as jest.Mock).mockResolvedValue(draft);
  (sendAuditedAdminEmail as jest.Mock).mockResolvedValue({
    success: false,
    error: "Provider rejected",
  });
  const response = await campaignSEND(
    request("/api/admin/email-campaigns/campaign/send", {
      recipientEmails: ["chosen@example.com"],
      testMode: true,
    }),
    { params: Promise.resolve({ id: "campaign" }) }
  );
  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({
    success: false,
    summary: { successful: 0, failed: 1 },
  });
  expect(db.emailEvent.create).not.toHaveBeenCalled();
});
