import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateStoreSettingsCache } from "@/lib/utils/store-settings";

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

    const metadata = (settings.metadata as Record<string, unknown>) || {};

    // Transform the database result to include legacy top-level fields
    const transformedSettings = {
      ...settings,
      codSettings: codSettings || {
        percentage: "3",
        fixedFee: "5.00",
        active: true,
      },
      businessHours: metadata.businessHours || null,
      orderProcessing: metadata.orderProcessing || null,
      inventoryManagement: metadata.inventoryManagement || null,
      marketingSettings: metadata.marketingSettings || null,
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

    const currentMetadata = (settings.metadata as Record<string, unknown>) || {};
    const metadataInput = (sectionData.metadata as Record<string, unknown>) || {};
    delete sectionData.metadata;

    const metadataSections = [
      "businessHours",
      "orderProcessing",
      "inventoryManagement",
      "marketingSettings",
    ] as const;
    let metadataChanged = Object.keys(metadataInput).length > 0;
    const mergedMetadata: Record<string, unknown> = {
      ...currentMetadata,
      ...metadataInput,
    };

    for (const field of metadataSections) {
      if (sectionData[field] !== undefined) {
        mergedMetadata[field] = sectionData[field];
        delete sectionData[field];
        metadataChanged = true;
      }
    }

    if (metadataChanged) {
      updateData.metadata = mergedMetadata;
    }

    // Handle JSON fields that are persisted directly on StoreSettings
    const jsonFields = ['shippingSettings', 'taxSettings'];
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

    // Invalidate store settings caches so checkout and emails use fresh shipping/tax/COD
    await invalidateStoreSettingsCache();

    // Extract codSettings from paymentSettings JSON field for frontend compatibility
    const paymentSettings = (updatedSettings.paymentSettings as Record<string, any>) || {};
    const codSettings = paymentSettings.codSettings;

    const updatedMetadata = (updatedSettings.metadata as Record<string, unknown>) || {};

    // Transform the database result to include legacy top-level fields
    const transformedSettings = {
      ...updatedSettings,
      codSettings: codSettings || {
        percentage: "3",
        fixedFee: "5.00",
        active: true,
      },
      businessHours: updatedMetadata.businessHours || null,
      orderProcessing: updatedMetadata.orderProcessing || null,
      inventoryManagement: updatedMetadata.inventoryManagement || null,
      marketingSettings: updatedMetadata.marketingSettings || null,
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
