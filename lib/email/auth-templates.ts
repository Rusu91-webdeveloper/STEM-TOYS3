/**
 * Authentication email templates
 * Includes welcome, verification, and password reset emails
 */

import { ro as roTranslations } from "@/lib/i18n/translations/ro";
import { prisma } from "@/lib/prisma";
import { getEmailService } from "./index";

import {
  getStoreSettings,
  getBaseUrl,
  generateEmailHeader,
  generateEmailHTML,
} from "./base";

/**
 * Professional Welcome Email with Enterprise-Grade Design
 * Multi-million dollar company appearance with advanced engagement features
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();

  // Import professional components
  const {
    createHeroSection,
    createButton,
    createFeatureGrid,
    createSocialProof,
    createCTASection,
    createTestimonial,
  } = await import("./components");

  const { generateProfessionalEmail, generatePreviewText } = await import(
    "./base"
  );

  const { colors, gradients, typography, spacing, borderRadius } = await import(
    "./design-system"
  );

  // Professional welcome content
  const content = `
    ${createHeroSection(
      `Bine ai venit la ${storeSettings.storeName}!`,
      "Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea jucăriilor STEM!",
      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)"
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${name}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Îți mulțumim că ți-ai creat un cont la ${storeSettings.storeName}. Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea jucăriilor STEM!
      </p>
    </div>

    ${createFeatureGrid([
      {
        icon: "🛒",
        title: "Cumpărări Ușoare",
        description:
          "Cumpără din colecția noastră exclusivă de jucării educaționale STEM cu doar câteva click-uri.",
        color: colors.primary[600],
      },
      {
        icon: "📦",
        title: "Urmărire Comenzi",
        description:
          "Urmărește comenzile și statusul livrărilor în timp real din contul tău personal.",
        color: colors.success[600],
      },
      {
        icon: "❤️",
        title: "Lista de Dorințe",
        description:
          "Salvează produsele preferate pentru achiziții viitoare și primește notificări despre reduceri.",
        color: colors.warning[600],
      },
      {
        icon: "🎯",
        title: "Recomandări Personalizate",
        description:
          "Primești recomandări personalizate în funcție de vârstă și interesele copilului tău.",
        color: colors.accent.purple,
      },
    ])}

    ${createSocialProof([
      {
        number: "10,000+",
        label: "Familii Mulțumite",
        icon: "👨‍👩‍👧‍👦",
      },
      {
        number: "500+",
        label: "Produse STEM",
        icon: "🧩",
      },
      {
        number: "4.9/5",
        label: "Rating Clienți",
        icon: "⭐",
      },
      {
        number: "24/7",
        label: "Suport Client",
        icon: "💬",
      },
    ])}

    ${createTestimonial(
      "Produsele de la TechTots au transformat complet modul în care copilul meu vede știința. Acum este pasionat de experimente și își dorește să devină cercetător!",
      "Maria Popescu",
      "Mama unui copil de 8 ani",
      5
    )}

    ${createCTASection(
      "Începe Aventura STEM Astăzi!",
      "Descoperă colecția noastră exclusivă de jucării educaționale și oferă copilului tău șansa să exploreze lumea științei într-un mod distractiv și interactiv.",
      {
        text: "🎯 Vezi Produsele Recomandate",
        url: `${baseUrl}/products`,
      },
      {
        text: "📚 Ghidul Părinților",
        url: `${baseUrl}/blog`,
      }
    )}

    <div style="background: ${colors.neutral[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; text-align: center;">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[900]};">
        🎁 Bonus de Bun Venit
      </h3>
      <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.neutral[600]};">
        Primești automat <strong style="color: ${colors.primary[600]};">10% reducere</strong> la prima ta comandă!
      </p>
      ${createButton("Folosește Reducerea", `${baseUrl}/products?welcome=10off`, "success", "md")}
    </div>

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Cu respect și entuziasm,
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
    `Bine ai venit la ${storeSettings.storeName}! Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea jucăriilor STEM. Primești automat 10% reducere la prima ta comandă!`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Bine ai venit",
    previewText
  );

  const emailService = getEmailService();
  return emailService.sendEmail({
    to,
    subject: `🎉 Bine ai venit la ${storeSettings.storeName} - Primești 10% Reducere!`,
    html,
  });
}

/**
 * Verification email with SEO optimized links
 */
