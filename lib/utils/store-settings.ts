import { invalidateCache, CacheKeys } from "@/lib/cache";
import { appConfig } from "@/lib/config/app-config";
import { DEFAULT_COD_SETTINGS } from "@/lib/pricing/cod-settings";
import { prisma } from "@/lib/prisma";
import { defaultShippingSettings } from "@/lib/shipping/settings";

let cachedStoreSettings: any = null;
// Store the last successfully loaded configuration only as a display fallback.

function isBusinessVatRegistered(): boolean {
  return process.env.BUSINESS_VAT_REGISTERED === "true";
}

/**
 * Invalidate all store-settings–related caches. Call this when admin updates
 * shipping, tax, or COD settings so checkout and emails use fresh values.
 */
export async function invalidateStoreSettingsCache(): Promise<void> {
  cachedStoreSettings = null;
  try {
    await invalidateCache("store_settings_v1");
    await invalidateCache(CacheKeys.product("shipping-settings"));
    await invalidateCache(CacheKeys.product("tax-settings"));
    await invalidateCache(CacheKeys.product("cod-settings"));
  } catch (err) {
    console.error("Error invalidating store settings cache:", err);
  }
}

/**
 * Get current persisted settings; descriptive consumers retain a last-known fallback
 * @returns Store settings object with all business information
 */
export async function getStoreSettings(options: { strict?: boolean } = {}) {
  try {
    // Read the persisted revision directly so another server's save applies immediately.
    const settings = await prisma.storeSettings.findFirst({
      orderBy: { createdAt: "asc" },
      omit: { metadata: true },
    });

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        storeName: "TechTots",
        storeUrl: "https://www.techtots.ro",
        storeDescription:
          "Jucării STEM alese cu grijă, pentru copii care descoperă lumea prin joacă.",
        contactEmail: appConfig.contactEmail,
        contactPhone: appConfig.storePhoneFormatted,
        currency: "ron",
        timezone: "europe-bucharest",
        dateFormat: "dd-mm-yyyy",
        weightUnit: "kg",
        metaTitle: "TechTots | Jucării STEM pentru Minți Curioase",
        metaDescription:
          "Descoperă cele mai bune jucării STEM la TechTots. Jucării educaționale care fac învățarea distractivă pentru copii de toate vârstele.",
        metaKeywords:
          "jucării STEM, jucării educaționale, jucării știință, jucării tehnologie, jucării inginerie, jucării matematică",
        businessAddress:
          process.env.STORE_STREET_ADDRESS || "Strada Mehedinți 54-56",
        businessCity: process.env.STORE_CITY || "Cluj-Napoca",
        businessState: "Cluj",
        businessCountry: "România",
        businessPostalCode: "400000",
        shippingSettings: defaultShippingSettings(),
        codSettings: { ...DEFAULT_COD_SETTINGS },
        taxSettings: {
          rate: "21",
          active: false,
          includeInPrice: false,
        },
      };

      // Retain default settings as a descriptive fallback after a read failure
      cachedStoreSettings = defaultSettings;
      return defaultSettings;
    }

    // Extract codSettings from paymentSettings JSON field if it exists
    // This maintains backward compatibility with code that expects codSettings as a top-level field
    const paymentSettings =
      (settings.paymentSettings as Record<string, any>) || {};
    const codSettings = paymentSettings.codSettings;

    // Transform the database result to include codSettings as a top-level field
    const transformedSettings = {
      ...settings,
      codSettings: codSettings || { ...DEFAULT_COD_SETTINGS },
    };

    // Keep a last-known display fallback when the database is temporarily unavailable.
    cachedStoreSettings = transformedSettings;
    return transformedSettings;
  } catch (error) {
    console.error("Error fetching store settings:", error);
    // Checkout must not quote a default tax/fee when its configuration is unavailable.
    if (options.strict) throw error;

    // **PERFORMANCE**: Return cached settings even on error to avoid repeated failures
    // But don't cache a DB-error default for 5 minutes - return directly without caching
    if (cachedStoreSettings) {
      return cachedStoreSettings;
    }

    // Return default settings on error WITHOUT caching
    const defaultSettings = {
      storeName: process.env.EMAIL_FROM_NAME || "TechTots",
      storeUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro",
      storeDescription:
        "TechTots este destinația online pentru jucării STEM care inspiră învățarea prin joacă.",
      contactEmail: appConfig.contactEmail,
      contactPhone: appConfig.storePhoneFormatted,
      currency: "ron",
      timezone: "europe-bucharest",
      dateFormat: "dd-mm-yyyy",
      weightUnit: "kg",
      metaTitle: "TechTots | Jucării STEM pentru Minți Curioase",
      metaDescription:
        "Descoperă cele mai bune jucării STEM la TechTots. Jucării educaționale care fac învățarea distractivă pentru copii de toate vârstele.",
      metaKeywords:
        "jucării STEM, jucării educaționale, jucării știință, jucării tehnologie, jucării inginerie, jucării matematică",
      businessAddress:
        process.env.STORE_STREET_ADDRESS || "Strada Mehedinți 54-56",
      businessCity: process.env.STORE_CITY || "Cluj-Napoca",
      businessState: "Cluj",
      businessCountry: "România",
      businessPostalCode: "400000",
      shippingSettings: defaultShippingSettings(),
      codSettings: { ...DEFAULT_COD_SETTINGS },
      taxSettings: {
        rate: "21",
        active: false,
        includeInPrice: false,
      },
    };

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
  const settings = await getStoreSettings({ strict: true });
  return settings.shippingSettings || defaultShippingSettings();
}

/**
 * Get COD settings with defaults
 * @returns COD settings object
 */
export async function getCODSettings() {
  const settings = await getStoreSettings({ strict: true });
  return settings.codSettings || { ...DEFAULT_COD_SETTINGS };
}

/**
 * Get tax settings with defaults
 * @returns Tax settings object
 */
export async function getTaxSettings() {
  const settings = await getStoreSettings({ strict: true });
  // Non-VAT business mode: keep prices final, without tax/VAT breakdown.
  const vatRegistered =
    settings.taxSettings?.vatRegistered ?? isBusinessVatRegistered();
  if (!vatRegistered) {
    return {
      rate: "0",
      active: false,
      includeInPrice: true,
    };
  }

  return (
    settings.taxSettings || {
      rate: "21",
      active: true,
      includeInPrice: false,
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
