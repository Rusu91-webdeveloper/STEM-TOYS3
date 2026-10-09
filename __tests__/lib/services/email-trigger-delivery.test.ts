import type { PrismaClient } from "@prisma/client";

import { sendAuditedAdminEmail } from "@/lib/email/admin-delivery";
import { EmailTriggerService } from "@/lib/services/email-trigger-service";

jest.mock("@/lib/email/admin-delivery", () => ({
  sendAuditedAdminEmail: jest.fn(),
}));
jest.mock("@/lib/email/database-template-service", () => ({
  DatabaseTemplateService: {
    replaceVariables: (content: string, data: { user: { name: string } }) =>
      content.replace("{{user.name}}", data.user.name),
  },
}));

const trigger = {
  id: "stored-trigger",
  conditions: { event: "saved_event" },
  cooldownHours: 0,
  maxExecutions: null,
  isActive: true,
  status: "ACTIVE",
  actionType: "send_email",
  actionData: { templateId: "stored-template" },
};
const client = {
  emailTrigger: { findMany: jest.fn(), findUnique: jest.fn() },
  emailTemplate: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  newsletter: { findFirst: jest.fn() },
  emailLog: { create: jest.fn(), update: jest.fn() },
  emailTriggerExecution: { create: jest.fn() },
};
beforeEach(() => {
  jest.clearAllMocks();
  client.emailTrigger.findMany.mockResolvedValue([trigger]);
  client.emailTrigger.findUnique.mockResolvedValue(trigger);
  client.newsletter.findFirst.mockResolvedValue({ id: "subscriber" });
  client.user.findUnique.mockResolvedValue({
    name: "Saved Name",
    email: "saved@example.test",
  });
  client.emailTemplate.findUnique.mockResolvedValue({
    id: "stored-template",
    isActive: true,
    subject: "Hello {{user.name}}",
    content: "<p>Saved HTML</p>",
  });
});
const execute = () =>
  new EmailTriggerService(
    client as unknown as PrismaClient
  ).processBehaviorTriggers("saved-user", "saved_event");

it("calls a real delivery boundary using the stored template and recipient", async () => {
  (sendAuditedAdminEmail as jest.Mock).mockResolvedValue({
    success: true,
    jobId: "provider-id",
  });
  await execute();
  expect(sendAuditedAdminEmail).toHaveBeenCalledWith({
    to: "saved@example.test",
    subject: "Hello Saved Name",
    html: "<p>Saved HTML</p>",
    audit: { templateId: "stored-template" },
  });
  expect(client.emailTriggerExecution.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      status: "success",
      actionResult: expect.objectContaining({ messageId: "provider-id" }),
    }),
  });
  expect(client.emailLog.update).not.toHaveBeenCalled();
});
it("records provider failure instead of a fictitious successful execution", async () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  (sendAuditedAdminEmail as jest.Mock).mockResolvedValue({
    success: false,
    error: "Provider rejected",
  });
  await execute();
  expect(client.emailTriggerExecution.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      status: "failed",
      errorMessage: "Provider rejected",
    }),
  });
  expect(client.emailLog.update).not.toHaveBeenCalled();
  consoleError.mockRestore();
});
it("does not send inactive templates", async () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  client.emailTemplate.findUnique.mockResolvedValue({ isActive: false });
  await execute();
  expect(sendAuditedAdminEmail).not.toHaveBeenCalled();
  expect(client.emailTriggerExecution.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ status: "failed" }),
  });
  consoleError.mockRestore();
});

it("does not send marketing triggers to inactive subscribers", async () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  client.newsletter.findFirst.mockResolvedValue(null);
  await execute();
  expect(sendAuditedAdminEmail).not.toHaveBeenCalled();
  expect(client.emailTriggerExecution.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ status: "failed" }),
  });
  consoleError.mockRestore();
});

it("does not execute paused triggers even if their legacy active flag is true", async () => {
  client.emailTrigger.findUnique.mockResolvedValue({
    ...trigger,
    status: "PAUSED",
  });
  await execute();
  expect(sendAuditedAdminEmail).not.toHaveBeenCalled();
  expect(client.emailTriggerExecution.create).not.toHaveBeenCalled();
});
