/**
 * Professional Newsletter Email Templates
 * Enhanced with enterprise-grade design system and components
 */

import { sendMail } from "../brevo";
import { prisma } from "@/lib/prisma";

import { getStoreSettings, getBaseUrl } from "./base";

/**
 * Professional Newsletter Welcome Email
 * Enhanced with blog recommendations, feature grid, and social proof
 */
export async function sendNewsletterWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
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

  // Professional newsletter welcome content
  const content = `
    ${createHeroSection(
      "📩 Mulțumim pentru Abonare!",
      "Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea educației STEM!",
      gradients.primary
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${name}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Îți mulțumim că te-ai abonat la newsletter-ul nostru. Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea educației STEM!
      </p>
    </div>

    ${createAlert(
      `<strong>De acum înainte, vei primi:</strong><br>
       📧 Notificări despre noile articole de blog STEM<br>
       🎯 Sfaturi educaționale pentru părinți și educatori<br>
       🎁 Informații despre produsele și ofertele noastre speciale<br>
       📚 Resurse exclusive pentru învățare STEM`,
      "success",
      "🎁"
    )}

    ${createCTASection(
      "Explorează Blogul Nostru",
      "Descoperă articole educaționale valoroase despre educația STEM și dezvoltarea copiilor.",
      {
        text: "📖 Explorează Blogul Nostru",
        url: `${baseUrl}/blog`,
      },
      {
        text: "🛍️ Vezi Produsele Noastre",
        url: `${baseUrl}/products`,
      }
    )}

    ${createFeatureGrid([
      {
        icon: "📧",
        title: "Notificări Blog",
        description:
          "Primești notificări despre noile articole de blog STEM înainte de toți.",
        color: colors.primary[600],
      },
      {
        icon: "🎯",
        title: "Sfaturi Educaționale",
        description:
          "Sfaturi practice pentru părinți și educatori despre educația STEM.",
        color: colors.success[600],
      },
      {
        icon: "🎁",
        title: "Oferte Exclusive",
        description:
          "Informații despre produsele și ofertele noastre speciale cu reduceri.",
        color: colors.warning[600],
      },
      {
        icon: "📚",
        title: "Resurse Exclusive",
        description:
          "Resurse exclusive pentru învățare STEM și dezvoltarea copiilor.",
        color: colors.accent.purple,
      },
    ])}

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        📰 Articole Populare
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
                    În curând vom publica articole interesante despre educația STEM. Rămâi conectat!
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

    ${createTestimonial(
      "Newsletter-ul de la ${storeSettings.storeName} este minunat! Primești informații valoroase despre educația STEM și oferte exclusive.",
      "Maria Ionescu",
      "Mamă de 2 copii",
      5
    )}

    ${createAlert(
      `<strong>🎉 Așteptăm cu nerăbdare să împărtășim conținut valoros cu tine!</strong><br>
       Vei fi primul care află despre noile produse, articole și oferte speciale.`,
      "warning",
      "🎉"
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
    `Mulțumim pentru abonarea la newsletter-ul ${storeSettings.storeName}! Vei primi informații valoroase despre educația STEM și oferte exclusive.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Newsletter abonare",
    previewText
  );

  return sendMail({
    to,
    subject: `Mulțumim pentru abonarea la newsletter-ul ${storeSettings.storeName}!`,
    html,
    params: { email: to },
  });
}

/**
 * Professional Newsletter Resubscribe Email
 * Enhanced with welcome back messaging and engagement features
 */
export async function sendNewsletterResubscribeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
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

  // Professional newsletter resubscribe content
  const content = `
    ${createHeroSection(
      "🎉 Bine ai Revenit!",
      "Ne bucurăm că te-ai abonat din nou la newsletter-ul nostru. Suntem încântați să te avem înapoi în comunitatea noastră!",
      gradients.success
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${name}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Ne bucurăm că te-ai abonat din nou la newsletter-ul nostru. Suntem încântați să te avem înapoi în comunitatea noastră de minți curioase!
      </p>
    </div>

    ${createAlert(
      `<strong>Ai ratat multe lucruri interesante! De acum înainte vei primi:</strong><br>
       📧 Notificări despre noile articole de blog STEM<br>
       🎯 Sfaturi educaționale pentru părinți și educatori<br>
       🎁 Informații despre produsele și ofertele noastre speciale<br>
       📚 Resurse exclusive pentru învățare STEM`,
      "success",
      "🎁"
    )}

    ${createCTASection(
      "Vezi Ce Ai Ratat",
      "Explorează conținutul nou pe care l-ai ratat și descoperă produsele noastre actualizate.",
      {
        text: "📖 Vezi Blogul Actualizat",
        url: `${baseUrl}/blog`,
      },
      {
        text: "🛍️ Vezi Produsele Noi",
        url: `${baseUrl}/products`,
      }
    )}

    ${createFeatureGrid([
      {
        icon: "📈",
        title: "Conținut Actualizat",
        description:
          "Accesează articole noi și actualizări despre educația STEM.",
        color: colors.primary[600],
      },
      {
        icon: "🎁",
        title: "Oferte Speciale",
        description:
          "Primești oferte exclusive și reduceri speciale pentru abonați.",
        color: colors.warning[600],
      },
      {
        icon: "📚",
        title: "Resurse Exclusive",
        description: "Accesează resurse exclusive pentru învățare STEM.",
        color: colors.success[600],
      },
      {
        icon: "🎯",
        title: "Sfaturi Practice",
        description: "Primești sfaturi practice pentru părinți și educatori.",
        color: colors.accent.purple,
      },
    ])}

    ${createTestimonial(
      "M-am abonat din nou la newsletter-ul ${storeSettings.storeName} și sunt încântată de conținutul valoros pe care îl primesc!",
      "Ana Popescu",
      "Educatoare",
      5
    )}

    ${createAlert(
      `<strong>🎉 Suntem încântați să te avem înapoi!</strong><br>
       Vei fi primul care află despre noile produse, articole și oferte speciale.`,
      "warning",
      "🎉"
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
    `Bine ai revenit la newsletter-ul ${storeSettings.storeName}! Suntem încântați să te avem înapoi în comunitatea noastră.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Newsletter resubscribe",
    previewText
  );

  return sendMail({
    to,
    subject: `Bine ai revenit la newsletter-ul ${storeSettings.storeName}!`,
    html,
    params: { email: to },
  });
}

