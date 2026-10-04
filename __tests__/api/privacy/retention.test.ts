/** @jest-environment node */
import { NextRequest } from "next/server";

import { GET, POST, PATCH, PUT } from "@/app/api/admin/gdpr/retention/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runRetentionCleanup } from "@/lib/privacy/retention";
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    dataRetentionPolicy: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    consentLog: { count: jest.fn() },
  },
}));
jest.mock("@/lib/privacy/retention", () => ({
  supportsAutomaticRetention: (category: string) =>
    ["logs", "analytics_data"].includes(category),
  runRetentionCleanup: jest.fn(),
}));
jest.mock("@/lib/csrf", () => ({
  withCsrfProtection: async (
    request: Request,
    handler: () => Promise<Response>
  ) => {
    await request.text();
    return request.headers.get("x-csrf-token") === "valid"
      ? handler()
      : new Response("{}", { status: 403 });
  },
}));
const mockAuth = auth as jest.Mock;
const policies = db.dataRetentionPolicy as jest.Mocked<
  typeof db.dataRetentionPolicy
>;
const request = (method: string, body?: unknown, csrf = "valid") =>
  new NextRequest("http://localhost/api/admin/gdpr/retention", {
    method,
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
beforeEach(() => {
  jest.resetAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
});
it.each([
  null,
  { user: { id: "visitor", role: "VISITOR" } },
  { user: { id: "customer", role: "CUSTOMER" } },
])("blocks reads and writes for %j", async session => {
  mockAuth.mockResolvedValue(session);
  for (const method of [GET, POST, PATCH, PUT])
    expect((await method(request("POST", {}))).status).toBe(403);
  expect(policies.upsert).not.toHaveBeenCalled();
});
it("requires signed CSRF before a retention mutation", async () => {
  expect((await PUT(request("PUT", {}, "bad"))).status).toBe(403);
  expect(runRetentionCleanup).not.toHaveBeenCalled();
});
it.each(["personal_data", "marketing_data"])(
  "refuses blanket automatic deletion for %s",
  async category => {
    expect(
      (
        await POST(
          request("POST", { category, retentionPeriod: 1, autoDelete: true })
        )
      ).status
    ).toBe(400);
    expect(policies.upsert).not.toHaveBeenCalled();
  }
);
it("defaults new policies to manual review and preserves an explicit operational period", async () => {
  const response = await POST(
    request("POST", { category: "logs", retentionPeriod: 60 })
  );
  expect(response.status).toBe(200);
  expect(policies.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      create: { category: "logs", retentionPeriod: 60, autoDelete: false },
    })
  );
});
it("updates the body policy ID, instead of treating the route name as its ID", async () => {
  policies.findUnique.mockResolvedValue({
    id: "actual-policy",
    category: "logs",
    autoDelete: false,
  } as never);
  expect(
    (
      await PATCH(
        request("PATCH", { id: "actual-policy", retentionPeriod: 30 })
      )
    ).status
  ).toBe(200);
  expect(policies.update).toHaveBeenCalledWith({
    where: { id: "actual-policy" },
    data: { retentionPeriod: 30 },
  });
});
it("reports real policy scope without inventing a compliance percentage", async () => {
  policies.findMany.mockResolvedValue([]);
  (db.consentLog.count as jest.Mock).mockResolvedValue(2);
  const response = await GET(request("GET"));
  const body = await response.json();
  expect(body.pendingDeletionRequests).toBe(2);
  expect(body).not.toHaveProperty("complianceRate");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
