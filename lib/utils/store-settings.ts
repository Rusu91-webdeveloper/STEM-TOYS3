import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/cache";

// **PERFORMANCE**: Cache store settings at module level to avoid repeated database calls
let cachedStoreSettings: any = null;
let settingsLastFetched = 0;
const SETTINGS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache for store settings

/**
 * Get store settings from the database with aggressive caching
 * @returns Store settings object with all business information
 */
export async function getStoreSettings() {
  const now = Date.now();

  // **PERFORMANCE**: Return cached settings if still fresh (no database call needed)
  if (
    cachedStoreSettings &&
    now - settingsLastFetched < SETTINGS_CACHE_DURATION
  ) {
    return cachedStoreSettings;
  }

  try {
    // **PERFORMANCE**: Use Redis cache with longer TTL for store settings
    const settings = await getCached(
      "store_settings_v1",
      () => prisma.storeSettings.findFirst(),
      SETTINGS_CACHE_DURATION // Cache for 1 hour
    );

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        storeName: "TechTots",
        storeUrl: "https://techtots.com",
        storeDescription:
          "TechTots is a premier online destination for STEM toys that inspire learning through play.",
        contactEmail: "info@techtots.com",
        contactPhone: "+1 (555) 123-4567",
        currency: "usd",
        timezone: "america-new_york",
        dateFormat: "mm-dd-yyyy",
        weightUnit: "lb",
        metaTitle: "TechTots | STEM Toys for Curious Minds",
        metaDescription:
          "Discover the best STEM toys for curious minds at TechTots. Educational toys that make learning fun for children of all ages.",
        metaKeywords:
          "STEM toys, educational toys, science toys, technology toys, engineering toys, math toys",
        businessAddress: "Mehedinți 54-56, Bl D5, sc 2, apt 70",
        businessCity: "Cluj-Napoca",
        businessState: "Cluj",
        businessCountry: "România",
        businessPostalCode: "400000",
        shippingSettings: {
          standard: { price: "5.99", active: true },
          express: { price: "12.99", active: true },
          freeThreshold: { price: "250.00", active: true },
        },
        taxSettings: {
          rate: "21",
          active: true,
          includeInPrice: true,
        },
      };

      // Cache default settings to avoid repeated database calls
      cachedStoreSettings = defaultSettings;
      settingsLastFetched = now;
      return defaultSettings;
    }

    // Cache successful database result
    cachedStoreSettings = settings;
    settingsLastFetched = now;
    return settings;
  } catch (error) {
    console.error("Error fetching store settings:", error);

    // **PERFORMANCE**: Return cached settings even on error to avoid repeated failures
    if (cachedStoreSettings) {
      return cachedStoreSettings;
    }

    // Return default settings on error
    const defaultSettings = {
      storeName: "TechTots",
      storeUrl: "https://techtots.com",
      storeDescription:
        "TechTots is a premier online destination for STEM toys that inspire learning through play.",
      contactEmail: "info@techtots.com",
      contactPhone: "+1 (555) 123-4567",
      currency: "usd",
      timezone: "america-new_york",
      dateFormat: "mm-dd-yyyy",
      weightUnit: "lb",
      metaTitle: "TechTots | STEM Toys for Curious Minds",
      metaDescription:
        "Discover the best STEM toys for curious minds at TechTots. Educational toys that make learning fun for children of all ages.",
      metaKeywords:
        "STEM toys, educational toys, science toys, technology toys, engineering toys, math toys",
      businessAddress: "Mehedinți 54-56, Bl D5, sc 2, apt 70",
      businessCity: "Cluj-Napoca",
      businessState: "Cluj",
      businessCountry: "România",
      businessPostalCode: "400000",
      shippingSettings: {
        standard: { price: "5.99", active: true },
        express: { price: "12.99", active: true },
        freeThreshold: { price: "250.00", active: true },
      },
      taxSettings: {
        rate: "21",
        active: true,
        includeInPrice: true,
      },
    };

    // Cache default settings to avoid repeated database calls
    cachedStoreSettings = defaultSettings;
    settingsLastFetched = now;
    return defaultSettings;
  }
}

/**
 * Get business address as a formatted string
 * @returns Formatted business address string
 */
export async function getBusinessAddress() {
  const settings = await getStoreSettings();
  return `${settings.businessAddress}, ${settings.businessCity}, ${settings.businessState} ${settings.businessPostalCode}, ${settings.businessCountry}`;
}

/**
 * Get shipping settings with defaults
 * @returns Shipping settings object
 */
export async function getShippingSettings() {
  const settings = await getStoreSettings();
  return (
    settings.shippingSettings || {
      standard: { price: "5.99", active: true },
      express: { price: "12.99", active: true },
      freeThreshold: { price: "250.00", active: true },
    }
  );
}

/**
 * Get tax settings with defaults
 * @returns Tax settings object
 */
export async function getTaxSettings() {
  const settings = await getStoreSettings();
  return (
    settings.taxSettings || {
      rate: "21",
      active: true,
      includeInPrice: true,
    }
  );
}

/**
 * Get free shipping threshold
 * @returns Free shipping threshold amount or null if not configured
 */
export async function getFreeShippingThreshold(): Promise<number | null> {
  try {
    const shippingSettings = await getShippingSettings();

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
 * Get free shipping status
 * @returns Object with isActive and threshold properties
 */
export async function getFreeShippingStatus() {
  try {
    const shippingSettings = await getShippingSettings();

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