/**
 * Professional Newsletter Notification Email
 * Enhanced with blog post highlights and engagement features
 */
export async function sendNewsletterNotificationEmail({
  to,
  name,
  blogPost,
}: {
  to: string;
  name: string;
  blogPost: {
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
    author: { name: string };
    category: { name: string; slug: string };
  };
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

  // Professional newsletter notification content
  const content = `
    ${createHeroSection(
      "📰 Articol Nou pe Blog!",
      "Un articol nou despre educația STEM tocmai a fost publicat. Nu rata această oportunitate de învățare!",
      gradients.primary
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${name}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Un articol nou despre educația STEM tocmai a fost publicat pe blogul nostru. Nu rata această oportunitate de învățare!
      </p>
    </div>

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        📖 Articol Nou: ${blogPost.title}
      </h3>
      
      <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]}; margin: ${spacing.lg} 0;">
        ${
          blogPost.coverImage
            ? `<img src="${blogPost.coverImage}" alt="${blogPost.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: ${borderRadius.md}; margin-bottom: ${spacing.md};">`
            : ""
        }
        
        <p style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.base}; color: ${colors.neutral[700]}; line-height: ${typography.lineHeight.relaxed};">
          ${blogPost.excerpt}
        </p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: ${spacing.md};">
          <div>
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
              <strong>Autor:</strong> ${blogPost.author.name}
            </p>
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
              <strong>Categorie:</strong> ${blogPost.category.name}
            </p>
          </div>
          ${createButton(
            "Citește Articolul",
            `${baseUrl}/blog/${blogPost.slug}`,
            "primary",
            "md"
          )}
        </div>
      </div>
    </div>

    ${createCTASection(
      "Explorează Mai Multe Articole",
      "Descoperă colecția noastră completă de articole educaționale despre STEM.",
      {
        text: "📖 Vezi Toate Articolele",
        url: `${baseUrl}/blog`,
      },
      {
        text: "🛍️ Vezi Produsele Noastre",
        url: `${baseUrl}/products`,
      }
    )}

    ${createFeatureGrid([
      {
        icon: "📚",
        title: "Resurse Educaționale",
        description: "Accesează resurse valoroase pentru învățarea STEM.",
        color: colors.primary[600],
      },
      {
        icon: "🎯",
        title: "Sfaturi Practice",
        description: "Primești sfaturi practice pentru părinți și educatori.",
        color: colors.success[600],
      },
      {
        icon: "🎁",
        title: "Oferte Exclusive",
        description:
          "Informații despre produsele și ofertele noastre speciale.",
        color: colors.warning[600],
      },
      {
        icon: "📧",
        title: "Notificări Timpuri",
        description: "Primești notificări despre conținut nou înainte de toți.",
        color: colors.accent.purple,
      },
    ])}

    ${createTestimonial(
      "Articolele de pe blogul ${storeSettings.storeName} sunt minunate! Îmi oferă sfaturi practice pentru educația STEM a copiilor mei.",
      "Cristina Dumitrescu",
      "Mamă de 3 copii",
      5
    )}

    ${createAlert(
      `<strong>💡 Sfat:</strong> Salvează acest email pentru a citi articolul mai târziu, sau împărtășește-l cu alți părinți care ar putea fi interesați!`,
      "info",
      "💡"
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
    `Articol nou: ${blogPost.title} - ${blogPost.excerpt.substring(0, 100)}... Citește acum pe blogul ${storeSettings.storeName}!`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Articol nou pe blog",
    previewText
  );

  return sendMail({
    to,
    subject: `Articol nou: ${blogPost.title} - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}
