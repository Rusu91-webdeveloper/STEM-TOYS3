/**
 * Professional Campaign Email Templates
 * Enhanced with enterprise-grade design system and components
 * For seasonal campaigns, product launches, and special promotions
 */

import { prisma } from "@/lib/prisma";

import { sendMail } from "../brevo";

import { getStoreSettings, getBaseUrl } from "./base";

export interface CampaignProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  image?: string;
  description?: string;
  category?: string;
}

export interface SeasonalCampaign {
  title: string;
  subtitle: string;
  theme:
    | "christmas"
    | "easter"
    | "summer"
    | "back-to-school"
    | "winter"
    | "spring"
    | "custom";
  discountPercentage?: number;
  discountCode?: string;
  validUntil?: Date;
  featuredProducts?: CampaignProduct[];
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Professional Seasonal Campaign Email
 * Enhanced with dynamic theming, product showcases, and engagement features
 */
export async function sendSeasonalCampaignEmail({
  to,
  name,
  campaign,
}: {
  to: string;
  name: string;
  campaign: SeasonalCampaign;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();

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

  // Get campaign theme colors and styling
  const getCampaignTheme = (theme: string) => {
    switch (theme) {
      case "christmas":
        return {
          gradient: gradients.promotional,
          primaryColor: colors.warning[600],
          secondaryColor: colors.success[600],
          icon: "🎄",
          title: "Sărbători Fericite!",
        };
      case "easter":
        return {
          gradient: gradients.success,
          primaryColor: colors.accent.purple,
          secondaryColor: colors.warning[600],
          icon: "🥚",
          title: "Sărbători de Paști!",
        };
      case "summer":
        return {
          gradient: gradients.warning,
          primaryColor: colors.accent.orange,
          secondaryColor: colors.warning[600],
          icon: "☀️",
          title: "Vara STEM!",
        };
      case "back-to-school":
        return {
          gradient: gradients.primary,
          primaryColor: colors.primary[600],
          secondaryColor: colors.accent.purple,
          icon: "📚",
          title: "Înapoi la Școală!",
        };
      case "winter":
        return {
          gradient: gradients.info,
          primaryColor: colors.info[600],
          secondaryColor: colors.neutral[600],
          icon: "❄️",
          title: "Iarna STEM!",
        };
      case "spring":
        return {
          gradient: gradients.success,
          primaryColor: colors.success[600],
          secondaryColor: colors.accent.purple,
          icon: "🌸",
          title: "Primăvara STEM!",
        };
      default:
        return {
          gradient: gradients.promotional,
          primaryColor: colors.primary[600],
          secondaryColor: colors.accent.purple,
          icon: "🎉",
          title: "Campanie Specială!",
        };
    }
  };

  const theme = getCampaignTheme(campaign.theme);

  // Professional seasonal campaign content
  const content = `
    ${createHeroSection(
      `${theme.icon} ${campaign.title}`,
      campaign.subtitle,
      theme.gradient
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${name}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        ${campaign.subtitle}
      </p>
    </div>

    ${
      campaign.discountPercentage
        ? `
          <div style="text-align: center; margin: ${spacing.xl} 0;">
            <div style="background: ${colors.warning[50]}; border: 2px solid ${colors.warning[300]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.lg} 0;">
              <div style="font-size: ${typography.fontSize["4xl"]}; font-weight: ${typography.fontWeight.black}; color: ${colors.warning[600]}; margin: ${spacing.md} 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                ${campaign.discountPercentage}% REDUCERE
              </div>
              ${
                campaign.discountCode
                  ? `
                    <div style="background: ${colors.warning[100]}; border: 2px solid ${colors.warning[400]}; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; margin: ${spacing.md} 0; display: inline-block;">
                      <p style="margin: 0; font-size: ${typography.fontSize.lg}; color: ${colors.warning[800]}; font-weight: ${typography.fontWeight.semibold};">
                        Utilizează codul: 
                        <span style="background: ${colors.warning[200]}; padding: ${spacing.sm} ${spacing.md}; border-radius: ${borderRadius.md}; font-size: ${typography.fontSize.xl}; letter-spacing: 2px; font-family: monospace; color: ${colors.warning[900]}; font-weight: ${typography.fontWeight.bold};">
                          ${campaign.discountCode}
                        </span>
                      </p>
                    </div>
                  `
                  : ""
              }
              ${
                campaign.validUntil
                  ? `
                    <p style="margin: ${spacing.md} 0 0 0; font-size: ${typography.fontSize.base}; color: ${colors.warning[700]}; font-weight: ${typography.fontWeight.semibold};">
                      ⏰ Ofertă valabilă până la ${campaign.validUntil.toLocaleDateString(
                        "ro-RO",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  `
                  : ""
              }
            </div>
          </div>
        `
        : ""
    }

    ${
      campaign.featuredProducts && campaign.featuredProducts.length > 0
        ? `
          <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
            <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
              🎁 Produse Recomandate pentru ${theme.title}
            </h3>
            <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.primary[700]}; text-align: center; line-height: ${typography.lineHeight.relaxed};">
              Descoperă produsele noastre speciale pentru această perioadă:
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: ${spacing.md};">
              ${campaign.featuredProducts
                .map(
                  product => `
                    <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]};">
                      ${
                        product.image
                          ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: ${borderRadius.md}; margin-bottom: ${spacing.md};">`
                          : ""
                      }
                      <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]};">
                        ${product.name}
                      </h4>
                      ${
                        product.description
                          ? `<p style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
                              ${product.description}
                            </p>`
                          : ""
                      }
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: ${spacing.md};">
                        <div>
                          ${
                            product.salePrice
                              ? `
                                <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[500]}; text-decoration: line-through;">
                                  ${product.price} LEI
                                </p>
                                <p style="margin: 0; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.bold}; color: ${colors.warning[600]};">
                                  ${product.salePrice} LEI
                                </p>
                              `
                              : `
                                <p style="margin: 0; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]};">
                                  ${product.price} LEI
                                </p>
                              `
                          }
                        </div>
                        ${createButton(
                          "Vezi Produsul",
                          `${baseUrl}/products/${product.slug}`,
                          "secondary",
                          "sm"
                        )}
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        `
        : ""
    }

    ${createFeatureGrid([
      {
        icon: "🎯",
        title: "Produse Speciale",
        description:
          "Colecție exclusivă de produse STEM pentru această perioadă.",
        color: theme.primaryColor,
      },
      {
        icon: "🚚",
        title: "Livrare Rapidă",
        description: "Livrare în toată România cu curieri de încredere.",
        color: colors.success[600],
      },
      {
        icon: "🎁",
        title: "Oferte Exclusive",
        description: "Reduceri speciale și oferte exclusive pentru abonați.",
        color: colors.warning[600],
      },
      {
        icon: "💎",
        title: "Calitate Premium",
        description:
          "Toate produsele sunt testate și aprobate pentru siguranță.",
        color: colors.accent.purple,
      },
    ])}

    ${createCTASection(
      campaign.ctaText || "Explorează Campania",
      "Nu rata această oportunitate specială! Grăbește-te să profiți de ofertele exclusive.",
      {
        text: campaign.ctaText || "🛍️ Explorează Campania",
        url: campaign.ctaUrl || `${baseUrl}/products`,
      },
      {
        text: "📚 Vezi Cărți Digitale",
        url: `${baseUrl}/digital-books`,
      }
    )}

    ${
      campaign.validUntil
        ? createAlert(
            `<strong>⏰ Ofertă pe Timp Limitat!</strong><br>
             Această campanie este valabilă doar până la ${campaign.validUntil.toLocaleDateString(
               "ro-RO",
               {
                 year: "numeric",
                 month: "long",
                 day: "numeric",
               }
             )}. Grăbește-te să profiți de ofertele exclusive!`,
            "warning",
            "⏰"
          )
        : createAlert(
            `<strong>🎉 Campanie Specială!</strong><br>
             Această campanie este disponibilă doar pentru o perioadă limitată. Nu rata această oportunitate!`,
            "warning",
            "🎉"
          )
    }

    ${createTestimonial(
      `Campaniile de la ${storeSettings.storeName} sunt minunate! Produsele sunt de calitate și ofertele sunt foarte bune.`,
      "Elena Popescu",
      "Mamă de 2 copii",
      5
    )}

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Cu respect,
      </p>
      <p style="font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]}; margin: 0;">
        Echipa ${storeSettings.storeName}
      </p>
      <p style="font-size: ${typography.fontSize.sm}; color: ${colors.neutral[500]}; margin-top: ${spacing.sm};">
        Împreună construim viitorul prin educație STEM
      </p>
    </div>
  `;