export async function sendVerificationEmail({
  to,
  name,
  verificationLink,
  expiresIn = "24 ore",
}: {
  to: string;
  name: string;
  verificationLink: string;
  expiresIn?: string;
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
  } = await import("./components");

  // Fetch the latest 2 published blog posts
  const latestBlogs = await prisma.blog.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 2,
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  // Professional verification email content
  const content = `
    ${createHeroSection(
      "🔐 Verifică-ți Adresa de Email",
      "Finalizează înregistrarea și începe să explorezi colecția noastră de jucării educaționale STEM!",
      gradients.primary
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${name}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Îți mulțumim că ți-ai creat un cont la ${storeSettings.storeName}. Pentru a finaliza înregistrarea și a începe să explorezi colecția noastră de jucării educaționale STEM, te rugăm să îți verifici adresa de email.
      </p>
    </div>

    ${createCTASection(
      "Verifică Adresa de Email",
      "Apasă butonul de mai jos pentru a confirma adresa ta de email și a activa contul.",
      {
        text: "✅ Verifică Adresa de Email",
        url: verificationLink,
      }
    )}

    ${createAlert(
      `<strong>⚠️ Important:</strong><br>
       Acest link va expira în <strong>${expiresIn}</strong>. Dacă nu ți-ai creat un cont la ${storeSettings.storeName}, te rugăm să ignori acest email.`,
      "warning",
      "⚠️"
    )}

    <div style="background: ${colors.neutral[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.neutral[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]}; text-align: center;">
        🔗 Sau copiază și lipește acest link în browserul tău:
      </h3>
      <div style="background: white; border: 1px solid ${colors.neutral[300]}; border-radius: ${borderRadius.md}; padding: ${spacing.md}; margin-top: ${spacing.md};">
        <p style="word-break: break-all; color: ${colors.primary[600]}; margin: 0; font-family: monospace; font-size: ${typography.fontSize.sm};">
          ${verificationLink}
        </p>
      </div>
    </div>

    ${createFeatureGrid([
      {
        icon: "🛒",
        title: "Cumpărări Ușoare",
        description:
          "Cumpără din colecția noastră exclusivă de jucării educaționale STEM cu doar câteva click-uri.",
        color: colors.primary[600],
      },
      {
        icon: "📦",
        title: "Urmărire Comenzi",
        description:
          "Urmărește comenzile și statusul livrărilor în timp real din contul tău personal.",
        color: colors.success[600],
      },
      {
        icon: "❤️",
        title: "Lista de Dorințe",
        description:
          "Salvează produsele preferate pentru achiziții viitoare și primește notificări despre reduceri.",
        color: colors.warning[600],
      },
      {
        icon: "🎯",
        title: "Recomandări Personalizate",
        description:
          "Primești recomandări personalizate în funcție de vârstă și interesele copilului tău.",
        color: colors.accent.purple,
      },
    ])}

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        📚 În timp ce aștepți...
      </h3>
      <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.primary[700]}; text-align: center; line-height: ${typography.lineHeight.relaxed};">
        Consultă articolele noastre populare despre educația STEM:
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: ${spacing.md};">
        ${
          latestBlogs.length > 0
            ? latestBlogs
                .map(
                  blog => `
                <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]};">
                  <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]};">
                    ${blog.title}
                  </h4>
                  <p style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
                    de ${blog.author.name}
                  </p>
                  ${createButton(
                    "Citește Articolul",
                    `${baseUrl}/blog/${blog.slug}`,
                    "secondary",
                    "sm"
                  )}
                </div>
              `
                )
                .join("")
            : `
                <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]}; text-align: center;">
                  <p style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.base}; color: ${colors.primary[700]};">
                    Vizitează blogul nostru pentru articole educaționale
                  </p>
                  ${createButton(
                    "Vezi Blogul",
                    `${baseUrl}/blog`,
                    "primary",
                    "md"
                  )}
                </div>
              `
        }
      </div>
    </div>

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
    `Verifică adresa ta de email pentru a finaliza înregistrarea la ${storeSettings.storeName}. Link-ul expiră în ${expiresIn}.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Verifică adresa de email",
    previewText
  );

  const emailService = getEmailService();
  return emailService.sendEmail({
    to,
    subject: roTranslations.email_verification_subject,
    html,
  });
}

/**
 * Password reset email with SEO optimized links
 */
