import { NextRequest } from "next/server";

import { settingsRequest } from "@/lib/admin/settings-http";
import { backupRestoreSchema } from "@/lib/admin/settings-schema";
import { mutateAdminSettings } from "@/lib/admin/settings-service";

export function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return settingsRequest(request, async actor => {
    const { id } = await context.params;
    const input = backupRestoreSchema.parse(await request.json());
    return mutateAdminSettings({
      action: "restore",
      actor,
      backupId: id,
      ...input,
    });
  });
}
