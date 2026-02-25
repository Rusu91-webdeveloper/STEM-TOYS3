/**
 * Application configuration helpers.
 *
 * PRIMARY source of truth: the `storeSettings` database table.
 * All contactEmail, contactPhone, businessAddress etc. are stored there
 * and managed via the Admin Panel → Settings page.
 *
 * Env vars are used ONLY for:
 *  - Infrastructure secrets (DB, API keys, auth)
 *  - Monitoring/alert emails that are not user-facing
 *  - First-run fallbacks when the DB row doesn't exist yet
 *
 * Usage (server-side):
 *   const config = await getAppConfig();
 *   config.contactEmail  // from DB, env fallback if DB empty
 *
 * Client-side: fetch from /api/store-settings (already in use across the app)
 */

import { getStoreSettings } from "@/lib/utils/store-settings";

export interface AppConfig {
  storeName: string;
  contactEmail: string;
  supportEmail: string;
  contactPhone: string;
  storePhoneFormatted: string;
  alertEmail: string;
  fromEmail: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  legalName: string;
}

function formatPhone(raw: string): string {
  const clean = raw.replace(/\s/g, "");
  const m = clean.match(/^(\+40)(\d{3})(\d{3})(\d{3})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : raw;
}

/**
 * Returns store config sourced primarily from the database.
 * Falls back to env vars, then hard-coded Romanian defaults.
 * Result is cheap to call repeatedly — `getStoreSettings()` is cached in-memory.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const settings = await getStoreSettings();

  const contactEmail =
    settings?.contactEmail ||
    process.env.EMAIL_FROM ||
    "contact@techtots.ro";

  const contactPhone =
    settings?.contactPhone ||
    process.env.FANCOURIER_SENDER_PHONE ||
    "+40771248029";

  const streetAddress =
    (settings as any)?.businessAddress ||
    process.env.STORE_STREET_ADDRESS ||
    "Strada Mehedinți 54-56";

  const city =
    (settings as any)?.businessCity ||
    process.env.STORE_CITY ||
    "Cluj-Napoca";

  const state =
    (settings as any)?.businessState ||
    process.env.STORE_STATE ||
    "Cluj";

  const postalCode =
    (settings as any)?.businessPostalCode ||
    process.env.STORE_POSTAL_CODE ||
    "400000";

  const legalName =
    process.env.STORE_LEGAL_NAME || "WEBIRA REM S.R.L.";

  return {
    storeName: settings?.storeName || process.env.EMAIL_FROM_NAME || "TechTots",
    contactEmail,
    supportEmail: contactEmail,
    contactPhone,
    storePhoneFormatted: formatPhone(contactPhone),
    alertEmail:
      process.env.ALERT_EMAIL ||
      process.env.ADMIN_EMAIL ||
      contactEmail,
    fromEmail:
      process.env.EMAIL_FROM || contactEmail,
    streetAddress,
    city,
    state,
    postalCode,
    country:
      (settings as any)?.businessCountry || "România",
    fullAddress:
      process.env.STORE_ADDRESS ||
      `${streetAddress}, ${city}, România`,
    legalName,
  };
}

// ---------------------------------------------------------------------------
// Legacy synchronous shim — used in places that can't be async.
// Points to env vars and hard-coded fallbacks ONLY.
// Prefer getAppConfig() wherever possible.
// ---------------------------------------------------------------------------
export const appConfig = {
  get contactEmail() {
    return process.env.EMAIL_FROM || "contact@techtots.ro";
  },
  get supportEmail() {
    return process.env.EMAIL_FROM || "contact@techtots.ro";
  },
  get adminEmail() {
    return process.env.ADMIN_EMAIL || process.env.ALERT_EMAIL || "admin@techtots.ro";
  },
  get alertEmail() {
    return process.env.ALERT_EMAIL || process.env.ADMIN_EMAIL || "admin@techtots.ro";
  },
  get fromEmail() {
    return process.env.EMAIL_FROM || "noreply@techtots.ro";
  },
  get storePhone() {
    return process.env.FANCOURIER_SENDER_PHONE || "+40771248029";
  },
  get storePhoneFormatted() {
    return formatPhone(this.storePhone);
  },
  get streetAddress() {
    return process.env.STORE_STREET_ADDRESS || "Strada Mehedinți 54-56";
  },
  get city() { return process.env.STORE_CITY || "Cluj-Napoca"; },
  get state() { return process.env.STORE_STATE || "Cluj"; },
  get postalCode() { return process.env.STORE_POSTAL_CODE || "400000"; },
  get country() { return process.env.STORE_COUNTRY || "RO"; },
  get fullAddress() {
    return (
      process.env.STORE_ADDRESS ||
      `${this.streetAddress}, ${this.city}, România`
    );
  },
} as const;

// ---------------------------------------------------------------------------
// Public (client-side) config — no DB access from the browser.
// Client components should fetch /api/store-settings for live DB data.
// This is only used as an initial/loading state.
// ---------------------------------------------------------------------------
export const publicConfig = {
  get contactEmail() {
    return process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@techtots.ro";
  },
  get supportEmail() {
    return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@techtots.ro";
  },
  get storePhone() {
    return process.env.NEXT_PUBLIC_STORE_PHONE || "+40771248029";
  },
  get storePhoneFormatted() {
    return formatPhone(this.storePhone);
  },
} as const;
