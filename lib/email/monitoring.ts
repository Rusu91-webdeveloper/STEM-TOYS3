import { prisma } from "@/lib/prisma";
import { EmailDeliveryStatus, EmailEventType } from "./types";

export interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  failureRate: number;
}

export interface EmailAnalytics {
  metrics: EmailMetrics;
  byProvider: Record<string, EmailMetrics>;
  byTemplate: Record<string, EmailMetrics>;
  byCampaign: Record<string, EmailMetrics>;
  timeline: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  }>;
}

/**
 * Get comprehensive email analytics
 */
export async function getEmailAnalytics(
  startDate?: Date,
  endDate?: Date,
  filters?: {
    provider?: string;
    templateId?: string;
    campaignId?: string;
    userId?: string;
  }
): Promise<EmailAnalytics> {
  const whereClause = buildWhereClause(startDate, endDate, filters);

  // Get all email events for the period
  const events = await prisma.emailEvent.findMany({
    where: whereClause,
    include: {
      campaign: true,
      template: true,
    },
  });

  // Calculate overall metrics
  const metrics = calculateMetrics(events);

  // Calculate metrics by provider
  const byProvider = calculateMetricsByProvider(events);

  // Calculate metrics by template
  const byTemplate = calculateMetricsByTemplate(events);

  // Calculate metrics by campaign
  const byCampaign = calculateMetricsByCampaign(events);

  // Calculate timeline data
  const timeline = calculateTimelineData(events, startDate, endDate);

  return {
    metrics,
    byProvider,
    byTemplate,
    byCampaign,
    timeline,
  };
}

/**
 * Get email delivery status for a specific email
 */
export async function getEmailStatus(emailId: string): Promise<{
  emailId: string;
  status: EmailDeliveryStatus;
  events: Array<{
    eventType: EmailEventType;
    deliveryStatus: EmailDeliveryStatus;
    timestamp: Date;
    metadata?: any;
  }>;
}> {
  const events = await prisma.emailEvent.findMany({
    where: { emailId },
    orderBy: { createdAt: "asc" },
  });

  const latestEvent = events[events.length - 1];

  return {
    emailId,
    status: latestEvent?.deliveryStatus || EmailDeliveryStatus.PENDING,
    events: events.map(event => ({
      eventType: event.eventType,
      deliveryStatus: event.deliveryStatus,
      timestamp: event.createdAt,
      metadata: event.metadata,
    })),
  };
}

/**
 * Track email delivery status update
 */
