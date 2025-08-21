import type { Coupon } from "@prisma/client";

import { sendMail } from "@/lib/brevo";
import { db } from "@/lib/db";

/**
 * Sends a professional promotional email for a specific coupon to a user.
 * Enhanced with enterprise-grade design system and components.
 *
 * @param {string} to - The recipient's email address.
 * @param {Coupon} coupon - The coupon object from the database.
 * @param {string} subject - The subject of the email.
 * @param {string} [message] - An optional custom message to include.
 * @returns {Promise<void>}
 */
export async function sendCouponEmail({
  to,
  coupon,
  subject,
  message,
}: {
  to: string;
  coupon: Coupon;
  subject: string;
  message?: string;
}): Promise<void> {
  const storeSettings = await db.storeSettings.findFirst();
  const storeName = storeSettings?.storeName || "TechTots";
  const baseUrl = storeSettings?.storeUrl || "https://techtots.com";

  const { generateProfessionalEmail, generatePreviewText } = await import(
    "./base"
  );

  const { colors, gradients, typography, spacing, borderRadius } = await import(
    "./design-system"
  );

  const {
    createHeroSection,
    createAlert,
    createButton,
    createFeatureGrid,
    createCTASection,
    createProductCard,
    createTestimonial,
  } = await import("./components");

  // Create email content
  const discountText =
    coupon.type === "PERCENTAGE"
      ? `${coupon.value}% REDUCERE`
      : `${coupon.value} LEI REDUCERE`;

  const expiryText = coupon.expiresAt
    ? `Expiră: ${coupon.expiresAt.toLocaleDateString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`
    : "Fără dată de expirare";

  const minOrderText = coupon.minimumOrderValue
    ? `Valoare minimă comandă: ${coupon.minimumOrderValue} LEI`
    : "";

  // Professional coupon email content
  const content = `
    ${createHeroSection(
      "🎉 Ofertă Specială Pentru Tine!",
      "Descoperă colecția noastră de jucării STEM cu reducerea exclusivă de mai jos!",
      gradients.promotional
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <div style="background: ${colors.warning[50]}; border: 2px solid ${colors.warning[300]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.lg} 0;">
        <div style="font-size: ${typography.fontSize["4xl"]}; font-weight: ${typography.fontWeight.black}; color: ${colors.warning[600]}; margin: ${spacing.md} 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
          ${discountText}
        </div>
        <div style="background: ${colors.warning[100]}; border: 2px solid ${colors.warning[400]}; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; margin: ${spacing.md} 0; display: inline-block;">
          <p style="margin: 0; font-size: ${typography.fontSize.lg}; color: ${colors.warning[800]}; font-weight: ${typography.fontWeight.semibold};">
            Utilizează codul: 
            <span style="background: ${colors.warning[200]}; padding: ${spacing.sm} ${spacing.md}; border-radius: ${borderRadius.md}; font-size: ${typography.fontSize.xl}; letter-spacing: 2px; font-family: monospace; color: ${colors.warning[900]}; font-weight: ${typography.fontWeight.bold};">
              ${coupon.code}
            </span>
          </p>
        </div>
      </div>
    </div>

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; display: flex; align-items: center;">
        <span style="margin-right: ${spacing.sm};">🎁</span> ${coupon.name}
      </h3>
      ${coupon.description ? `<p style="color: ${colors.primary[700]}; margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; line-height: ${typography.lineHeight.relaxed};">${coupon.description}</p>` : ""}
      ${message ? createAlert(`"${message}"`, "info", "💬") : ""}
      
      <div style="border-top: 2px solid ${colors.primary[200]}; padding-top: ${spacing.lg}; margin-top: ${spacing.lg};">
        <div style="display: grid; gap: ${spacing.md};">
          <div style="display: flex; align-items: center; padding: ${spacing.md}; background: white; border-radius: ${borderRadius.md}; border: 1px solid ${colors.primary[200]};">
            <span style="margin-right: ${spacing.sm}; font-size: ${typography.fontSize.lg}; color: ${colors.warning[600]};">📅</span>
            <strong style="color: ${colors.primary[800]}; font-size: ${typography.fontSize.base};">${expiryText}</strong>
          </div>
          ${
            minOrderText
              ? `
            <div style="display: flex; align-items: center; padding: ${spacing.md}; background: white; border-radius: ${borderRadius.md}; border: 1px solid ${colors.primary[200]};">
              <span style="margin-right: ${spacing.sm}; font-size: ${typography.fontSize.lg}; color: ${colors.success[600]};">💰</span>
              <strong style="color: ${colors.primary[800]}; font-size: ${typography.fontSize.base};">${minOrderText}</strong>
            </div>
          `
              : ""
          }
          ${
            coupon.maxUsesPerUser
              ? `
            <div style="display: flex; align-items: center; padding: ${spacing.md}; background: white; border-radius: ${borderRadius.md}; border: 1px solid ${colors.primary[200]};">
              <span style="margin-right: ${spacing.sm}; font-size: ${typography.fontSize.lg}; color: ${colors.accent.purple};">👤</span>
              <strong style="color: ${colors.primary[800]}; font-size: ${typography.fontSize.base};">Limită: ${coupon.maxUsesPerUser} utilizare/utilizări per client</strong>
            </div>
          `
              : ""
          }
          ${
            coupon.type === "PERCENTAGE" && coupon.maxDiscountAmount
              ? `
            <div style="display: flex; align-items: center; padding: ${spacing.md}; background: white; border-radius: ${borderRadius.md}; border: 1px solid ${colors.primary[200]};">
              <span style="margin-right: ${spacing.sm}; font-size: ${typography.fontSize.lg}; color: ${colors.accent.orange};">🎯</span>
              <strong style="color: ${colors.primary[800]}; font-size: ${typography.fontSize.base};">Reducere maximă: ${coupon.maxDiscountAmount} LEI</strong>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>

    ${createFeatureGrid([
      {
        icon: "🛒",
        title: "Adaugă în Coș",
        description: "Adaugă produsele dorite în coșul tău de cumpărături.",
        color: colors.primary[600],
      },
      {
        icon: "🎫",
        title: "Introdu Codul",
        description: `Introdu codul <strong>${coupon.code}</strong> la finalizarea comenzii.`,
        color: colors.warning[600],
      },
      {
        icon: "💰",
        title: "Economisește",
        description: "Bucură-te de reducerea ta și economisește bani!",
        color: colors.success[600],
      },
      {
        icon: "🚚",
        title: "Livrare Rapidă",
        description:
          "Primește produsele la ușa ta cu livrare rapidă și sigură.",
        color: colors.accent.purple,
      },
    ])}

    ${createCTASection(
      "Cumpără Acum & Economisește",
      "Nu rata această ofertă specială! Grăbește-te să profiți de reducerea exclusivă.",
      {
        text: "🛒 Cumpără Acum & Economisește",
        url: baseUrl,
      },
      {
        text: "📚 Vezi Cărți Digitale",
        url: `${baseUrl}/digital-books`,
      }
    )}

    ${createAlert(
      `<strong>⚡ Ofertă pe Timp Limitat!</strong><br>
       Grăbește-te! Această ofertă este valabilă doar pentru o perioadă limitată și în limita stocului disponibil.`,
      "warning",
      "⚡"
    )}

    ${createFeatureGrid([
      {
        icon: "🎓",
        title: "Educație STEM",
        description:
          "Produse educaționale de calitate pentru dezvoltarea copiilor.",
        color: colors.primary[600],
      },
      {
        icon: "🚚",
        title: "Livrare Rapidă",
        description: "Livrare în toată România cu curieri de încredere.",
        color: colors.success[600],
      },
      {
        icon: "💎",
        title: "Calitate Premium",
        description:
          "Toate produsele sunt testate și aprobate pentru siguranță.",
        color: colors.accent.purple,
      },
      {
        icon: "🎯",
        title: "Dezvoltare Copii",
        description: "Împreună construim viitorul prin educație STEM.",
        color: colors.accent.orange,
      },
    ])}

    ${createTestimonial(
      "Produsele STEM de la ${storeName} au transformat complet modul în care copilul meu învață. Reducerile sunt minunate!",
      "Elena Popescu",
      "Mamă de 2 copii",
      5
    )}

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Cu respect și prețuire,
      </p>
      <p style="font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]}; margin: 0;">
        Echipa ${storeName}
      </p>
      <p style="font-size: ${typography.fontSize.sm}; color: ${colors.neutral[500]}; margin-top: ${spacing.sm};">
        Investim în viitorul copiilor prin educația STEM
      </p>
    </div>
  `;

  const previewText = generatePreviewText(
    `Ofertă specială: ${discountText} cu codul ${coupon.code}! Grăbește-te să profiți de reducerea exclusivă la ${storeName}.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Ofertă specială",
    previewText
  );

  await sendMail({
    to,
    subject,
    html,
    from: storeSettings?.contactEmail,
    fromName: storeName,
  });
}
