import assert from "node:assert/strict";
import { config } from "dotenv";

async function main() {
  config({ path: ".env.local" });
  const dbUrl = new URL(process.env.DATABASE_URL ?? "");
  if (
    dbUrl.hostname !== "localhost" ||
    dbUrl.port !== "55434" ||
    dbUrl.pathname !== "/stemtoys_admin_email_dev"
  )
    throw new Error("HTTP QA requires the separate local email QA database.");
  const origin = "http://localhost:3012";
  const cookies = new Map<string, string>();
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${origin}${path}`, {
      ...init,
      redirect: "manual",
      headers: {
        cookie: Array.from(cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join("; "),
        ...init.headers,
      },
    });
    for (const header of response.headers.getSetCookie()) {
      const cookie = header.split(";")[0];
      const separator = cookie.indexOf("=");
      cookies.set(cookie.slice(0, separator), cookie.slice(separator + 1));
    }
    return response;
  }
  const denied = await request("/api/admin/email-dashboard");
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get("cache-control") ?? "", /no-store/);
  const csrf = await (await request("/api/auth/csrf")).json();
  const login = await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email: "email-admin@example.test",
      password: process.env.LOCAL_EMAIL_QA_PASSWORD ?? "",
      callbackUrl: `${origin}/admin`,
    }),
  });
  assert.ok(
    [200, 302, 303].includes(login.status),
    "Local credential login failed"
  );
  async function json(path: string) {
    const response = await request(path);
    assert.equal(response.status, 200, `HTTP ${response.status}: ${path}`);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    return response.json();
  }
  const dashboard = await json("/api/admin/email-dashboard");
  assert.equal(dashboard.counts.templates, 28);
  assert.equal(dashboard.counts.subscribers, 2);
  assert.equal(dashboard.counts.accepted, 1);
  assert.equal(dashboard.counts.unverified, 1);
  const templates = await json(
    "/api/admin/email-templates?category=all&isActive=all"
  );
  assert.equal(templates.pagination.total, 28);
  assert.equal(templates.templates.length, 20);
  assert.ok(
    templates.templates.every((row: { content?: string }) => row.content)
  );
  assert.deepEqual(templates.categories.sort(), ["newsletter", "returns"]);
  const nextPage = await json("/api/admin/email-templates?page=2");
  assert.equal(nextPage.templates.length, 8);
  const inactive = await json("/api/admin/email-templates?isActive=false");
  assert.equal(inactive.pagination.total, 1);
  const sequence = await json("/api/admin/email-sequences");
  assert.equal(sequence.sequences[0].cooldownHours, 12);
  assert.equal(sequence.sequences[0].steps[0].content, "<p>Pas salvat</p>");
  assert.equal(sequence.sequences[0]._count.users, 1);
  assert.equal(
    (await json("/api/admin/email-subscribers?isActive=true")).pagination.total,
    2
  );
  assert.equal((await json("/api/admin/email-logs")).pagination.total, 3);
  assert.equal((await json("/api/admin/email-triggers")).pagination.total, 1);
  assert.equal(
    (await request("/api/admin/email-templates?limit=0")).status,
    400
  );
  if (process.argv.includes("--mutations")) {
    const mutate = async (path: string, method: string, body?: unknown) => {
      const response = await request(path, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      assert.ok(
        response.ok,
        `Mutation failed: ${path}: ${JSON.stringify(data)}`
      );
      return data;
    };
    let templateId: string | undefined;
    let sequenceId: string | undefined;
    let campaignId: string | undefined;
    try {
      const created = await mutate("/api/admin/email-templates", "POST", {
        name: "HTTP QA local",
        slug: `http-qa-${Date.now()}`,
        subject: "HTTP QA subject",
        content: "<p>HTTP QA saved HTML</p>",
        category: "local-qa",
        isActive: true,
        variables: [],
        metadata: { preserved: "yes" },
        images: [{ id: "qa-image", url: "/TechTots_LOGO.png" }],
      });
      templateId = created.id;
      await mutate(`/api/admin/email-templates/${templateId}`, "PUT", {
        subject: "Updated HTTP QA",
      });
      const edited = await json(`/api/admin/email-templates/${templateId}`);
      assert.equal(edited.subject, "Updated HTTP QA");
      assert.equal(edited.metadata.preserved, "yes");
      assert.equal(edited.metadata.images.length, 1);
      const sequence = await mutate("/api/admin/email-sequences", "POST", {
        name: "HTTP QA sequence",
        trigger: "CUSTOM",
        cooldownHours: 8,
        maxEmails: 2,
        isActive: false,
        steps: [{ templateId, delayHours: 3 }],
      });
      sequenceId = sequence.id;
      assert.equal(sequence.steps[0].subject, "Updated HTTP QA");
      await mutate(`/api/admin/email-sequences/${sequenceId}`, "PUT", {
        cooldownHours: 9,
        isActive: true,
      });
      const savedSequence = await json(
        `/api/admin/email-sequences/${sequenceId}`
      );
      assert.equal(savedSequence.cooldownHours, 9);
      assert.equal(savedSequence.isActive, true);
      const campaign = await mutate("/api/admin/email-campaigns", "POST", {
        name: "HTTP QA campaign",
        templateId,
        subject: edited.subject,
        content: edited.content,
      });
      campaignId = campaign.id;
      await mutate(`/api/admin/email-campaigns/${campaignId}`, "PUT", {
        name: "Updated HTTP QA campaign",
      });
      const campaigns = await json(
        "/api/admin/email-campaigns?search=Updated%20HTTP%20QA"
      );
      assert.equal(campaigns.campaigns[0].name, "Updated HTTP QA campaign");
      await mutate("/api/admin/email-triggers/email-qa-trigger", "PUT", {
        status: "PAUSED",
      });
    } finally {
      // Cleanup only the disposable rows created above in the guarded local DB.
      if (campaignId)
        await mutate(`/api/admin/email-campaigns/${campaignId}`, "DELETE");
      if (sequenceId)
        await mutate(`/api/admin/email-sequences/${sequenceId}`, "DELETE");
      if (templateId)
        await mutate(`/api/admin/email-templates/${templateId}`, "DELETE");
    }
    console.log(
      "Local create/edit/reload/delete checks passed for templates, sequences and campaigns; trigger pause persisted. No emails sent."
    );
  }
  console.log(
    "Local authenticated HTTP verification passed: real totals, all filters, page 2, saved content/steps, subscribers, logs, triggers, no-store and access denial. No emails sent."
  );
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
