/**
 * Professional Base Email Infrastructure for TechTots
 * Enterprise-grade email utilities with multi-million dollar company appearance
 */

import { StoreSettings } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  email,
} from "./design-system";
import {
  createProfessionalHeader,
  createProfessionalFooter,
} from "./components";

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
 * Generate professional email header with logo (Legacy - use createProfessionalHeader instead)
 */
export function generateEmailHeader(storeSettings: StoreSettings): string {
  const baseUrl = getBaseUrl();
  return createProfessionalHeader(storeSettings, baseUrl);
}

/**
 * Generate GDPR-compliant professional footer with Romanian company details (Legacy - use createProfessionalFooter instead)
 */
export function generateEmailFooter(storeSettings: StoreSettings): string {
  const baseUrl = getBaseUrl();
  return createProfessionalFooter(storeSettings, baseUrl);
}

/**
 * Generate professional email container with advanced styling
 */
export function generateEmailContainer(content: string): string {
  return `
    <div style="
      background-color: white; 
      max-width: 600px; 
      margin: 0 auto; 
      font-family: ${typography.fontFamily.primary}; 
      line-height: ${typography.lineHeight.normal}; 
      color: ${colors.neutral[800]};
      border-radius: ${borderRadius.xl};
      box-shadow: ${shadows["2xl"]};
      overflow: hidden;
    ">
      <div style="padding: ${spacing["2xl"]} ${spacing.xl};">
        ${content}
      </div>
    </div>
  `;
}

/**
 * Generate complete professional email HTML structure with advanced features
 */
export function generateEmailHTML(
  content: string,
  storeSettings: StoreSettings,
  title: string,
  previewText?: string
): string {
  const baseUrl = getBaseUrl();

  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${title} - ${storeSettings.storeName}</title>
      ${previewText ? `<meta name="description" content="${previewText}">` : ""}
      
      <!-- Professional Email Styles -->
      <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        
        /* Professional typography */
        body { font-family: ${typography.fontFamily.primary}; line-height: ${typography.lineHeight.normal}; color: ${colors.neutral[800]}; }
        
        /* Responsive design */
        @media only screen and (max-width: 600px) {
          .mobile-full { width: 100% !important; }
          .mobile-center { text-align: center !important; }
          .mobile-padding { padding: 20px !important; }
          .mobile-stack { display: block !important; }
          .mobile-text { font-size: 16px !important; }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .dark-mode { background-color: ${colors.neutral[900]} !important; color: ${colors.neutral[100]} !important; }
          .dark-mode-text { color: ${colors.neutral[100]} !important; }
          .dark-mode-border { border-color: ${colors.neutral[700]} !important; }
        }
        
        /* Professional animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in { animation: fadeIn 0.5s ease-out; }
        
        /* Email client specific fixes */
        .outlook-fix { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        .gmail-fix { display: inline-block !important; }
        .apple-mail-fix { -webkit-text-size-adjust: 100%; }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background: linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%);">
      <div class="fade-in">
        ${generateEmailContainer(content)}
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate professional email with header and footer
 */
export function generateProfessionalEmail(
  content: string,
  storeSettings: StoreSettings,
  title: string,
  previewText?: string
): string {
  const baseUrl = getBaseUrl();

  const fullContent = `
    ${createProfessionalHeader(storeSettings, baseUrl)}
    <div style="padding: ${spacing.xl};">
      ${content}
    </div>
    ${createProfessionalFooter(storeSettings, baseUrl)}
  `;

  return generateEmailHTML(fullContent, storeSettings, title, previewText);
}

/**
 * Generate email preview text for better inbox display
 */
export function generatePreviewText(
  text: string,
  maxLength: number = 150
): string {
  const cleanText = text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleanText.length > maxLength
    ? cleanText.substring(0, maxLength) + "..."
    : cleanText;
}

/**
 * Generate professional tracking pixel (for analytics)
 */
export function generateTrackingPixel(emailId: string): string {
  const baseUrl = getBaseUrl();
  return `<img src="${baseUrl}/api/email/track/${emailId}" width="1" height="1" style="display:none;" alt="">`;
}

/**
 * Generate professional unsubscribe link
 */
export function generateUnsubscribeLink(
  email: string,
  listId?: string
): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams({ email });
  if (listId) params.append("list", listId);
  return `${baseUrl}/unsubscribe?${params.toString()}`;
}

/**
 * Generate professional social media links
 */
export function generateSocialLinks(): string {
  return `
    <div style="text-align: center; margin: ${spacing.lg} 0;">
      <a href="https://facebook.com/techtots" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="${getBaseUrl()}/icons/facebook.png" alt="Facebook" style="width: 24px; height: 24px;">
      </a>
      <a href="https://instagram.com/techtots" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="${getBaseUrl()}/icons/instagram.png" alt="Instagram" style="width: 24px; height: 24px;">
      </a>
      <a href="https://youtube.com/techtots" style="display: inline-block; margin: 0 8px; text-decoration: none;">
        <img src="${getBaseUrl()}/icons/youtube.png" alt="YouTube" style="width: 24px; height: 24px;">
      </a>
    </div>
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
