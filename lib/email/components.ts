/**
 * Professional Email Components for TechTots
 * Reusable components for enterprise-grade email templates
 */

import {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
} from "./design-system";

// Professional Header Component - Enhanced with modern design
export function createHeader(storeSettings: any, baseUrl: string): string {
  return `
    <div style="background: ${gradients.primary}; padding: ${spacing["2xl"]} ${spacing.xl}; text-align: center; border-radius: ${borderRadius.xl} ${borderRadius.xl} 0 0; box-shadow: ${shadows.lg}; position: relative; overflow: hidden;">
      <!-- Decorative background pattern -->
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%);"></div>
      <div style="max-width: 600px; margin: 0 auto; position: relative; z-index: 1;">
        <img src="${baseUrl}/TechTots_LOGO.png" alt="${storeSettings.storeName}" style="max-width: 200px; height: auto; margin-bottom: ${spacing.lg}; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">
        <div style="color: white; margin-bottom: ${spacing.md};">
          <h1 style="margin: 0; font-size: ${typography.fontSize["3xl"]}; font-weight: ${typography.fontWeight.bold}; font-family: ${typography.fontFamily.primary}; text-shadow: 0 2px 8px rgba(0,0,0,0.2); letter-spacing: -0.5px;">
            ${storeSettings.storeName}
          </h1>
          <p style="margin: ${spacing.sm} 0 0 0; font-size: ${typography.fontSize.base}; opacity: 0.95; font-family: ${typography.fontFamily.primary}; font-weight: ${typography.fontWeight.medium};">
            ${storeSettings.storeDescription || "Jucării STEM pentru Minți Curioase"}
          </p>
        </div>
      </div>
    </div>
  `;
}

// Professional Hero Section Component - Enhanced with modern design
export function createHeroSection(
  title: string,
  subtitle?: string,
  background?: string
): string {
  const bg = background || gradients.primary;

  return `
    <div style="background: ${bg}; padding: ${spacing["2xl"]} ${spacing.xl}; text-align: center; border-radius: ${borderRadius.xl}; margin: ${spacing.xl} 0; box-shadow: ${shadows.xl}; position: relative; overflow: hidden;">
      <!-- Decorative background elements -->
      <div style="position: absolute; top: -50%; right: -20%; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -30%; left: -10%; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
      <div style="position: relative; z-index: 1;">
        <h1 style="color: white; margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize["3xl"]}; font-weight: ${typography.fontWeight.bold}; font-family: ${typography.fontFamily.primary}; line-height: ${typography.lineHeight.tight}; text-shadow: 0 2px 12px rgba(0,0,0,0.2); letter-spacing: -0.5px;">
          ${title}
        </h1>
        ${
          subtitle
            ? `
          <p style="color: rgba(255, 255, 255, 0.95); margin: 0; font-size: ${typography.fontSize.lg}; font-family: ${typography.fontFamily.primary}; line-height: ${typography.lineHeight.relaxed}; font-weight: ${typography.fontWeight.medium}; text-shadow: 0 1px 4px rgba(0,0,0,0.15);">
            ${subtitle}
          </p>
        `
            : ""
        }
      </div>
    </div>
  `;
}

// Professional Button Component - Enhanced with modern, appealing design
export function createButton(
  text: string,
  href: string,
  variant: "primary" | "secondary" | "success" | "warning" = "primary",
  size: "sm" | "md" | "lg" = "md"
): string {
  const buttonStyles = components.button[variant];
  const padding =
    size === "sm" ? "12px 24px" : size === "lg" ? "18px 40px" : "14px 32px";
  const fontSize =
    size === "sm"
      ? typography.fontSize.sm
      : size === "lg"
        ? typography.fontSize.lg
        : typography.fontSize.base;

  return `
    <a href="${href}" 
       style="${buttonStyles} padding: ${padding}; font-size: ${fontSize}; display: inline-block; text-align: center; min-width: 140px; border: none; cursor: pointer; text-decoration: none; box-shadow: ${shadows.lg}; transform: translateY(0); transition: all 0.3s ease;">
      ${text}
    </a>
  `;
}

