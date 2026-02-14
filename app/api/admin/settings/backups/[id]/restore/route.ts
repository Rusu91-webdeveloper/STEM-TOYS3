import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";

export const POST = withRateLimit(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: backupId } = await params;
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      if (!backupId) {
        return NextResponse.json(
          { error: "Backup ID is required" },
          { status: 400 }
        );
      }

      // Get the backup
      const backup = await prisma.storeSettingsBackup.findUnique({
        where: { id: backupId },
      });

      if (!backup) {
        return NextResponse.json(
          { error: "Backup not found" },
          { status: 404 }
        );
      }

      // Create a backup of current settings before restore
      const currentSettings = await prisma.storeSettings.findFirst();
      if (currentSettings) {
        await prisma.storeSettingsBackup.create({
          data: {
            name: `Auto-backup before restore ${new Date().toLocaleDateString()}`,
            description: "Automatic backup created before restoring settings",
            settingsData: currentSettings as any,
            version: "1.0",
            createdBy: session.user.email || session.user.name || "admin",
          },
        });
      }

      // Restore settings from backup
      const restoredSettings = await prisma.storeSettings.upsert({
        where: { id: currentSettings?.id || "default" },
        update: backup.settingsData as any,
        create: backup.settingsData as any,
      });

      return NextResponse.json({
        success: true,
        message: "Settings restored successfully",
        settings: restoredSettings,
      });
    } catch (error) {
      console.error("Error restoring settings backup:", error);
      return NextResponse.json(
        { error: "Failed to restore backup" },
        { status: 500 }
      );
    }
  },
  { limit: 5, windowMs: 10 * 60 * 1000 } // Stricter rate limiting for restore operations
);
