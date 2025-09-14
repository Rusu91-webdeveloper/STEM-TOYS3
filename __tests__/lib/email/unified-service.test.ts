/**
 * @jest-environment node
 */

import { UnifiedEmailService } from "@/lib/email/unified-service";
import { EmailProvider, UnifiedEmailRequest } from "@/lib/email/types";

class SucceedProvider implements EmailProvider {
  readonly name = "succeed";
  async send() {
    return { success: true, messageId: "msg-123" };
  }
}

class FailProvider implements EmailProvider {
  readonly name = "fail";
  async send() {
    throw new Error("provider failed");
  }
}

describe("UnifiedEmailService", () => {
  const baseRequest: UnifiedEmailRequest = {
    to: "test@example.com",
    template: "test-template",
    variables: {},
    subject: "Test",
    html: "<p>Hi</p>",
  };

  it("sends with primary provider when successful", async () => {
    const service = new UnifiedEmailService({
      primaryProvider: new SucceedProvider(),
      fromEmail: "noreply@example.com",
    });

    const res = await service.sendEmail(baseRequest);
    expect(res.success).toBe(true);
    expect(res.provider).toBe("succeed");
    expect(res.messageId).toBe("msg-123");
    expect(res.metrics.retryCount).toBe(0);
  });

  it("fails over to fallback when primary throws", async () => {
    const service = new UnifiedEmailService({
      primaryProvider: new FailProvider(),
      fallbackProvider: new SucceedProvider(),
      fromEmail: "noreply@example.com",
    });

    const res = await service.sendEmail(baseRequest);
    expect(res.success).toBe(true);
    expect(res.provider).toBe("succeed");
    expect(res.metrics.retryCount).toBe(1);
  });

  it("returns failure when all providers fail", async () => {
    const service = new UnifiedEmailService({
      primaryProvider: new FailProvider(),
      fallbackProvider: new FailProvider(),
      fromEmail: "noreply@example.com",
    });

    const res = await service.sendEmail(baseRequest);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.metrics.retryCount).toBe(1);
  });
});