export async function sendPasswordResetEmail({
  to,
  resetLink,
  expiresIn = "1 oră",
}: {
  to: string;
  resetLink: string;
  expiresIn?: string;
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
  } = await import("./components");

  // Professional password reset email content
  const content = `
    ${createHeroSection(
      "🔑 Resetare Parolă",
      "Am primit o solicitare de resetare a parolei pentru contul tău. Suntem aici să te ajutăm să îți recuperezi accesul.",
      gradients.error
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Am primit o solicitare de resetare a parolei pentru contul tău <strong style="color: ${colors.primary[600]};">${storeSettings.storeName}</strong>.
      </p>
    </div>

    ${createCTASection(
      "Resetează Parola",
      "Apasă butonul de mai jos pentru a reseta parola și a recupera accesul la contul tău.",
      {
        text: "🔑 Resetează Parola",
        url: resetLink,
      }
    )}

    ${createAlert(
      `<strong>⚠️ Important:</strong><br>
       Acest link va expira în <strong>${expiresIn}</strong>. Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email și parola ta va rămâne neschimbată.`,
      "warning",
      "⚠️"
    )}

    <div style="background: ${colors.neutral[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.neutral[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]}; text-align: center;">
        🔗 Sau copiază și lipește acest link în browserul tău:
      </h3>
      <div style="background: white; border: 1px solid ${colors.neutral[300]}; border-radius: ${borderRadius.md}; padding: ${spacing.md}; margin-top: ${spacing.md};">
        <p style="word-break: break-all; color: ${colors.primary[600]}; margin: 0; font-family: monospace; font-size: ${typography.fontSize.sm};">
          ${resetLink}
        </p>
      </div>
    </div>

    ${createFeatureGrid([
      {
        icon: "🛡️",
        title: "Securitate Avansată",
        description:
          "Toate tranzacțiile sunt protejate cu criptare SSL de 256-bit pentru siguranța maximă.",
        color: colors.success[600],
      },
      {
        icon: "⏱️",
        title: "Link Temporar",
        description:
          "Link-ul de resetare expiră automat pentru a proteja contul tău împotriva accesului neautorizat.",
        color: colors.warning[600],
      },
      {
        icon: "📧",
        title: "Confirmare Email",
        description:
          "Primești confirmarea schimbării parolei prin email pentru verificare suplimentară.",
        color: colors.primary[600],
      },
      {
        icon: "🔒",
        title: "Protecție Continuă",
        description:
          "Monitorizăm activ contul tău pentru activitate suspectă și te notificăm imediat.",
        color: colors.accent.purple,
      },
    ])}

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        💡 Sfat de Securitate
      </h3>
      <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.primary[700]}; text-align: center; line-height: ${typography.lineHeight.relaxed};">
        Alege o parolă puternică cu cel puțin 8 caractere, combinând litere mari și mici, numere și simboluri.
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: ${spacing.md}; margin-top: ${spacing.lg};">
        <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; border: 1px solid ${colors.primary[200]}; text-align: center;">
          <div style="font-size: ${typography.fontSize.xl}; margin-bottom: ${spacing.sm};">✅</div>
          <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.sm}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]};">
            Parolă Puternică
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.xs}; color: ${colors.primary[700]};">
            Min. 8 caractere
          </p>
        </div>
        
        <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; border: 1px solid ${colors.primary[200]}; text-align: center;">
          <div style="font-size: ${typography.fontSize.xl}; margin-bottom: ${spacing.sm};">🔤</div>
          <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.sm}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]};">
            Litere Mixte
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.xs}; color: ${colors.primary[700]};">
            Mari și mici
          </p>
        </div>
        
        <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; border: 1px solid ${colors.primary[200]}; text-align: center;">
          <div style="font-size: ${typography.fontSize.xl}; margin-bottom: ${spacing.sm};">🔢</div>
          <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.sm}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]};">
            Numere
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.xs}; color: ${colors.primary[700]};">
            Cel puțin 1
          </p>
        </div>
        
        <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; border: 1px solid ${colors.primary[200]}; text-align: center;">
          <div style="font-size: ${typography.fontSize.xl}; margin-bottom: ${spacing.sm};">🔣</div>
          <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.sm}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]};">
            Simboluri
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.xs}; color: ${colors.primary[700]};">
            Cel puțin 1
          </p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Echipa de securitate,
      </p>
      <p style="font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]}; margin: 0;">
        ${storeSettings.storeName}
      </p>
      <p style="font-size: ${typography.fontSize.sm}; color: ${colors.neutral[500]}; margin-top: ${spacing.sm};">
        Protejăm datele tale cu cea mai mare atenție
      </p>
    </div>
  `;

  const previewText = generatePreviewText(
    `Am primit o solicitare de resetare a parolei pentru contul tău ${storeSettings.storeName}. Link-ul expiră în ${expiresIn}.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Resetare Parolă",
    previewText
  );

  const emailService = getEmailService();
  return emailService.sendEmail({
    to,
    subject: "🔑 Resetare parolă pentru contul tău",
    html,
  });
}
