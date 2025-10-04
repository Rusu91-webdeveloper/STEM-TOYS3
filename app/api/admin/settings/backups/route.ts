import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";

const createBackupSchema = z.object({
  name: z.string().min(1, "Backup name is required"),
  description: z.string().optional(),
});

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      // Get all settings backups
      const backups = await prisma.storeSettingsBackup.findMany({
        orderBy: { createdAt: "desc" },
        take: 50, // Limit to 50 most recent backups
      });

      // Transform backups data
      const transformedBackups = backups.map(backup => ({
        id: backup.id,
        name: backup.name,
        description: backup.description,
        createdAt: backup.createdAt.toISOString(),
        size: `${JSON.stringify(backup.settingsData).length} bytes`,
        version: backup.version,
      }));

      return NextResponse.json({
        success: true,
        backups: transformedBackups,
      });
    } catch (error) {
      console.error("Error fetching settings backups:", error);
      return NextResponse.json(
        { error: "Failed to fetch backups" },
        { status: 500 }
      );
    }
  },
  { limit: 20, windowMs: 10 * 60 * 1000 }
);

export const POST = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const body = await request.json();
      const validatedData = createBackupSchema.parse(body);

      // Get current settings
      const currentSettings = await prisma.storeSettings.findFirst();
      if (!currentSettings) {
        return NextResponse.json(
          { error: "No settings found to backup" },
          { status: 404 }
        );
      }

      // Create backup
      const backup = await prisma.storeSettingsBackup.create({
        data: {
          name: validatedData.name,
          description: validatedData.description || "",
          settingsData: currentSettings as any,
          version: "1.0",
          createdBy: session.user.email || session.user.name || "admin",
        },
      });

      return NextResponse.json({
        success: true,
        backup: {
          id: backup.id,
          name: backup.name,
          description: backup.description,
          createdAt: backup.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating settings backup:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid request data",
            details: error.errors,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create backup" },
        { status: 500 }
      );
    }
  },
  { limit: 5, windowMs: 10 * 60 * 1000 } // Stricter rate limiting for backup creation
);
