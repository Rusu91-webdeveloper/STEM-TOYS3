import { NextRequest } from "next/server";

import { settingsRequest } from "@/lib/admin/settings-http";
import { settingsUpdateSchema } from "@/lib/admin/settings-schema";
import {
  mutateAdminSettings,
  readAdminSettings,
} from "@/lib/admin/settings-service";

export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  return settingsRequest(request, () => readAdminSettings());
}
export function PUT(request: NextRequest) {
  return settingsRequest(request, async actor => {
    const update = settingsUpdateSchema.parse(await request.json());
    return mutateAdminSettings({
      action: "save",
      actor,
      expectedUpdatedAt: update.expectedUpdatedAt,
      update,
    });
  });
}
