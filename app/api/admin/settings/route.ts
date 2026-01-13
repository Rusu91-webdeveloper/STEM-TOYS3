import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Extract codSettings from paymentSettings JSON field for frontend compatibility
    const paymentSettings = (settings.paymentSettings as Record<string, any>) || {};
    const codSettings = paymentSettings.codSettings;

    // Transform the database result to include codSettings as a top-level field
    const transformedSettings = {
      ...settings,
      codSettings: codSettings || {
        percentage: "3",
        fixedFee: "5.00",
        active: true,
      },
    };

    return NextResponse.json(transformedSettings);
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

    // Prepare update data
    const updateData: Record<string, any> = {};

    // Handle codSettings - store it inside paymentSettings JSON field
    if (sectionData.codSettings !== undefined) {
      const currentPaymentSettings = (settings.paymentSettings as Record<string, any>) || {};
      updateData.paymentSettings = {
        ...currentPaymentSettings,
        codSettings: sectionData.codSettings,
      };
      // Remove codSettings from sectionData to avoid trying to update it as a direct field
      delete sectionData.codSettings;
    }

    // Handle JSON fields that need merging (shippingSettings, taxSettings, etc.)
    // For other JSON fields, merge with existing data
    const jsonFields = ['shippingSettings', 'taxSettings', 'metadata'];
    for (const field of jsonFields) {
      if (sectionData[field] !== undefined) {
        updateData[field] = sectionData[field];
        delete sectionData[field];
      }
    }

    // Add all other non-JSON fields
    Object.assign(updateData, sectionData);

    // Update only the fields provided in the request based on section
    const updatedSettings = await prisma.storeSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    // Extract codSettings from paymentSettings JSON field for frontend compatibility
    const paymentSettings = (updatedSettings.paymentSettings as Record<string, any>) || {};
    const codSettings = paymentSettings.codSettings;

    // Transform the database result to include codSettings as a top-level field
    const transformedSettings = {
      ...updatedSettings,
      codSettings: codSettings || {
        percentage: "3",
        fixedFee: "5.00",
        active: true,
      },
    };

    return NextResponse.json(transformedSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update settings" }),
      { status: 500 }
    );
  }
}
