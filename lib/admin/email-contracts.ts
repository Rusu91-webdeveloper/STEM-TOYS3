import { z } from "zod";

const count = z.number().int().nonnegative();
export const emailPagination = z.object({
  page: count,
  limit: count,
  total: count,
  pages: count,
});
export const savedEmailTemplate = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  subject: z.string(),
  content: z.string(),
  category: z.string(),
  isActive: z.boolean(),
  variables: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  metadata: z.record(z.unknown()).nullable(),
});
export const emailTemplateList = z.object({
  templates: z.array(savedEmailTemplate),
  categories: z.array(z.string()),
  pagination: emailPagination,
});
export const savedEmailSequence = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  trigger: z.string(),
  isActive: z.boolean(),
  maxEmails: count,
  cooldownHours: count,
  createdAt: z.string(),
  updatedAt: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      order: count,
      templateId: z.string(),
      delayHours: count,
      subject: z.string(),
      content: z.string(),
    })
  ),
  _count: z.object({ steps: count, users: count }),
});
export const emailSequenceList = z.object({
  sequences: z.array(savedEmailSequence),
  pagination: emailPagination,
});
export const savedEmailCampaign = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  subject: z.string(),
  content: z.string(),
  templateId: z.string(),
  status: z.enum([
    "DRAFT",
    "SCHEDULED",
    "SENDING",
    "SENT",
    "PAUSED",
    "CANCELLED",
  ]),
  scheduledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  template: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
});
export const emailCampaignList = z.object({
  campaigns: z.array(savedEmailCampaign),
  pagination: emailPagination,
});
export const emailMetricsContract = z.object({
  totalSent: count,
  totalOpened: count,
  totalClicked: count,
  totalBounced: count,
  totalUnsubscribed: count,
  totalDelivered: count,
  openRate: z.number().nonnegative().nullable(),
  clickRate: z.number().nonnegative().nullable(),
  bounceRate: z.number().nonnegative().nullable(),
  unsubscribeRate: z.number().nonnegative().nullable(),
  deliveryRate: z.number().nonnegative().nullable(),
});
export const emailDashboardContract = z.object({
  counts: z.object({
    templates: count,
    sequences: count,
    activeSequences: count,
    campaigns: count,
    activeCampaigns: count,
    subscribers: count,
    inactiveSubscribers: count,
    triggers: count,
    activeTriggers: count,
    logs: count,
    accepted: count,
    failed: count,
    unverified: count,
  }),
  metrics: emailMetricsContract,
  recentLogs: z.array(
    z.object({
      id: z.string(),
      to: z.string(),
      subject: z.string(),
      status: z.string(),
      error: z.string().nullable(),
      createdAt: z.string(),
      sentAt: z.string().nullable(),
      template: z.object({ name: z.string() }).nullable(),
      verified: z.boolean(),
    })
  ),
  recentExecutions: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      errorMessage: z.string().nullable(),
      executedAt: z.string(),
      trigger: z.object({ name: z.string() }),
    })
  ),
});
export type EmailDashboard = z.infer<typeof emailDashboardContract>;

export async function readEmailResource<T>(
  url: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok)
    throw new Error(
      "Datele nu au putut fi încărcate. Verifică sesiunea și reîncearcă."
    );
  return schema.parse(await response.json());
}
