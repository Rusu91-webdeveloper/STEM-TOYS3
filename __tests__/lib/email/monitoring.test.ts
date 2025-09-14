/**
 * @jest-environment node
 */

import {
  getEmailAnalytics,
  getEmailStatus,
  trackDeliveryStatus,
  trackEmailOpen,
  trackEmailClick,
  trackEmailBounce,
  getEmailPerformanceSummary,
} from "@/lib/email/monitoring";
import { EmailDeliveryStatus, EmailEventType } from "@/lib/email/types";

// Mock prisma
const mockPrisma = {
  emailEvent: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("Email Monitoring System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEmailAnalytics", () => {
    it("should calculate correct metrics from email events", async () => {
      const mockEvents = [
        {
          eventType: EmailEventType.SENT,
          deliveryStatus: EmailDeliveryStatus.SENT,
          metadata: { provider: "resend" },
          templateId: "welcome",
          campaignId: "campaign-1",
          createdAt: new Date("2024-01-01"),
        },
        {
          eventType: EmailEventType.DELIVERED,
          deliveryStatus: EmailDeliveryStatus.DELIVERED,
          metadata: { provider: "resend" },
          templateId: "welcome",
          campaignId: "campaign-1",
          createdAt: new Date("2024-01-01"),
        },
        {
          eventType: EmailEventType.OPENED,
          deliveryStatus: EmailDeliveryStatus.OPENED,
          metadata: { provider: "resend" },
          templateId: "welcome",
          campaignId: "campaign-1",
          createdAt: new Date("2024-01-01"),
        },
        {
          eventType: EmailEventType.CLICKED,
          deliveryStatus: EmailDeliveryStatus.CLICKED,
          metadata: { provider: "resend" },
          templateId: "welcome",
          campaignId: "campaign-1",
          createdAt: new Date("2024-01-01"),
        },
        {
          eventType: EmailEventType.BOUNCED,
          deliveryStatus: EmailDeliveryStatus.BOUNCED,
          metadata: { provider: "brevo" },
          templateId: "newsletter",
          campaignId: "campaign-2",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockPrisma.emailEvent.findMany.mockResolvedValue(mockEvents);

      const analytics = await getEmailAnalytics();

      expect(analytics.metrics).toEqual({
        totalSent: 1,
        totalDelivered: 1,
        totalOpened: 1,
        totalClicked: 1,
        totalBounced: 1,
        totalFailed: 0,
        deliveryRate: 100,
        openRate: 100,
        clickRate: 100,
        bounceRate: 100,
        failureRate: 0,
      });

      expect(analytics.byProvider).toHaveProperty("resend");
      expect(analytics.byProvider).toHaveProperty("brevo");
      expect(analytics.byTemplate).toHaveProperty("welcome");
      expect(analytics.byTemplate).toHaveProperty("newsletter");
      expect(analytics.byCampaign).toHaveProperty("campaign-1");
      expect(analytics.byCampaign).toHaveProperty("campaign-2");
    });

    it("should handle empty events array", async () => {
      mockPrisma.emailEvent.findMany.mockResolvedValue([]);

      const analytics = await getEmailAnalytics();

      expect(analytics.metrics).toEqual({
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalFailed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        failureRate: 0,
      });
    });

    it("should apply date filters correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      mockPrisma.emailEvent.findMany.mockResolvedValue([]);

      await getEmailAnalytics(startDate, endDate);

      expect(mockPrisma.emailEvent.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          campaign: true,
          template: true,
        },
      });
    });

    it("should apply provider filter correctly", async () => {
      mockPrisma.emailEvent.findMany.mockResolvedValue([]);

      await getEmailAnalytics(undefined, undefined, { provider: "resend" });

      expect(mockPrisma.emailEvent.findMany).toHaveBeenCalledWith({
        where: {
          metadata: {
            path: ["provider"],
            equals: "resend",
          },
        },
        include: {
          campaign: true,
          template: true,
        },
      });
    });
  });

  describe("getEmailStatus", () => {
    it("should return email status with events", async () => {
      const mockEvents = [
        {
          eventType: EmailEventType.SENT,
          deliveryStatus: EmailDeliveryStatus.SENT,
          createdAt: new Date("2024-01-01T10:00:00Z"),
          metadata: { provider: "resend" },
        },
        {
          eventType: EmailEventType.DELIVERED,
          deliveryStatus: EmailDeliveryStatus.DELIVERED,
          createdAt: new Date("2024-01-01T10:01:00Z"),
          metadata: { provider: "resend" },
        },
        {
          eventType: EmailEventType.OPENED,
          deliveryStatus: EmailDeliveryStatus.OPENED,
          createdAt: new Date("2024-01-01T10:05:00Z"),
          metadata: { provider: "resend" },
        },
      ];

      mockPrisma.emailEvent.findMany.mockResolvedValue(mockEvents);

      const status = await getEmailStatus("email-123");

      expect(status).toEqual({
        emailId: "email-123",
        status: EmailDeliveryStatus.OPENED,
        events: [
          {
            eventType: EmailEventType.SENT,
            deliveryStatus: EmailDeliveryStatus.SENT,
            timestamp: new Date("2024-01-01T10:00:00Z"),
            metadata: { provider: "resend" },
          },
          {
            eventType: EmailEventType.DELIVERED,
            deliveryStatus: EmailDeliveryStatus.DELIVERED,
            timestamp: new Date("2024-01-01T10:01:00Z"),
            metadata: { provider: "resend" },
          },
          {
            eventType: EmailEventType.OPENED,
            deliveryStatus: EmailDeliveryStatus.OPENED,
            timestamp: new Date("2024-01-01T10:05:00Z"),
            metadata: { provider: "resend" },
          },
        ],
      });
    });

    it("should return PENDING status when no events found", async () => {
      mockPrisma.emailEvent.findMany.mockResolvedValue([]);

      const status = await getEmailStatus("email-123");

      expect(status).toEqual({
        emailId: "email-123",
        status: EmailDeliveryStatus.PENDING,
        events: [],
      });
    });
  });

  describe("trackDeliveryStatus", () => {
    it("should update delivery status for existing email", async () => {
      const mockEvent = {
        id: "event-123",
        emailId: "email-123",
        deliveryStatus: EmailDeliveryStatus.SENT,
        metadata: { provider: "resend" },
      };

      mockPrisma.emailEvent.findFirst.mockResolvedValue(mockEvent);
      mockPrisma.emailEvent.update.mockResolvedValue({});

      await trackDeliveryStatus("email-123", EmailDeliveryStatus.DELIVERED, {
        deliveredAt: "2024-01-01T10:01:00Z",
      });

      expect(mockPrisma.emailEvent.findFirst).toHaveBeenCalledWith({
        where: { emailId: "email-123" },
        orderBy: { createdAt: "desc" },
      });

      expect(mockPrisma.emailEvent.update).toHaveBeenCalledWith({
        where: { id: "event-123" },
        data: {
          deliveryStatus: EmailDeliveryStatus.DELIVERED,
          metadata: {
            provider: "resend",
            deliveredAt: "2024-01-01T10:01:00Z",
            statusUpdatedAt: expect.any(String),
          },
        },
      });
    });

    it("should handle case when no email event found", async () => {
      mockPrisma.emailEvent.findFirst.mockResolvedValue(null);

      await trackDeliveryStatus("email-123", EmailDeliveryStatus.DELIVERED);

      expect(mockPrisma.emailEvent.update).not.toHaveBeenCalled();
    });
  });

  describe("trackEmailOpen", () => {
    it("should create open event and update delivery status", async () => {
      mockPrisma.emailEvent.create.mockResolvedValue({});
      mockPrisma.emailEvent.findFirst.mockResolvedValue({
        id: "event-123",
        emailId: "email-123",
        deliveryStatus: EmailDeliveryStatus.SENT,
        metadata: {},
      });
      mockPrisma.emailEvent.update.mockResolvedValue({});

      await trackEmailOpen("email-123", { openedAt: "2024-01-01T10:05:00Z" });

      expect(mockPrisma.emailEvent.create).toHaveBeenCalledWith({
        data: {
          emailId: expect.stringMatching(/email-123-open-\d+/),
          email: "",
          eventType: EmailEventType.OPENED,
          deliveryStatus: EmailDeliveryStatus.OPENED,
          metadata: {
            openedAt: "2024-01-01T10:05:00Z",
          },
        },
      });
    });
  });

  describe("trackEmailClick", () => {
    it("should create click event with link URL", async () => {
      mockPrisma.emailEvent.create.mockResolvedValue({});
      mockPrisma.emailEvent.findFirst.mockResolvedValue({
        id: "event-123",
        emailId: "email-123",
        deliveryStatus: EmailDeliveryStatus.OPENED,
        metadata: {},
      });
      mockPrisma.emailEvent.update.mockResolvedValue({});

      await trackEmailClick("email-123", "https://example.com/link", {
        clickedAt: "2024-01-01T10:10:00Z",
      });

      expect(mockPrisma.emailEvent.create).toHaveBeenCalledWith({
        data: {
          emailId: expect.stringMatching(/email-123-click-\d+/),
          email: "",
          eventType: EmailEventType.CLICKED,
          deliveryStatus: EmailDeliveryStatus.CLICKED,
          metadata: {
            linkUrl: "https://example.com/link",
            clickedAt: "2024-01-01T10:10:00Z",
          },
        },
      });
    });
  });

  describe("trackEmailBounce", () => {
    it("should create bounce event with bounce type and reason", async () => {
      mockPrisma.emailEvent.create.mockResolvedValue({});
      mockPrisma.emailEvent.findFirst.mockResolvedValue({
        id: "event-123",
        emailId: "email-123",
        deliveryStatus: EmailDeliveryStatus.SENT,
        metadata: {},
      });
      mockPrisma.emailEvent.update.mockResolvedValue({});

      await trackEmailBounce("email-123", "hard", "Invalid email address", {
        bouncedAt: "2024-01-01T10:02:00Z",
      });

      expect(mockPrisma.emailEvent.create).toHaveBeenCalledWith({
        data: {
          emailId: expect.stringMatching(/email-123-bounce-\d+/),
          email: "",
          eventType: EmailEventType.BOUNCED,
          deliveryStatus: EmailDeliveryStatus.BOUNCED,
          metadata: {
            bounceType: "hard",
            reason: "Invalid email address",
            bouncedAt: "2024-01-01T10:02:00Z",
          },
        },
      });
    });
  });

  describe("getEmailPerformanceSummary", () => {
    it("should return performance summary for specified period", async () => {
      const mockEvents = [
        {
          eventType: EmailEventType.SENT,
          deliveryStatus: EmailDeliveryStatus.SENT,
          templateId: "welcome",
          campaignId: "campaign-1",
          createdAt: new Date("2024-01-01"),
        },
        {
          eventType: EmailEventType.DELIVERED,
          deliveryStatus: EmailDeliveryStatus.DELIVERED,
          templateId: "welcome",
          campaignId: "campaign-1",
          createdAt: new Date("2024-01-01"),
        },
        {
          eventType: EmailEventType.OPENED,
          deliveryStatus: EmailDeliveryStatus.OPENED,
          templateId: "welcome",
          campaignId: "campaign-1",
          createdAt: new Date("2024-01-01"),
        },
      ];

      mockPrisma.emailEvent.findMany.mockResolvedValue(mockEvents);

      const summary = await getEmailPerformanceSummary(30);

      expect(summary).toEqual({
        period: "Last 30 days",
        totalEmails: 1,
        deliveryRate: 100,
        openRate: 100,
        clickRate: 0,
        bounceRate: 0,
        topPerformingTemplates: expect.any(Array),
        topPerformingCampaigns: expect.any(Array),
      });
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.emailEvent.findMany.mockRejectedValue(
        new Error("Database error")
      );

      await expect(getEmailAnalytics()).rejects.toThrow("Database error");
    });

    it("should not throw when tracking events fail", async () => {
      mockPrisma.emailEvent.create.mockRejectedValue(
        new Error("Database error")
      );

      // Should not throw
      await expect(trackEmailOpen("email-123")).resolves.toBeUndefined();
    });
  });
});
