import { prisma } from "@/lib/prisma";

/**
 * Get the free shipping threshold from the database
 * @returns The free shipping threshold amount or null if not configured
 */
export async function getFreeShippingThreshold(): Promise<number | null> {
  try {
    const settings = await prisma.storeSettings.findFirst();

    if (!settings?.shippingSettings) {
      return null;
    }

    const shippingSettings = settings.shippingSettings as any;

    if (!shippingSettings.freeThreshold?.active) {
      return null;
    }

    return parseFloat(shippingSettings.freeThreshold.price) || null;
  } catch (error) {
    console.error("Error fetching free shipping threshold:", error);
    return null;
  }
}

/**
 * Get all shipping settings from the database
 * @returns The complete shipping settings object
 */
export async function getShippingSettings() {
  try {
    const settings = await prisma.storeSettings.findFirst();

    if (!settings?.shippingSettings) {
      return {
        standard: { price: "5.99", active: true },
        express: { price: "12.99", active: true },
        freeThreshold: { price: "75.00", active: true },
      };
    }

    return settings.shippingSettings as any;
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return {
      standard: { price: "5.99", active: true },
      express: { price: "12.99", active: true },
      freeThreshold: { price: "75.00", active: true },
    };
  }
}

/**
 * Check if free shipping is active and get the threshold
 * @returns Object with isActive and threshold properties
 */
export async function getFreeShippingStatus() {
  try {
    const settings = await prisma.storeSettings.findFirst();

    if (!settings?.shippingSettings) {
      return {
        isActive: false,
        threshold: null,
      };
    }

    const shippingSettings = settings.shippingSettings as any;

    return {
      isActive: shippingSettings.freeThreshold?.active || false,
      threshold: shippingSettings.freeThreshold?.active
        ? parseFloat(shippingSettings.freeThreshold.price)
        : null,
    };
  } catch (error) {
    console.error("Error fetching free shipping status:", error);
    return {
      isActive: false,
      threshold: null,
    };
  }
}
