/**
 * Base email utilities for Brevo integration
 * Shared functions for email templates including headers, footers, and formatters
 */

import { StoreSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Base URL for links
export const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Get store settings singleton with cached result
let cachedStoreSettings: StoreSettings | null = null;
export async function getStoreSettings(): Promise<StoreSettings> {
  if (cachedStoreSettings) return cachedStoreSettings;

  const settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    throw new Error("Store settings not found");
  }

  cachedStoreSettings = settings;
  return settings;
}

/**
 * Format a price as currency (Romanian Lei)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Generate professional email header with logo
 */
export function generateEmailHeader(storeSettings: StoreSettings): string {
  const baseUrl = getBaseUrl();

  return `
    <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #3b82f6;">
      <img src="${baseUrl}/TechTots_LOGO.png" alt="${storeSettings.storeName}" style="max-width: 200px; height: auto;">
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px; font-style: italic;">Jucării STEM pentru Minți Curioase</p>
    </div>
  `;
}

/**
 * Generate GDPR-compliant professional footer with Romanian company details
 */
export function generateEmailFooter(storeSettings: StoreSettings): string {
  const baseUrl = getBaseUrl();
  const year = new Date().getFullYear();

  return `
    <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb; background-color: #f8fafc; padding: 24px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${baseUrl}/TechTots_LOGO.png" alt="${storeSettings.storeName}" style="max-width: 120px; height: auto; opacity: 0.8;">
      </div>
      
      <div style="text-align: center; color: #4b5563; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 16px 0; font-weight: 600; color: #1f2937;">${storeSettings.storeName} - Jucării STEM pentru Minți Curioase</p>
        
        <div style="margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0;"><strong>Adresa:</strong> Mehedinti 54-56, Bl D5, sc 2, apt 70</p>
          <p style="margin: 0 0 8px 0;">Mehedinti 54-56,Bl D5,APT 70, Cluj-Napoca,Cluj</p>
          <p style="margin: 0 0 8px 0;"><strong>Email:</strong> webira.rem.srl@gmail.com</p>
          <p style="margin: 0 0 16px 0;"><strong>Telefon:</strong> +40 771 248 029</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <a href="${baseUrl}/privacy" style="color: #3b82f6; text-decoration: none; margin: 0 12px;">Politica de Confidențialitate</a>
          <a href="${baseUrl}/terms" style="color: #3b82f6; text-decoration: none; margin: 0 12px;">Termeni și Condiții</a>
          <a href="${baseUrl}/unsubscribe?email={{params.email}}" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Dezabonare</a>
        </div>
        
        <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${year} ${storeSettings.storeName}. Toate drepturile rezervate.</p>
      </div>
    </div>
  `;
}

/**
 * Generate professional email container
 */
export function generateEmailContainer(content: string): string {
  return `
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <div style="padding: 40px 30px;">
        ${content}
      </div>
    </div>
  `;
}

/**
 * Generate complete email HTML structure
 */
export function generateEmailHTML(
  content: string,
  storeSettings: StoreSettings,
  title: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - ${storeSettings.storeName}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      ${generateEmailContainer(content)}
      ${generateEmailFooter(storeSettings)}
    </body>
    </html>
  `;
}

// Type definitions
export type SEOMetadata = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
};

export interface BlogWithAuthorAndCategory {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string };
  category: { name: string; slug: string };
}