// Professional Card Component
export function createCard(
  content: string,
  variant: "base" | "elevated" = "base",
  padding?: string
): string {
  const cardStyles = components.card[variant];
  const cardPadding = padding || spacing.xl;

  return `
    <div style="${cardStyles} padding: ${cardPadding};">
      ${content}
    </div>
  `;
}

// Professional Alert Component
export function createAlert(
  content: string,
  type: "info" | "success" | "warning" | "error" = "info",
  icon?: string
): string {
  const alertStyles = components.alert[type];
  const iconEmoji =
    icon ||
    (type === "info"
      ? "ℹ️"
      : type === "success"
        ? "✅"
        : type === "warning"
          ? "⚠️"
          : "❌");

  return `
    <div style="${alertStyles}">
      <div style="display: flex; align-items: flex-start;">
        <span style="font-size: ${typography.fontSize.lg}; margin-right: ${spacing.sm}; margin-top: 2px;">${iconEmoji}</span>
        <div style="flex: 1;">
          ${content}
        </div>
      </div>
    </div>
  `;
}

// Professional Product Card Component
export function createProductCard(product: {
  name: string;
  price: number;
  image?: string;
  description?: string;
  url: string;
  badge?: string;
}): string {
  return `
    <div style="background: white; border-radius: ${borderRadius.xl}; box-shadow: ${shadows.lg}; overflow: hidden; border: 1px solid ${colors.neutral[200]};">
      ${
        product.image
          ? `
        <div style="background: ${colors.neutral[50]}; padding: ${spacing.lg}; text-align: center;">
          <img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: 120px; object-fit: contain; border-radius: ${borderRadius.md};">
        </div>
      `
          : ""
      }
      
      <div style="padding: ${spacing.lg};">
        ${
          product.badge
            ? `
          <div style="display: inline-block; background: ${gradients.warning}; color: white; padding: 4px 8px; border-radius: ${borderRadius.sm}; font-size: ${typography.fontSize.xs}; font-weight: ${typography.fontWeight.semibold}; margin-bottom: ${spacing.sm};">
            ${product.badge}
          </div>
        `
            : ""
        }
        
        <h3 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[900]}; font-family: ${typography.fontFamily.primary};">
          ${product.name}
        </h3>
        
        ${
          product.description
            ? `
          <p style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.normal};">
            ${product.description}
          </p>
        `
            : ""
        }
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${spacing.md};">
          <span style="font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]};">
            ${new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(product.price)}
          </span>
        </div>
        
        ${createButton("Vezi Produsul", product.url, "primary", "sm")}
      </div>
    </div>
  `;
}

// Professional Order Summary Component
export function createOrderSummary(
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>,
  totalAmount: number,
  shippingCost?: number
): string {
  return `
    <div style="background: ${colors.neutral[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; border: 1px solid ${colors.neutral[200]};">
      <h3 style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[900]}; text-align: center;">
        📋 Sumar Comandă
      </h3>
      
      ${items
        .map(
          item => `
        <div style="display: flex; align-items: center; padding: ${spacing.md} 0; border-bottom: 1px solid ${colors.neutral[200]};">
          ${
            item.image
              ? `
            <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: ${borderRadius.md}; margin-right: ${spacing.md};">
          `
              : ""
          }
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]}; font-size: ${typography.fontSize.base};">
              ${item.name}
            </p>
            <p style="margin: 0; color: ${colors.neutral[600]}; font-size: ${typography.fontSize.sm};">
              Cantitate: ${item.quantity}
            </p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[600]};">
              ${new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(item.price * item.quantity)}
            </p>
          </div>
        </div>
      `
        )
        .join("")}
      
      <div style="border-top: 2px solid ${colors.primary[200]}; padding-top: ${spacing.md}; margin-top: ${spacing.md};">
        ${
          shippingCost !== undefined && shippingCost > 0
            ? `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${spacing.sm};">
          <span style="font-weight: ${typography.fontWeight.medium}; color: ${colors.neutral[700]};">Transport:</span>
          <span style="font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            ${new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(shippingCost)}
          </span>
        </div>
        `
            : ""
        }
        <!-- No VAT/TVA line - non-VAT registered SRL, prices are final -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: ${spacing.md}; border-top: 1px solid ${colors.neutral[300]};">
          <span style="font-weight: ${typography.fontWeight.bold}; color: ${colors.neutral[900]}; font-size: ${typography.fontSize.lg};">Total:</span>
          <span style="font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]}; font-size: ${typography.fontSize.lg};">
            ${new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  `;
}

