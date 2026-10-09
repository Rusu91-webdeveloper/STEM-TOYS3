import { NextResponse } from "next/server";
import { z } from "zod";

export const privateEmailHeaders = { "Cache-Control": "private, no-store" };
export function emailJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: privateEmailHeaders });
}

export const emailListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().default(""),
  category: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

// UI sentinels mean no filter, never a saved category or an inactive record.
export function parseEmailListQuery(params: URLSearchParams) {
  return emailListQuery.parse(
    Object.fromEntries(
      Array.from(params.entries()).filter(
        ([, value]) => value !== "all" && value !== ""
      )
    )
  );
}

export function emailApiError(error: unknown, message: string) {
  if (error instanceof z.ZodError)
    return emailJson({ error: "Date invalide", details: error.errors }, 400);
  console.error(message, error);
  return emailJson({ error: message }, 500);
}
