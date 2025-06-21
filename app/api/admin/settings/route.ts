import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Retrieve current store settings
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized: Admin access required" }),
      { status: 403 }
    );
  }

  try {
    // Get the first settings record or create one if none exists
    let settings = await prisma.storeSettings.findFirst();

    if (!settings) {
      // Initialize default settings if none exist
      settings = await prisma.storeSettings.create({
        data: {}, // Use schema defaults
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error retrieving settings:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to retrieve settings" }),
      { status: 500 }
    );
  }
}

// PUT - Update store settings
export async function PUT(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized: Admin access required" }),
      { status: 403 }
    );
  }

  try {
    const data = await req.json();
    const { section, ...sectionData } = data;

    // Get the first settings record or create one if none exists
    let settings = await prisma.storeSettings.findFirst();

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {}, // Use schema defaults
      });
    }

    // Update only the fields provided in the request based on section
    const updatedSettings = await prisma.storeSettings.update({
      where: { id: settings.id },
      data: sectionData,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update settings" }),
      { status: 500 }
    );
  }
}
