import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { withCsrfProtection } from "@/lib/csrf";
import { db } from "@/lib/db";
import {
  runRetentionCleanup,
  supportsAutomaticRetention,
} from "@/lib/privacy/retention";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const schema = z.object({
  category: z.enum([
    "personal_data",
    "marketing_data",
    "analytics_data",
    "logs",
  ]),
  retentionPeriod: z.number().int().min(1).max(3650),
  autoDelete: z.boolean().default(false),
  description: z.string().max(1000).optional(),
});
const updateSchema = schema
  .omit({ category: true })
  .partial()
  .extend({ id: z.string().min(1) });
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function handle(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN")
      return reply({ error: "Admin access required" }, 403);
    if (request.method === "GET") {
      const [policies, pendingDeletionRequests] = await Promise.all([
        db.dataRetentionPolicy.findMany({ orderBy: { category: "asc" } }),
        db.consentLog.count({
          where: {
            consentType: "account_deletion_request",
            consentDetails: { path: ["status"], equals: "pending_review" },
          },
        }),
      ]);
      return reply({
        policies,
        pendingDeletionRequests,
        automatedCategories: ["logs", "analytics_data"],
        note: "These policies cover application data only. Orders, invoices, consent evidence and external providers require separate review.",
      });
    }
    const response = await withCsrfProtection(
      request.clone() as NextRequest,
      async () => {
        if (request.method === "PUT")
          return reply({ result: await runRetentionCleanup(db) });
        const body = await request.json().catch(() => null);
        if (request.method === "POST") {
          const input = schema.safeParse(body);
          if (!input.success)
            return reply(
              { error: "Invalid policy", details: input.error.issues },
              400
            );
          if (
            input.data.autoDelete &&
            !supportsAutomaticRetention(input.data.category)
          )
            return reply(
              {
                error:
                  "This category requires manual legal review; automatic deletion is unsupported.",
              },
              400
            );
          const policy = await db.dataRetentionPolicy.upsert({
            where: { category: input.data.category },
            create: input.data,
            update: input.data,
          });
          return reply({ policy });
        }
        const input = updateSchema.safeParse(body);
        if (!input.success)
          return reply({ error: "Policy ID and valid settings required" }, 400);
        const { id, ...data } = input.data;
        const current = await db.dataRetentionPolicy.findUnique({
          where: { id },
        });
        if (!current) return reply({ error: "Policy not found" }, 404);
        if (
          (data.autoDelete ?? current.autoDelete) &&
          !supportsAutomaticRetention(current.category)
        )
          return reply(
            {
              error:
                "This category requires manual legal review; automatic deletion is unsupported.",
            },
            400
          );
        return reply({
          policy: await db.dataRetentionPolicy.update({ where: { id }, data }),
        });
      }
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    console.error("Privacy retention operation failed");
    return reply({ error: "Privacy retention operation unavailable" }, 503);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
