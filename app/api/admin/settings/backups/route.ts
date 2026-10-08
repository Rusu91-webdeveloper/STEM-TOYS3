import { NextRequest } from "next/server";

import { settingsRequest } from "@/lib/admin/settings-http";
import { backupCreateSchema } from "@/lib/admin/settings-schema";
import {
  mutateAdminSettings,
  readAdminSettings,
} from "@/lib/admin/settings-service";

export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  return settingsRequest(request, async () => ({
    backups: (await readAdminSettings()).backups,
  }));
}
export function POST(request: NextRequest) {
  return settingsRequest(request, async actor => {
    const input = backupCreateSchema.parse(await request.json());
    return mutateAdminSettings({ action: "backup", actor, ...input });
  });
}
