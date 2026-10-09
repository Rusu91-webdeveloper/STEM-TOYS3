import { db } from "@/lib/db";

import { getRecordedEmailMetrics } from "./email-metrics";

// Legacy trigger code wrote `sent` without sending. Only new, explicitly
// acknowledged provider results certify acceptance. Neither certifies delivery.
export const acceptedEmailWhere = { status: "accepted" };
export async function getEmailDashboard() {
  const [
    templates,
    sequences,
    activeSequences,
    campaigns,
    activeCampaigns,
    subscribers,
    inactiveSubscribers,
    triggers,
    activeTriggers,
    logs,
    accepted,
    failed,
    unverified,
    metrics,
    recentLogs,
    recentExecutions,
  ] = await Promise.all([
    db.emailTemplate.count(),
    db.emailSequence.count(),
    db.emailSequence.count({ where: { isActive: true } }),
    db.emailCampaign.count(),
    db.emailCampaign.count({
      where: { status: { in: ["SENDING", "SCHEDULED"] } },
    }),
    db.newsletter.count({ where: { isActive: true } }),
    db.newsletter.count({ where: { isActive: false } }),
    db.emailTrigger.count(),
    db.emailTrigger.count({ where: { isActive: true, status: "ACTIVE" } }),
    db.emailLog.count(),
    db.emailLog.count({ where: acceptedEmailWhere }),
    db.emailLog.count({ where: { status: "failed" } }),
    db.emailLog.count({ where: { status: "sent" } }),
    getRecordedEmailMetrics(),
    db.emailLog.findMany({
      take: 10,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        to: true,
        subject: true,
        status: true,
        sentAt: true,
        error: true,
        createdAt: true,
        template: { select: { name: true } },
      },
    }),
    db.emailTriggerExecution.findMany({
      take: 10,
      orderBy: [{ executedAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        status: true,
        errorMessage: true,
        executedAt: true,
        trigger: { select: { name: true } },
      },
    }),
  ]);
  return {
    counts: {
      templates,
      sequences,
      activeSequences,
      campaigns,
      activeCampaigns,
      subscribers,
      inactiveSubscribers,
      triggers,
      activeTriggers,
      logs,
      accepted,
      failed,
      unverified,
    },
    metrics,
    recentLogs: recentLogs.map(log => ({
      ...log,
      verified: log.status === "accepted",
    })),
    recentExecutions,
  };
}
