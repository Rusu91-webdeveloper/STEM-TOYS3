import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

// Count distinct tracked messages, not repeated opens/clicks. Legacy tracking
// appended an event suffix; new tracking stores the original ID explicitly.
export async function getRecordedEmailMetrics(
  filters: {
    campaignId?: string;
    sequenceId?: string;
    templateId?: string;
  } = {}
) {
  const clauses = [
    Prisma.sql`COALESCE(metadata->>'testMode', 'false') <> 'true'`,
  ];
  if (filters.campaignId)
    clauses.push(Prisma.sql`"campaignId" = ${filters.campaignId}`);
  if (filters.sequenceId)
    clauses.push(Prisma.sql`"sequenceId" = ${filters.sequenceId}`);
  if (filters.templateId)
    clauses.push(Prisma.sql`"templateId" = ${filters.templateId}`);
  const [result] = await db.$queryRaw<
    Array<{
      sent: bigint;
      opened: bigint;
      clicked: bigint;
      bounced: bigint;
      unsubscribed: bigint;
      delivered: bigint;
    }>
  >(Prisma.sql`
    WITH messages AS (
      SELECT COALESCE(metadata->>'originalEmailId', regexp_replace("emailId", '-(open|click|bounce)-[0-9]+$', '')) AS key,
        "eventType" AS type FROM "EmailEvent" WHERE ${Prisma.join(clauses, " AND ")}
    ), tracked AS (
      SELECT key, bool_or(type = 'SENT') AS sent, bool_or(type = 'OPENED') AS opened,
        bool_or(type = 'CLICKED') AS clicked, bool_or(type = 'BOUNCED') AS bounced,
        bool_or(type = 'UNSUBSCRIBED') AS unsubscribed, bool_or(type = 'DELIVERED') AS delivered
      FROM messages GROUP BY key
    ) SELECT count(*) FILTER (WHERE sent) AS sent,
      count(*) FILTER (WHERE sent AND opened) AS opened,
      count(*) FILTER (WHERE sent AND clicked) AS clicked,
      count(*) FILTER (WHERE sent AND bounced) AS bounced,
      count(*) FILTER (WHERE sent AND unsubscribed) AS unsubscribed,
      count(*) FILTER (WHERE sent AND delivered) AS delivered FROM tracked
  `);
  const totalSent = Number(result.sent);
  const rate = (value: bigint) =>
    totalSent ? Math.round((Number(value) / totalSent) * 10000) / 100 : null;
  return {
    totalSent,
    totalOpened: Number(result.opened),
    totalClicked: Number(result.clicked),
    totalBounced: Number(result.bounced),
    totalUnsubscribed: Number(result.unsubscribed),
    totalDelivered: Number(result.delivered),
    openRate: rate(result.opened),
    clickRate: rate(result.clicked),
    bounceRate: rate(result.bounced),
    unsubscribeRate: rate(result.unsubscribed),
    deliveryRate: rate(result.delivered),
  };
}
