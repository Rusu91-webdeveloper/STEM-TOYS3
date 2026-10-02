/**
 * Shared Legal and Company Constants
 * Single source of truth for company information used across emails and footer
 * Values taken from app/contact/page.tsx (~338) and components/layout/Footer.tsx
 */

export const COMPANY_LEGAL = {
  name: "WEBIRA REM S.R.L.",
  cui: "51813997",
  regCom: "J20/352/2025",
  address: "Mehedinți 54-56, Bl D5, sc 2, Cluj-Napoca, Cluj, România",
  phone: "+40771248029",
  email: "info@techtots.ro",
} as const;

export const CONSUMER_RIGHTS = {
  withdrawalDays: 14,
  policyUrl: "https://www.techtots.ro/returns",
  termsUrl: "https://www.techtots.ro/terms",
  privacyUrl: "https://www.techtots.ro/privacy",
} as const;
