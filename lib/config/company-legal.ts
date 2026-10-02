/**
 * Shared Legal and Company Constants
 * Single source of truth for company information used across emails and footer
 * Values taken from components/layout/Footer.tsx
 */

export const COMPANY_LEGAL = {
  name: "WEBIRA REM S.R.L.",
  cui: "51813997",
  regCom: "J20/352/2025",
  address: "Strada Mehedinți 54-56, Cluj-Napoca, România",
  phone: "+40771248029",
  email: "info@techtots.ro",
} as const;

export const CONSUMER_RIGHTS = {
  withdrawalDays: 14,
  policyUrl: "https://www.techtots.ro/returns",
  termsUrl: "https://www.techtots.ro/terms",
  privacyUrl: "https://www.techtots.ro/privacy",
} as const;
