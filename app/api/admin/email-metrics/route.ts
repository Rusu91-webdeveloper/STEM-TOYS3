import { NextRequest } from "next/server";

import { emailJson, emailApiError } from "@/lib/admin/email-api";
import { getRecordedEmailMetrics } from "@/lib/admin/email-metrics";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const query = request.nextUrl.searchParams;
    return emailJson(
      await getRecordedEmailMetrics({
        campaignId: query.get("campaignId") || undefined,
        sequenceId: query.get("sequenceId") || undefined,
        templateId: query.get("templateId") || undefined,
      })
    );
  } catch (error) {
    return emailApiError(error, "Statisticile email nu au putut fi încărcate");
  }
}