export async function trackDeliveryStatus(
  emailId: string,
  status: EmailDeliveryStatus,
  metadata?: any
): Promise<void> {
  try {
    // Find the latest event for this email
    const latestEvent = await prisma.emailEvent.findFirst({
      where: { emailId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestEvent) {
      console.warn(`No email event found for emailId: ${emailId}`);
      return;
    }

    // Update the delivery status
    await prisma.emailEvent.update({
      where: { id: latestEvent.id },
      data: {
        deliveryStatus: status,
        metadata: {
          ...(latestEvent.metadata as any),
          ...metadata,
          statusUpdatedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`📧 Email ${emailId} status updated to ${status}`);
  } catch (error) {
    console.error("❌ Error tracking delivery status:", error);
  }
}

/**
 * Track email open event
 */
export async function trackEmailOpen(
  emailId: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.emailEvent.create({
      data: {
        emailId: `${emailId}-open-${Date.now()}`,
        email: "", // Will be filled from original event
        eventType: EmailEventType.OPENED,
        deliveryStatus: EmailDeliveryStatus.OPENED,
        metadata: {
          ...metadata,
          openedAt: new Date().toISOString(),
        },
      },
    });

    // Update the original email's delivery status
    await trackDeliveryStatus(emailId, EmailDeliveryStatus.OPENED, metadata);
  } catch (error) {
    console.error("❌ Error tracking email open:", error);
  }
}

/**
 * Track email click event
 */
export async function trackEmailClick(
  emailId: string,
  linkUrl: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.emailEvent.create({
      data: {
        emailId: `${emailId}-click-${Date.now()}`,
        email: "", // Will be filled from original event
        eventType: EmailEventType.CLICKED,
        deliveryStatus: EmailDeliveryStatus.CLICKED,
        metadata: {
          ...metadata,
          linkUrl,
          clickedAt: new Date().toISOString(),
        },
      },
    });

    // Update the original email's delivery status
    await trackDeliveryStatus(emailId, EmailDeliveryStatus.CLICKED, {
      ...metadata,
      linkUrl,
    });
  } catch (error) {
    console.error("❌ Error tracking email click:", error);
  }
}

/**
 * Track email bounce event
 */
export async function trackEmailBounce(
  emailId: string,
  bounceType: "hard" | "soft",
  reason: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.emailEvent.create({
      data: {
        emailId: `${emailId}-bounce-${Date.now()}`,
        email: "", // Will be filled from original event
        eventType: EmailEventType.BOUNCED,
        deliveryStatus: EmailDeliveryStatus.BOUNCED,
        metadata: {
          ...metadata,
          bounceType,
          reason,
          bouncedAt: new Date().toISOString(),
        },
      },
    });

    // Update the original email's delivery status
    await trackDeliveryStatus(emailId, EmailDeliveryStatus.BOUNCED, {
      ...metadata,
      bounceType,
      reason,
    });
  } catch (error) {
    console.error("❌ Error tracking email bounce:", error);
  }
}

/**
 * Get email performance summary
 */
export async function getEmailPerformanceSummary(days: number = 30): Promise<{
  period: string;
  totalEmails: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  topPerformingTemplates: Array<{
    templateId: string;
    templateName: string;
    sent: number;
    openRate: number;
    clickRate: number;
  }>;
  topPerformingCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    sent: number;
    openRate: number;
    clickRate: number;
  }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const analytics = await getEmailAnalytics(startDate, new Date());

  // Get top performing templates
  const topTemplates = Object.entries(analytics.byTemplate)
    .map(([templateId, metrics]) => ({
      templateId,
      templateName: templateId, // Could be enhanced to get actual name
      sent: metrics.totalSent,
      openRate: metrics.openRate,
      clickRate: metrics.clickRate,
    }))
    .sort((a, b) => b.sent - a.sent)
    .slice(0, 5);

  // Get top performing campaigns
  const topCampaigns = Object.entries(analytics.byCampaign)
    .map(([campaignId, metrics]) => ({
      campaignId,
      campaignName: campaignId, // Could be enhanced to get actual name
      sent: metrics.totalSent,
      openRate: metrics.openRate,
      clickRate: metrics.clickRate,
    }))
    .sort((a, b) => b.sent - a.sent)
    .slice(0, 5);

  return {
    period: `Last ${days} days`,
    totalEmails: analytics.metrics.totalSent,
    deliveryRate: analytics.metrics.deliveryRate,
    openRate: analytics.metrics.openRate,
    clickRate: analytics.metrics.clickRate,
    bounceRate: analytics.metrics.bounceRate,
    topPerformingTemplates: topTemplates,
    topPerformingCampaigns: topCampaigns,
  };
}

// Helper functions

function buildWhereClause(
  startDate?: Date,
  endDate?: Date,
  filters?: {
    provider?: string;
    templateId?: string;
    campaignId?: string;
    userId?: string;
  }
) {
  const where: any = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (filters?.templateId) {
    where.templateId = filters.templateId;
  }

  if (filters?.campaignId) {
    where.campaignId = filters.campaignId;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.provider) {
    where.metadata = {
      path: ["provider"],
      equals: filters.provider,
    };
  }

  return where;
}

function calculateMetrics(events: any[]): EmailMetrics {
  const totalSent = events.filter(
    e => e.eventType === EmailEventType.SENT
  ).length;
  const totalDelivered = events.filter(
    e => e.deliveryStatus === EmailDeliveryStatus.DELIVERED
  ).length;
  const totalOpened = events.filter(
    e => e.eventType === EmailEventType.OPENED
  ).length;
  const totalClicked = events.filter(
    e => e.eventType === EmailEventType.CLICKED
  ).length;
  const totalBounced = events.filter(
    e => e.eventType === EmailEventType.BOUNCED
  ).length;
  const totalFailed = events.filter(
    e => e.eventType === EmailEventType.FAILED
  ).length;

  return {
    totalSent,
    totalDelivered,
    totalOpened,
    totalClicked,
    totalBounced,
    totalFailed,
    deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
    openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
    clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
    bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
    failureRate: totalSent > 0 ? (totalFailed / totalSent) * 100 : 0,
  };
}

function calculateMetricsByProvider(
  events: any[]
): Record<string, EmailMetrics> {
  const providers = [
    ...new Set(events.map(e => e.metadata?.provider).filter(Boolean)),
  ];
  const result: Record<string, EmailMetrics> = {};

  for (const provider of providers) {
    const providerEvents = events.filter(
      e => e.metadata?.provider === provider
    );
    result[provider] = calculateMetrics(providerEvents);
  }

  return result;
}

function calculateMetricsByTemplate(
  events: any[]
): Record<string, EmailMetrics> {
  const templates = [...new Set(events.map(e => e.templateId).filter(Boolean))];
  const result: Record<string, EmailMetrics> = {};

  for (const templateId of templates) {
    const templateEvents = events.filter(e => e.templateId === templateId);
    result[templateId] = calculateMetrics(templateEvents);
  }

  return result;
}

function calculateMetricsByCampaign(
  events: any[]
): Record<string, EmailMetrics> {
  const campaigns = [...new Set(events.map(e => e.campaignId).filter(Boolean))];
  const result: Record<string, EmailMetrics> = {};

  for (const campaignId of campaigns) {
    const campaignEvents = events.filter(e => e.campaignId === campaignId);
    result[campaignId] = calculateMetrics(campaignEvents);
  }

  return result;
}

function calculateTimelineData(
  events: any[],
  startDate?: Date,
  endDate?: Date
): Array<{
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}> {
  const timeline: Record<string, any> = {};

  events.forEach(event => {
    const date = event.createdAt.toISOString().split("T")[0];
    if (!timeline[date]) {
      timeline[date] = {
        date,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
      };
    }

    if (event.eventType === EmailEventType.SENT) timeline[date].sent++;
    if (event.deliveryStatus === EmailDeliveryStatus.DELIVERED)
      timeline[date].delivered++;
    if (event.eventType === EmailEventType.OPENED) timeline[date].opened++;
    if (event.eventType === EmailEventType.CLICKED) timeline[date].clicked++;
    if (event.eventType === EmailEventType.BOUNCED) timeline[date].bounced++;
    if (event.eventType === EmailEventType.FAILED) timeline[date].failed++;
  });

  return Object.values(timeline).sort(
    (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
