import type { StoreSettings } from "@prisma/client";

import { DEFAULT_COD_SETTINGS } from "@/lib/pricing/cod-settings";
import { defaultShippingSettings } from "@/lib/shipping/settings";

import type { SettingsFields, SettingsSection } from "./settings-schema";
import { codSchema, shippingSchema, taxSchema } from "./settings-schema";

export interface SettingsHistory {
  id: string;
  date: string;
  actor: string;
  action: "save" | "backup" | "restore";
  section: string;
  fields: string[];
}
export interface SettingsBackup {
  id: string;
  name: string;
  date: string;
  actor: string;
  kind: "manual" | "before-save" | "before-restore";
  values: SettingsFields;
}
export interface SettingsJournal {
  history: SettingsHistory[];
  backups: SettingsBackup[];
}
export interface SettingsView extends SettingsFields {
  id: string | null;
  updatedAt: string | null;
  source: "database" | "defaults";
  warnings: string[];
  history: SettingsHistory[];
  backups: Omit<SettingsBackup, "values">[];
  integrations: {
    stripe: "test" | "live" | "missing";
    email: boolean;
    fanCourier: boolean;
  };
}
export const sectionNames: Record<SettingsSection, string> = {
  general: "Magazin",
  shipping: "Livrare",
  cod: "Ramburs",
  tax: "TVA",
};
export function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function settingsDefaults(): SettingsFields {
  return {
    storeName: "TechTots",
    storeUrl: "https://www.techtots.ro",
    storeDescription:
      "Jucării STEM alese cu grijă, pentru copii care descoperă lumea prin joacă.",
    contactEmail: process.env.EMAIL_FROM || "info@techtots.ro",
    contactPhone: process.env.FANCOURIER_SENDER_PHONE || "+40771248029",
    shippingSettings: shippingSchema.parse(defaultShippingSettings()),
    codSettings: { ...DEFAULT_COD_SETTINGS },
    taxSettings: {
      rate: "21",
      active: false,
      includeInPrice: false,
      vatRegistered: process.env.BUSINESS_VAT_REGISTERED === "true",
    },
  };
}
export function fieldsFromSettings(
  record: StoreSettings | null
): SettingsFields {
  const defaults = settingsDefaults();
  if (!record) return defaults;
  const rawShipping = objectValue(record.shippingSettings);
  const legacyPrice = objectValue(rawShipping.standard ?? rawShipping.express);
  const shipping = shippingSchema.safeParse({
    ...defaults.shippingSettings,
    ...rawShipping,
    deliveryPrice:
      rawShipping.deliveryPrice ??
      (legacyPrice.price !== undefined && legacyPrice.price !== null
        ? legacyPrice
        : defaults.shippingSettings.deliveryPrice),
  });
  const cod = codSchema.safeParse(
    objectValue(record.paymentSettings).codSettings
  );
  const tax = taxSchema.safeParse(record.taxSettings);
  return {
    storeName: record.storeName,
    storeUrl: record.storeUrl,
    storeDescription: record.storeDescription,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    shippingSettings: shipping.success
      ? shipping.data
      : defaults.shippingSettings,
    codSettings: cod.success ? cod.data : defaults.codSettings,
    taxSettings: tax.success
      ? {
          ...tax.data,
          vatRegistered:
            tax.data.vatRegistered ?? defaults.taxSettings.vatRegistered,
          active:
            (tax.data.vatRegistered ?? defaults.taxSettings.vatRegistered)
              ? tax.data.active
              : false,
        }
      : defaults.taxSettings,
  };
}
export function settingsWarnings(record: StoreSettings | null): string[] {
  if (!record) return [];
  const warnings: string[] = [];
  const defaults = settingsDefaults();
  const raw = objectValue(record.shippingSettings);
  const legacy = objectValue(raw.standard ?? raw.express);
  if (
    !shippingSchema.safeParse({
      ...defaults.shippingSettings,
      ...raw,
      deliveryPrice:
        raw.deliveryPrice ??
        (legacy.price !== undefined
          ? legacy
          : defaults.shippingSettings.deliveryPrice),
    }).success
  )
    warnings.push(
      "Configurația de livrare salvată este invalidă. Editorul arată valori inițiale; verifică și salvează secțiunea Livrare."
    );
  const cod = objectValue(record.paymentSettings).codSettings;
  if (cod && !codSchema.safeParse(cod).success)
    warnings.push(
      "Configurația de ramburs salvată este invalidă. Verifică și salvează secțiunea Ramburs."
    );
  if (record.taxSettings && !taxSchema.safeParse(record.taxSettings).success)
    warnings.push(
      "Configurația TVA salvată este invalidă. Verifică și salvează secțiunea TVA."
    );
  return warnings;
}
export function journalFromSettings(
  record: StoreSettings | null
): SettingsJournal {
  const raw = objectValue(objectValue(record?.metadata).adminSettingsJournal);
  return {
    history: Array.isArray(raw.history)
      ? raw.history.filter((item: unknown): item is SettingsHistory => {
          const value = objectValue(item);
          return (
            typeof value.id === "string" &&
            typeof value.date === "string" &&
            typeof value.actor === "string" &&
            typeof value.section === "string" &&
            ["save", "backup", "restore"].includes(String(value.action)) &&
            Array.isArray(value.fields) &&
            value.fields.every(field => typeof field === "string")
          );
        })
      : [],
    backups: Array.isArray(raw.backups)
      ? raw.backups.filter((item: unknown): item is SettingsBackup => {
          const value = objectValue(item);
          return (
            typeof value.id === "string" &&
            typeof value.name === "string" &&
            typeof value.date === "string" &&
            typeof value.actor === "string" &&
            ["manual", "before-save", "before-restore"].includes(
              String(value.kind)
            ) &&
            !!value.values &&
            typeof value.values === "object"
          );
        })
      : [],
  };
}
export function settingsView(record: StoreSettings | null): SettingsView {
  const journal = journalFromSettings(record);
  const key = process.env.STRIPE_SECRET_KEY || "";
  return {
    ...fieldsFromSettings(record),
    id: record?.id ?? null,
    updatedAt: record?.updatedAt.toISOString() ?? null,
    source: record ? "database" : "defaults",
    warnings: settingsWarnings(record),
    history: journal.history,
    backups: journal.backups.map(({ values: _values, ...backup }) => backup),
    integrations: {
      stripe: key.startsWith("sk_live_")
        ? "live"
        : key.startsWith("sk_test_")
          ? "test"
          : "missing",
      email: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      fanCourier: Boolean(
        process.env.FANCOURIER_CLIENT_ID &&
          process.env.FANCOURIER_USERNAME &&
          process.env.FANCOURIER_PASSWORD
      ),
    },
  };
}