  const previewText = generatePreviewText(
    `${campaign.title}: ${campaign.subtitle}${campaign.discountPercentage ? ` cu ${campaign.discountPercentage}% reducere` : ""}! Explorează ofertele exclusive la ${storeSettings.storeName}.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    `Campanie ${campaign.theme}`,
    previewText
  );

  return sendMail({
    to,
    subject: `${campaign.title} - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}

/**
 * Professional Product Launch Email
 * Enhanced with product showcases, features, and launch excitement
 */
export async function sendProductLaunchEmail({
  to,
  name,
  product,
  launchDate,
  earlyBirdDiscount,
}: {
  to: string;
  name: string;
  product: CampaignProduct;
  launchDate: Date;
  earlyBirdDiscount?: number;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();

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
    createTestimonial,
  } = await import("./components");

  // Professional product launch content
  const content = `
    ${createHeroSection(
      "🚀 Produs Nou Lansat!",
      `Introducem cu mândrie noul nostru produs: ${product.name}!`,
      gradients.promotional
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${name}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Suntem încântați să anunțăm lansarea noului nostru produs STEM! Acest produs va ajuta copiii să exploreze și să învețe într-un mod nou și captivant.
      </p>
    </div>

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        🎁 ${product.name}
      </h3>
      
      <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]}; margin: ${spacing.lg} 0;">
        ${
          product.image
            ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: ${borderRadius.md}; margin-bottom: ${spacing.md};">`
            : ""
        }
        