// Professional Feature Grid Component
export function createFeatureGrid(
  features: Array<{
    icon: string;
    title: string;
    description: string;
    color?: string;
  }>
): string {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: ${spacing.lg}; margin: ${spacing.xl} 0;">
      ${features
        .map(
          feature => `
        <div style="background: white; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; text-align: center; border: 1px solid ${colors.neutral[200]}; box-shadow: ${shadows.sm};">
          <div style="font-size: ${typography.fontSize["3xl"]}; margin-bottom: ${spacing.md}; color: ${feature.color || colors.primary[600]};">
            ${feature.icon}
          </div>
          <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[900]};">
            ${feature.title}
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.normal};">
            ${feature.description}
          </p>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// Professional Testimonial Component
export function createTestimonial(
  quote: string,
  author: string,
  role?: string,
  rating?: number
): string {
  const stars = rating ? "⭐".repeat(rating) : "";

  return `
    <div style="background: ${colors.primary[50]}; border-left: 4px solid ${colors.primary[600]}; padding: ${spacing.xl}; border-radius: 0 ${borderRadius.lg} ${borderRadius.lg} 0; margin: ${spacing.xl} 0;">
      ${
        stars
          ? `
        <div style="margin-bottom: ${spacing.sm}; font-size: ${typography.fontSize.lg};">
          ${stars}
        </div>
      `
          : ""
      }
      
      <blockquote style="margin: 0 0 ${spacing.md} 0; font-style: italic; font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; line-height: ${typography.lineHeight.relaxed};">
        "${quote}"
      </blockquote>
      
      <div style="display: flex; align-items: center;">
        <div style="width: 40px; height: 40px; background: ${gradients.primary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: ${spacing.sm};">
          <span style="color: white; font-weight: ${typography.fontWeight.bold}; font-size: ${typography.fontSize.lg};">
            ${author.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p style="margin: 0; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[900]};">
            ${author}
          </p>
          ${
            role
              ? `
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
              ${role}
            </p>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

// Professional Footer Component - Enhanced with modern design
export function createProfessionalFooter(
  storeSettings: any,
  baseUrl: string,
  unsubscribeUrl?: string
): string {
  const year = new Date().getFullYear();
  const finalUnsubscribeUrl = unsubscribeUrl || `${baseUrl}/unsubscribe`;

  return `
    <div style="background: linear-gradient(135deg, ${colors.neutral[900]} 0%, ${colors.neutral[800]} 100%); color: white; padding: ${spacing["2xl"]} ${spacing.xl}; border-radius: 0 0 ${borderRadius.xl} ${borderRadius.xl}; margin-top: ${spacing["2xl"]}; box-shadow: ${shadows.xl}; position: relative; overflow: hidden;">
      <!-- Subtle background pattern -->
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.05; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px);"></div>
      <div style="max-width: 600px; margin: 0 auto; text-align: center; position: relative; z-index: 1;">
        <img src="${baseUrl}/TechTots_LOGO.png" alt="${storeSettings.storeName}" style="max-width: 140px; height: auto; margin-bottom: ${spacing.lg}; opacity: 0.95; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        
        <div style="margin-bottom: ${spacing.xl};">
          <h3 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.bold}; color: white; letter-spacing: -0.3px;">
            ${storeSettings.storeName}
          </h3>
          <p style="margin: 0; font-size: ${typography.fontSize.base}; color: ${colors.neutral[300]}; font-weight: ${typography.fontWeight.medium};">
            ${storeSettings.storeDescription || "Jucării STEM pentru Minți Curioase"}
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: ${spacing.lg}; margin-bottom: ${spacing.xl}; text-align: center;">
          <div style="background: rgba(255,255,255,0.05); border-radius: ${borderRadius.lg}; padding: ${spacing.lg};">
            <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: white;">
              📞 Contact
            </h4>
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[300]}; line-height: ${typography.lineHeight.relaxed};">
              Email: ${storeSettings.contactEmail}<br>
              Telefon: ${storeSettings.contactPhone}
            </p>
          </div>
        </div>
        
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: ${spacing.lg}; margin-bottom: ${spacing.lg};">
          <div style="display: flex; justify-content: center; gap: ${spacing.lg}; flex-wrap: wrap; margin-bottom: ${spacing.md};">
            <a href="${baseUrl}/privacy" style="color: ${colors.neutral[300]}; text-decoration: none; font-size: ${typography.fontSize.sm}; font-weight: ${typography.fontWeight.medium}; transition: color 0.2s;">
              Politica de Confidențialitate
            </a>
            <span style="color: ${colors.neutral[600]}; font-size: ${typography.fontSize.sm};">•</span>
            <a href="${baseUrl}/terms" style="color: ${colors.neutral[300]}; text-decoration: none; font-size: ${typography.fontSize.sm}; font-weight: ${typography.fontWeight.medium}; transition: color 0.2s;">
              Termeni și Condiții
            </a>
            <span style="color: ${colors.neutral[600]}; font-size: ${typography.fontSize.sm};">•</span>
            <a href="${finalUnsubscribeUrl}" style="color: ${colors.neutral[300]}; text-decoration: none; font-size: ${typography.fontSize.sm}; font-weight: ${typography.fontWeight.medium}; transition: color 0.2s;">
              Dezabonare
            </a>
          </div>
        </div>
        
        <p style="margin: 0; font-size: ${typography.fontSize.xs}; color: ${colors.neutral[400]}; font-weight: ${typography.fontWeight.medium};">
          © ${year} ${storeSettings.storeName}. Toate drepturile rezervate.
        </p>
      </div>
    </div>
  `;
}

// Professional Social Proof Component
export function createSocialProof(
  stats: Array<{
    number: string;
    label: string;
    icon: string;
  }>
): string {
  return `
    <div style="background: ${colors.neutral[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; text-align: center;">
      <h3 style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[900]};">
        🏆 De ce părinții ne încredințează copiii lor
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: ${spacing.lg};">
        ${stats
          .map(
            stat => `
          <div>
            <div style="font-size: ${typography.fontSize["3xl"]}; margin-bottom: ${spacing.sm};">
              ${stat.icon}
            </div>
            <div style="font-size: ${typography.fontSize["2xl"]}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]}; margin-bottom: ${spacing.xs};">
              ${stat.number}
            </div>
            <div style="font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
              ${stat.label}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

// Professional CTA Section Component - Enhanced with modern design
export function createCTASection(
  title: string,
  description: string,
  primaryButton: { text: string; url: string },
  secondaryButton?: { text: string; url: string }
): string {
  return `
    <div style="background: ${gradients.primary}; border-radius: ${borderRadius.xl}; padding: ${spacing["2xl"]} ${spacing.xl}; text-align: center; margin: ${spacing.xl} 0; box-shadow: ${shadows.xl}; position: relative; overflow: hidden;">
      <!-- Decorative background elements -->
      <div style="position: absolute; top: -30%; right: -15%; width: 180px; height: 180px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -20%; left: -10%; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
      <div style="position: relative; z-index: 1;">
        <h2 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize["2xl"]}; font-weight: ${typography.fontWeight.bold}; color: white; font-family: ${typography.fontFamily.primary}; text-shadow: 0 2px 8px rgba(0,0,0,0.2); letter-spacing: -0.3px;">
          ${title}
        </h2>
        
        <p style="margin: 0 0 ${spacing.xl} 0; font-size: ${typography.fontSize.lg}; color: rgba(255, 255, 255, 0.95); line-height: ${typography.lineHeight.relaxed}; font-weight: ${typography.fontWeight.medium}; text-shadow: 0 1px 4px rgba(0,0,0,0.15);">
          ${description}
        </p>
        
        <div style="display: flex; gap: ${spacing.md}; justify-content: center; flex-wrap: wrap; margin-top: ${spacing.lg};">
          ${createButton(primaryButton.text, primaryButton.url, "success", "lg")}
          ${secondaryButton ? createButton(secondaryButton.text, secondaryButton.url, "secondary", "lg") : ""}
        </div>
      </div>
    </div>
  `;
}

// Export all components
export default {
  createHeader,
  createHeroSection,
  createButton,
  createCard,
  createAlert,
  createProductCard,
  createOrderSummary,
  createFeatureGrid,
  createTestimonial,
  createProfessionalFooter,
  createSocialProof,
  createCTASection,
};
