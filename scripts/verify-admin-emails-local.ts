import assert from "node:assert/strict";
import { config } from "dotenv";
import { hash } from "bcryptjs";

async function main() {
  config({ path: ".env.local" });
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    url.hostname !== "localhost" ||
    url.port !== "55434" ||
    url.pathname !== "/stemtoys_admin_email_dev"
  )
    throw new Error(
      "Email QA requires the isolated localhost:55434/stemtoys_admin_email_dev database."
    );
  const { db } = await import("@/lib/db");
  try {
    if (!process.argv.includes("--verify-only")) {
      for (const model of [
        db.user,
        db.emailTemplate,
        db.emailLog,
        db.emailEvent,
        db.newsletter,
        db.emailSequence,
        db.emailCampaign,
        db.emailTrigger,
      ])
        if (await (model as { count(): Promise<number> }).count())
          throw new Error("Refusing to seed an occupied QA database.");
      if (!process.env.LOCAL_EMAIL_QA_PASSWORD)
        throw new Error(
          "Set LOCAL_EMAIL_QA_PASSWORD for the isolated test admin."
        );
      await db.user.create({
        data: {
          id: "email-qa-admin",
          email: "email-admin@example.test",
          name: "Administrator local QA",
          role: "ADMIN",
          isActive: true,
          password: await hash(process.env.LOCAL_EMAIL_QA_PASSWORD, 12),
        },
      });
      for (let index = 0; index < 28; index++)
        await db.emailTemplate.create({
          data: {
            id: `email-qa-template-${index}`,
            name: `Șablon local QA ${String(index).padStart(2, "0")}`,
            slug: `email-qa-${index}`,
            subject: `Subiect local QA ${index}`,
            content: `<p>Conținut local QA ${index} păstrat în baza de date.</p>`,
            category: index < 2 ? "returns" : "newsletter",
            isActive: index !== 1,
            variables: [],
            createdBy: "email-qa-admin",
            metadata: {
              images: [{ id: "local-image", url: "/TechTots_LOGO.png" }],
              preserved: "local-metadata",
            },
          },
        });
      for (let index = 0; index < 3; index++)
        await db.newsletter.create({
          data: {
            id: `email-qa-subscriber-${index}`,
            email: `newsletter-${index}@example.test`,
            isActive: index < 2,
          },
        });
      await db.emailSequence.create({
        data: {
          id: "email-qa-sequence",
          name: "Secvență locală QA",
          trigger: "USER_REGISTRATION",
          createdBy: "email-qa-admin",
          cooldownHours: 12,
          steps: {
            create: {
              id: "email-qa-step",
              order: 1,
              delayHours: 2,
              templateId: "email-qa-template-0",
              subject: "Subiect salvat",
              content: "<p>Pas salvat</p>",
            },
          },
          users: { create: { userId: "email-qa-admin", status: "ACTIVE" } },
        },
      });
      await db.emailCampaign.create({
        data: {
          id: "email-qa-campaign",
          name: "Campanie locală QA",
          templateId: "email-qa-template-0",
          subject: "Campanie salvată",
          content: "<p>Previzualizare locală QA</p>",
          createdBy: "email-qa-admin",
        },
      });
      await db.emailTrigger.create({
        data: {
          id: "email-qa-trigger",
          name: "Regulă locală QA",
          type: "SEGMENT_ENTER",
          status: "PAUSED",
          isActive: false,
          conditions: { segment: "NEW" },
          actionType: "send_email",
          actionData: { templateId: "email-qa-template-0" },
          createdBy: "email-qa-admin",
        },
      });
      await db.emailTriggerExecution.create({
        data: {
          triggerId: "email-qa-trigger",
          userId: "email-qa-admin",
          status: "failed",
          errorMessage: "Eroare de test local, fără trimitere",
        },
      });
      for (const status of ["accepted", "failed", "sent"])
        await db.emailLog.create({
          data: {
            id: `email-qa-log-${status}`,
            to: "recipient@example.test",
            subject: `Email local ${status}`,
            status,
            templateId: "email-qa-template-0",
            error: status === "failed" ? "Eșec de test" : null,
            metadata: {
              fixture: true,
              ...(status === "accepted"
                ? { provider: "fixture", messageId: "local-acknowledgement" }
                : {}),
            },
          },
        });
      for (const [emailId, eventType, metadata] of [
        ["email-qa-real", "SENT", {}],
        ["email-qa-real-open-1", "OPENED", {}],
        ["email-qa-real-open-2", "OPENED", {}],
        ["email-qa-real-click-1", "CLICKED", {}],
        ["email-qa-real-click-2", "CLICKED", {}],
        ["email-qa-orphan-open-1", "OPENED", {}],
        ["email-qa-test", "SENT", { testMode: true }],
      ] as const)
        await db.emailEvent.create({
          data: {
            emailId,
            email: "recipient@example.test",
            eventType,
            metadata,
            campaignId: "email-qa-campaign",
          },
        });
    }
    const { getEmailDashboard } = await import("@/lib/admin/email-dashboard");
    const dashboard = await getEmailDashboard();
    assert.deepEqual(dashboard.counts, {
      templates: 28,
      sequences: 1,
      activeSequences: 1,
      campaigns: 1,
      activeCampaigns: 0,
      subscribers: 2,
      inactiveSubscribers: 1,
      triggers: 1,
      activeTriggers: 0,
      logs: 3,
      accepted: 1,
      failed: 1,
      unverified: 1,
    });
    assert.equal(dashboard.metrics.totalSent, 1);
    assert.equal(dashboard.metrics.totalOpened, 1);
    assert.equal(dashboard.metrics.totalClicked, 1);
    assert.equal(dashboard.metrics.openRate, 100);
    assert.equal(dashboard.recentLogs.filter(log => log.verified).length, 1);
    const template = await db.emailTemplate.findUniqueOrThrow({
      where: { id: "email-qa-template-0" },
    });
    assert.ok(template.content.includes("Conținut local QA"));
    const sequence = await db.emailSequence.findUniqueOrThrow({
      where: { id: "email-qa-sequence" },
      include: { steps: true },
    });
    assert.equal(sequence.cooldownHours, 12);
    assert.equal(sequence.steps[0].content, "<p>Pas salvat</p>");
    const { getRecordedEmailMetrics } = await import(
      "@/lib/admin/email-metrics"
    );
    assert.equal(
      (await getRecordedEmailMetrics({ sequenceId: "absent" })).openRate,
      null
    );
    console.log(
      "Isolated PostgreSQL email QA passed: actual subscriber/template counts, full saved content, persisted sequence steps, accepted vs unverified logs, distinct-message metrics, test/orphan exclusions, and unavailable rates without a send base."
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