        ${
          product.description
            ? `<p style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.base}; color: ${colors.neutral[700]}; line-height: ${typography.lineHeight.relaxed};">
                ${product.description}
              </p>`
            : ""
        }
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: ${spacing.md};">
          <div>
            <p style="margin: 0; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]};">
              ${product.price} LEI
            </p>
            ${
              product.category
                ? `<p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
                    Categorie: ${product.category}
                  </p>`
                : ""
            }
          </div>
          ${createButton(
            "Vezi Produsul",
            `${baseUrl}/products/${product.slug}`,
            "primary",
            "md"
          )}
        </div>
      </div>
    </div>

    ${
      earlyBirdDiscount
        ? createAlert(
            `<strong>🎉 Ofertă Early Bird!</strong><br>
             Primești ${earlyBirdDiscount}% reducere dacă comanzi în primele 48 de ore de la lansare!`,
            "success",
            "🎉"
          )
        : ""
    }

    ${createFeatureGrid([
      {
        icon: "🚀",
        title: "Lansare Nouă",
        description: "Produs nou lansat cu tehnologii și design inovatoare.",
        color: colors.primary[600],
      },
      {
        icon: "🎯",
        title: "Educație STEM",
        description:
          "Dezvoltă abilitățile STEM ale copiilor într-un mod distractiv.",
        color: colors.success[600],
      },
      {
        icon: "💎",
        title: "Calitate Premium",
        description:
          "Produs de calitate superioară, testat și aprobat pentru siguranță.",
        color: colors.accent.purple,
      },
      {
        icon: "🎁",
        title: "Livrare Rapidă",
        description: "Livrare în toată România cu curieri de încredere.",
        color: colors.warning[600],
      },
    ])}

    ${createCTASection(
      "Fii Primul Care Îl Încearcă",
      "Nu rata această oportunitate de a fi printre primii care încarcă noul nostru produs!",
      {
        text: "🛍️ Comandă Acum",
        url: `${baseUrl}/products/${product.slug}`,
      },
      {
        text: "📚 Vezi Cărți Digitale",
        url: `${baseUrl}/digital-books`,
      }
    )}

    ${createAlert(
      `<strong>📅 Lansare: ${launchDate.toLocaleDateString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</strong><br>
       Produsul va fi disponibil pentru comandă începând cu această dată.`,
      "info",
      "📅"
    )}

    ${createTestimonial(
      "Produsele noi de la ${storeSettings.storeName} sunt întotdeauna de calitate superioară. Sunt încântată să încerc noul produs!",
      "Maria Ionescu",
      "Mamă de 2 copii",
      5
    )}

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Cu respect,
      </p>
      <p style="font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]}; margin: 0;">
        Echipa ${storeSettings.storeName}
      </p>
      <p style="font-size: ${typography.fontSize.sm}; color: ${colors.neutral[500]}; margin-top: ${spacing.sm};">
        Împreună construim viitorul prin educație STEM
      </p>
    </div>
  `;

  const previewText = generatePreviewText(
    `Produs nou lansat: ${product.name}! Fii primul care îl încarcă. Lansare pe ${launchDate.toLocaleDateString("ro-RO")}.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Lansare produs nou",
    previewText
  );

  return sendMail({
    to,
    subject: `Produs nou: ${product.name} - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}
