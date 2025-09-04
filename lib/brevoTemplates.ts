/**
 * Email templates for Brevo integration
 * These templates are optimized for SEO and include:
 * - Product links that drive traffic back to the site
 * - Rich schema markup for better email client rendering
 * - GDPR-compliant unsubscribe links
 * - Mobile-responsive design
 * - Professional Romanian company branding
 */

import { StoreSettings, Product, Blog } from "@prisma/client";

import { ro as roTranslations } from "@/lib/i18n/translations/ro";
import { prisma } from "@/lib/prisma";

import { sendMail } from "./brevo";

// Type for SEO metadata
type SEOMetadata = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
};

// Type for blog with included relations
interface BlogWithAuthorAndCategory {
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

// Base URL for links
const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Get store settings singleton with cached result
let cachedStoreSettings: StoreSettings | null = null;
async function getStoreSettings(): Promise<StoreSettings> {
  if (cachedStoreSettings) return cachedStoreSettings;

  const settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    // Provide default store settings if none exist in database
    console.warn("⚠️ No store settings found in database, using defaults");
    const defaultSettings: StoreSettings = {
      id: "default",
      storeName: "TechTots STEM Store",
      storeUrl: "https://stem-toys-3.vercel.app",
      storeDescription: "Jucării STEM pentru Minți Curioase",
      contactEmail: "webira.rem.srl@gmail.com",
      contactPhone: "+40 771 248 029",
      currency: "RON",
      timezone: "Europe/Bucharest",
      dateFormat: "dd-mm-yyyy",
      weightUnit: "kg",
      metaTitle: "TechTots | Jucării STEM pentru Minți Curioase",
      metaDescription:
        "Descoperă cele mai bune jucării STEM pentru minți curioase la TechTots. Jucării educaționale care fac învățarea distractivă pentru copii de toate vârstele.",
      metaKeywords:
        "jucării STEM, jucării educaționale, jucării știință, jucării tehnologie, jucării inginerie, jucării matematică",
      shippingSettings: {},
      paymentSettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      taxSettings: {},
    };

    cachedStoreSettings = defaultSettings;
    return defaultSettings;
  }

  cachedStoreSettings = settings;
  return settings;
}

/**
 * Format a price as currency (Romanian Lei)
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Generate professional email header with logo
 */
function generateEmailHeader(storeSettings: StoreSettings): string {
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
function generateEmailFooter(storeSettings: StoreSettings): string {
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
function generateEmailContainer(content: string): string {
  return `
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <div style="padding: 40px 30px;">
        ${content}
      </div>
    </div>
  `;
}

// Email templates with Brevo integration
export const emailTemplates = {
  /**
   * Digital book delivery email with download links
   */
  digitalBookDelivery: async ({
    to,
    customerName,
    orderId,
    books,
    downloadLinks,
  }: {
    to: string;
    customerName: string;
    orderId: string;
    books: Array<{
      name: string;
      author: string;
      price: number;
      coverImage?: string;
    }>;
    downloadLinks: Array<{
      bookName: string;
      format: string;
      language: string;
      downloadUrl: string;
      expiresAt: Date;
    }>;
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    // Group download links by book
    const bookDownloads = downloadLinks.reduce(
      (acc, link) => {
        const key = link.bookName;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(link);
        return acc;
      },
      {} as Record<string, typeof downloadLinks>
    );

    // Calculate total value
    const totalValue = books.reduce((sum, book) => sum + book.price, 0);

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">📚 Cărțile tale digitale sunt gata!</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${customerName}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Îți mulțumim pentru comanda <strong>#${orderId}</strong>! Cărțile tale digitale sunt acum disponibile pentru descărcare. Toate fișierele sunt în format <strong>EPUB</strong> și <strong>KBP</strong>, perfecte pentru orice dispozitiv de citire.</p>
      
      <div style="background-color: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #047857; margin: 0 0 16px 0; text-align: center;">📖 Cărțile tale achiziționate (${formatPrice(totalValue)})</h3>
        
        ${books
          .map((book, index) => {
            const bookLinks = bookDownloads[book.name] || [];
            return `
            <div style="border: 1px solid #d1fae5; border-radius: 8px; padding: 16px; margin-bottom: ${index < books.length - 1 ? "16px" : "0"}; background-color: #ffffff;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                ${book.coverImage ? `<img src="${book.coverImage}" alt="${book.name}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 16px;">` : ""}
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #1f2937; font-size: 18px;">${book.name}</h4>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">de ${book.author}</p>
                  <p style="margin: 0; color: #047857; font-weight: 600;">${formatPrice(book.price)}</p>
                </div>
              </div>
              
              <div style="background-color: #f8fafc; border-radius: 6px; padding: 12px;">
                <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600; font-size: 14px;">📥 Link-uri de descărcare:</p>
                ${bookLinks
                  .map(
                    link => `
                  <div style="margin-bottom: 8px;">
                    <a href="${link.downloadUrl}" 
                       style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; margin-right: 8px;">
                      📄 ${link.format.toUpperCase()} - ${link.language === "en" ? "English" : "Română"}
                    </a>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #92400e; margin: 0 0 12px 0;">⚠️ Informații importante despre descărcarea fișierelor:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #92400e;">
          <li style="margin-bottom: 8px;"><strong>Link-urile vor expira în 30 de zile</strong> de la data acestui email</li>
          <li style="margin-bottom: 8px;">Poți descărca fiecare fișier de <strong>maksimum 5 ori</strong></li>
          <li style="margin-bottom: 8px;">Fișierele sunt compatibile cu majoritatea dispozitivelor și aplicațiilor de citire</li>
          <li style="margin-bottom: 8px;">Păstrează o copie de rezervă a fișierelor după descărcare</li>
        </ul>
      </div>
      
      <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1e40af; margin: 0 0 12px 0;">💡 Cum să citești cărțile tale digitale:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
          <li style="margin-bottom: 8px;"><strong>EPUB:</strong> Perfect pentru telefoane, tablete și e-readere (Kindle, Kobo, etc.)</li>
          <li style="margin-bottom: 8px;"><strong>KBP:</strong> Format optimizat pentru o experiență de citire superioară</li>
          <li style="margin-bottom: 8px;">Poți folosi aplicații gratuite ca Adobe Digital Editions, Apple Books sau Google Play Books</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/account/orders" 
           style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
          📋 Vezi Istoric Comenzi
        </a>
      </div>
      
      <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
        <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: 600;">🔍 Ai nevoie de ajutor?</p>
        <p style="margin: 0; color: #1e40af;">
          Echipa noastră de suport este aici pentru tine! 
          <a href="${baseUrl}/contact" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Contactează-ne</a> 
          dacă întâmpini probleme cu descărcarea.
        </p>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Îți mulțumim că ai ales ${storeSettings.storeName}!<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cărțile tale digitale sunt gata! - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `📚 Cărțile tale digitale sunt gata pentru descărcare! - Comanda #${orderId}`,
      html,
      params: { email: to },
    });
  },

  /**
   * Welcome email with SEO optimized links and content
   */
  welcome: async ({ to, name }: { to: string; name: string }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">Bine ai venit la ${storeSettings.storeName}!</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${name}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Îți mulțumim că ți-ai creat un cont la ${storeSettings.storeName}. Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea jucăriilor STEM!</p>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="color: #1e40af; margin: 0 0 12px 0;">Cu noul tău cont poți:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
          <li style="margin-bottom: 8px;">Cumpără din colecția noastră exclusivă de jucării educaționale STEM</li>
          <li style="margin-bottom: 8px;">Urmărește comenzile și statusul livrărilor</li>
          <li style="margin-bottom: 8px;">Salvează produsele preferate pentru achiziții viitoare</li>
          <li style="margin-bottom: 8px;">Primești recomandări personalizate în funcție de vârstă și interese</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/products/featured" 
           style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
          🎯 Descoperă Jucăriile STEM Recomandate
        </a>
      </div>
      
      <h2 style="color: #1f2937; margin: 40px 0 20px 0; text-align: center; font-size: 22px;">🔬 Categorii Populare</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 32px; text-align: center;">
        <div style="flex: 1; margin: 0 8px;">
          <a href="${baseUrl}/categories" style="text-decoration: none; color: #1f2937; display: block; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 2px solid #e5e7eb; transition: all 0.3s;">
            <div style="font-size: 24px; margin-bottom: 8px;">🧪</div>
            <p style="font-weight: 600; margin: 0; color: #3b82f6;">Știință</p>
          </a>
        </div>
        <div style="flex: 1; margin: 0 8px;">
          <a href="${baseUrl}/categories" style="text-decoration: none; color: #1f2937; display: block; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 2px solid #e5e7eb; transition: all 0.3s;">
            <div style="font-size: 24px; margin-bottom: 8px;">💻</div>
            <p style="font-weight: 600; margin: 0; color: #3b82f6;">Tehnologie</p>
          </a>
        </div>
        <div style="flex: 1; margin: 0 8px;">
          <a href="${baseUrl}/categories" style="text-decoration: none; color: #1f2937; display: block; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 2px solid #e5e7eb; transition: all 0.3s;">
            <div style="font-size: 24px; margin-bottom: 8px;">🔧</div>
            <p style="font-weight: 600; margin: 0; color: #3b82f6;">Inginerie</p>
          </a>
        </div>
      </div>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
        <p style="margin: 0; color: #15803d; font-weight: 600;">🚀 Îți dorim mult succes în aventura învățării STEM!</p>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bine ai venit la ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: roTranslations.email_welcome_subject,
      html,
      params: { email: to },
    });
  },

  /**
   * Verification email with SEO optimized links
   */
  verification: async ({
    to,
    name,
    verificationLink,
    expiresIn = "24 ore",
  }: {
    to: string;
    name: string;
    verificationLink: string;
    expiresIn?: string;
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

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

    // Generate blog section HTML based on available blogs
    let blogSectionHtml = "";
    if (latestBlogs.length > 0) {
      blogSectionHtml = `
        <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px;">
          <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: 600;">Consultă articolele noastre populare despre educația STEM:</p>
          <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
            ${latestBlogs
              .map(
                blog =>
                  `<li style="margin-bottom: 8px;"><a href="${baseUrl}/blog/${blog.slug}" style="color: #3b82f6; text-decoration: none;">${blog.title}</a></li>`
              )
              .join("")}
          </ul>
        </div>
      `;
    } else {
      blogSectionHtml = `
        <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px;">
          <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: 600;">Consultă articolele noastre despre educația STEM:</p>
          <p style="margin: 0; color: #1f2937;">
            <a href="${baseUrl}/blog" style="color: #3b82f6; text-decoration: none;">Vizitează blogul nostru pentru articole educaționale</a>
          </p>
        </div>
      `;
    }

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">🔐 Verifică-ți Adresa de Email</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${name}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Îți mulțumim că ți-ai creat un cont la ${storeSettings.storeName}. Pentru a finaliza înregistrarea și a începe să explorezi colecția noastră de jucării educaționale STEM, te rugăm să îți verifici adresa de email.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationLink}" 
           style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
          ✅ Verifică Adresa de Email
        </a>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">⚠️ Important:</p>
        <p style="margin: 0; color: #92400e;">Acest link va expira în <strong>${expiresIn}</strong>. Dacă nu ți-ai creat un cont la ${storeSettings.storeName}, te rugăm să ignori acest email.</p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Sau copiază și lipește acest link în browserul tău:</p>
        <p style="word-break: break-all; color: #3b82f6; margin: 0; font-family: monospace; font-size: 13px; background-color: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">${verificationLink}</p>
      </div>
      
      <h2 style="color: #1f2937; margin: 40px 0 20px 0; text-align: center; font-size: 20px;">📚 În timp ce aștepți...</h2>
      ${blogSectionHtml}
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifică adresa de email - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: roTranslations.email_verification_subject,
      html,
      params: { email: to },
    });
  },

  /**
   * Password reset email with SEO optimized links
   */
  passwordReset: async ({
    to,
    resetLink,
    expiresIn = "1 oră",
  }: {
    to: string;
    resetLink: string;
    expiresIn?: string;
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">🔑 Resetare Parolă</h1>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Am primit o solicitare de resetare a parolei pentru contul tău ${storeSettings.storeName}.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" 
           style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
          🔐 Resetează Parola
        </a>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">⚠️ Important:</p>
        <p style="margin: 0; color: #92400e;">Acest link va expira în <strong>${expiresIn}</strong>. Dacă nu ai solicitat resetarea parolei, poți ignora acest email.</p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Sau copiază și lipește acest link în browserul tău:</p>
        <p style="word-break: break-all; color: #3b82f6; margin: 0; font-family: monospace; font-size: 13px; background-color: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">${resetLink}</p>
      </div>
      
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 32px 0;">
        <h3 style="color: #0369a1; margin: 0 0 12px 0; font-size: 16px;">🛡️ Sfaturi pentru securitatea contului:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
          <li style="margin-bottom: 8px;">Folosește o parolă unică și puternică, pe care nu o folosești în altă parte</li>
          <li style="margin-bottom: 8px;">Nu-ți împărtăși niciodată parola cu alții</li>
          <li style="margin-bottom: 8px;">Fii prudent cu emailurile suspecte care îți cer informațiile de autentificare</li>
        </ul>
        <p style="margin: 16px 0 0 0;">
          <a href="${baseUrl}/contact" style="color: #0369a1; text-decoration: none; font-weight: 600;">📞 Contactează-ne dacă ai întrebări despre securitate</a>
        </p>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resetare Parolă - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: roTranslations.email_password_reset_subject,
      html,
      params: { email: to },
    });
  },

  /**
   * Newsletter welcome email in Romanian
   */
  newsletterWelcome: async ({ to, name }: { to: string; name: string }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    // Fetch the latest 2 published blog posts
    const latestBlogs = (await prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 2,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    })) as any[];

    // Generate blog section HTML based on available blogs
    let blogSectionHtml = "";
    if (latestBlogs.length > 0) {
      blogSectionHtml = `
        <h2 style="color: #1f2937; margin: 40px 0 20px 0; text-align: center; font-size: 20px;">📰 Articole Populare</h2>
        <div style="display: flex; justify-content: space-between; margin-bottom: 32px; text-align: center;">
      `;

      latestBlogs.forEach(blog => {
        const blogUrl = `${baseUrl}/blog/${blog.slug}`;
        const coverImage =
          blog.coverImage || `${baseUrl}/images/blog/default-cover.jpg`;

        blogSectionHtml += `
          <div style="flex: 1; margin: 0 8px; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <a href="${blogUrl}" style="text-decoration: none; color: #1f2937;">
              <img src="${coverImage}" alt="${blog.title}" style="width: 100%; height: 120px; object-fit: cover;">
              <div style="padding: 12px;">
                <p style="font-weight: 600; margin: 0; font-size: 14px; color: #3b82f6;">${blog.title}</p>
              </div>
            </a>
          </div>
        `;
      });

      blogSectionHtml += `</div>`;
    } else {
      blogSectionHtml = `
        <h2 style="color: #1f2937; margin: 40px 0 20px 0; text-align: center; font-size: 20px;">📰 Articole Populare</h2>
        <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
          <p style="margin: 0; color: #1e40af;">În curând vom publica articole interesante despre educația STEM. Rămâi conectat!</p>
        </div>
      `;
    }

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">📩 Mulțumim pentru Abonare!</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${name}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Îți mulțumim că te-ai abonat la newsletter-ul nostru. Suntem încântați să te avem în comunitatea noastră!</p>
      
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="color: #047857; margin: 0 0 12px 0;">De acum înainte, vei primi:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
          <li style="margin-bottom: 8px;">📧 Notificări despre noile articole de blog STEM</li>
          <li style="margin-bottom: 8px;">🎯 Sfaturi educaționale pentru părinți și educatori</li>
          <li style="margin-bottom: 8px;">🎁 Informații despre produsele și ofertele noastre speciale</li>
          <li style="margin-bottom: 8px;">📚 Resurse exclusive pentru învățare STEM</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/blog" 
           style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
          📖 Explorează Blogul Nostru
        </a>
      </div>
      
      ${blogSectionHtml}
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">🎉 Așteptăm cu nerăbdare să împărtășim conținut valoros cu tine!</p>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mulțumim pentru abonare - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: "Mulțumim pentru abonarea la newsletter-ul TechTots!",
      html,
      params: { email: to },
    });
  },

  /**
   * Newsletter resubscribe email in Romanian
   */
  newsletterResubscribe: async ({ to, name }: { to: string; name: string }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">🎉 Bine ai Revenit!</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${name}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Ne bucurăm că te-ai abonat din nou la newsletter-ul nostru. Suntem încântați să te avem înapoi în comunitatea noastră!</p>
      
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="color: #047857; margin: 0 0 12px 0;">De acum înainte, vei primi din nou:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
          <li style="margin-bottom: 8px;">📧 Notificări despre noile articole de blog STEM</li>
          <li style="margin-bottom: 8px;">🎯 Sfaturi educaționale pentru părinți și educatori</li>
          <li style="margin-bottom: 8px;">🎁 Informații despre produsele și ofertele noastre speciale</li>
          <li style="margin-bottom: 8px;">📚 Resurse exclusive pentru învățare STEM</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/blog" 
           style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
          📖 Explorează Blogul Nostru
        </a>
      </div>
      
      <h2 style="color: #1f2937; margin: 40px 0 20px 0; text-align: center; font-size: 20px;">📰 Ce ai Ratat</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 32px; text-align: center;">
        <div style="flex: 1; margin: 0 8px; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb;">
          <a href="${baseUrl}/blog" style="text-decoration: none; color: #1f2937;">
            <div style="padding: 24px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🔬</div>
              <p style="font-weight: 600; margin: 0;">Tendințe STEM</p>
            </div>
          </a>
        </div>
        <div style="flex: 1; margin: 0 8px; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb;">
          <a href="${baseUrl}/blog" style="text-decoration: none; color: #1f2937;">
            <div style="padding: 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">👶</div>
              <p style="font-weight: 600; margin: 0;">STEM Preșcolari</p>
            </div>
          </a>
        </div>
      </div>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
        <p style="margin: 0; color: #15803d; font-weight: 600;">🤗 Suntem bucuroși că ești din nou alături de noi!</p>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bine ai revenit - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: "Bine ai revenit la newsletter-ul TechTots!",
      html,
      params: { email: to },
    });
  },

  /**
   * Blog notification email with beautiful professional Romanian styling
   */
  blogNotification: async ({
    to,
    name,
    blog,
  }: {
    to: string;
    name: string;
    blog: BlogWithAuthorAndCategory;
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    // Format the blog publication date
    const publishDate = blog.publishedAt
      ? new Date(blog.publishedAt).toLocaleDateString("ro-RO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date(blog.createdAt).toLocaleDateString("ro-RO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

    // Create an excerpt if needed
    const excerpt = blog.excerpt || `${blog.content.substring(0, 180)}...`;
    const blogUrl = `${baseUrl}/blog/${blog.slug}`;
    const coverImage =
      blog.coverImage || `${baseUrl}/images/blog/default-cover.jpg`;

    // Get related blog posts from the same category
    const relatedBlogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
        category: blog.category ? { slug: blog.category.slug } : undefined,
        id: { not: blog.id },
      },
      take: 2,
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    });

    let relatedBlogsHtml = "";
    if (relatedBlogs.length > 0) {
      relatedBlogsHtml = `
        <div style="margin-top: 48px;">
          <h2 style="color: #1f2937; text-align: center; margin-bottom: 24px; font-size: 20px; font-weight: 700;">📚 Alte Articole care Te-ar Putea Interesa</h2>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            ${relatedBlogs
              .map(relatedBlog => {
                const relatedBlogUrl = `${baseUrl}/blog/${relatedBlog.slug}`;
                const relatedCoverImage =
                  relatedBlog.coverImage ||
                  `${baseUrl}/images/blog/default-cover.jpg`;

                return `
                <div style="flex: 1; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
                  <a href="${relatedBlogUrl}" style="text-decoration: none; color: inherit;">
                    <img src="${relatedCoverImage}" alt="${relatedBlog.title}" style="width: 100%; height: 100px; object-fit: cover;">
                    <div style="padding: 16px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.4;">${relatedBlog.title}</h3>
                      <p style="margin: 0; font-size: 12px; color: #6b7280;">📝 ${relatedBlog.category.name}</p>
                    </div>
                  </a>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      `;
    }

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <!-- Hero Section with Beautiful Blue Gradient -->
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1d4ed8 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px; box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);">
        <div style="font-size: 48px; margin-bottom: 16px;">📰</div>
        <h1 style="color: white; margin: 0 0 12px 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Articol Nou Publicat!</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 500;">Un nou articol STEM îți așteaptă atenția</p>
      </div>
      
      <p style="font-size: 16px; margin-bottom: 16px; color: #374151;">Salut <strong style="color: #1f2937;">${name}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #374151; line-height: 1.6;">Suntem încântați să îți prezentăm cel mai recent articol de pe blogul nostru. Am pregătit pentru tine conținut educațional captivant:</p>
      
      <!-- Main Blog Card with Enhanced Styling -->
      <div style="background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: 3px solid transparent; background-clip: padding-box; border-radius: 16px; overflow: hidden; margin: 32px 0; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12); position: relative;">
        <!-- Blog Image with Overlay -->
        <div style="position: relative; overflow: hidden;">
          <img src="${coverImage}" alt="${blog.title}" style="width: 100%; height: 240px; object-fit: cover; transition: transform 0.3s ease;">
          <div style="position: absolute; top: 16px; right: 16px; background: rgba(59, 130, 246, 0.9); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; backdrop-filter: blur(10px);">
            ${blog.category.name}
          </div>
        </div>
        
        <div style="padding: 28px;">
          <!-- Blog Title -->
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; line-height: 1.3;">${blog.title}</h2>
          
          <!-- Author and Date Info -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: white; font-weight: 600; font-size: 14px;">
                ${blog.author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px;">${blog.author.name}</p>
                <p style="margin: 0; color: #6b7280; font-size: 12px;">Autor</p>
              </div>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px;">📅 ${publishDate}</p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">Data publicării</p>
            </div>
          </div>
          
          <!-- Blog Excerpt -->
          <p style="margin: 0 0 24px 0; color: #4b5563; line-height: 1.7; font-size: 16px; text-align: justify;">${excerpt}</p>
          
          <!-- Beautiful CTA Button -->
          <div style="text-align: center;">
            <a href="${blogUrl}" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4); transition: all 0.3s ease; border: none; position: relative; overflow: hidden;">
              <span style="position: relative; z-index: 2;">📖 Citește Articolul Complet</span>
            </a>
          </div>
        </div>
      </div>
      
      <!-- Engagement Section -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 12px;">✨</div>
        <h3 style="margin: 0 0 8px 0; color: #059669; font-size: 18px; font-weight: 700;">Îți place conținutul nostru?</h3>
        <p style="margin: 0 0 16px 0; color: #047857; font-size: 14px;">Împărtășește-l cu prietenii tăi și ajută-ne să răspândim educația STEM!</p>
        <div style="display: flex; justify-content: center; gap: 12px;">
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}" 
             style="background: #1877f2; color: white; padding: 8px 16px; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: 600;">
            📘 Facebook
          </a>
          <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(blogUrl)}&text=${encodeURIComponent(blog.title)}" 
             style="background: #1da1f2; color: white; padding: 8px 16px; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: 600;">
            🐦 Twitter
          </a>
        </div>
      </div>
      
      <!-- Newsletter Value Proposition -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border: 2px solid #fbbf24; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: 700;">De ce îți place newsletter-ul nostru?</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px;">
          <div style="background: rgba(255, 255, 255, 0.8); padding: 16px; border-radius: 8px;">
            <div style="font-size: 24px; margin-bottom: 8px;">🔬</div>
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">Conținut STEM de Calitate</p>
          </div>
          <div style="background: rgba(255, 255, 255, 0.8); padding: 16px; border-radius: 8px;">
            <div style="font-size: 24px; margin-bottom: 8px;">👨‍👩‍👧‍👦</div>
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">Perfect pentru Familii</p>
          </div>
          <div style="background: rgba(255, 255, 255, 0.8); padding: 16px; border-radius: 8px;">
            <div style="font-size: 24px; margin-bottom: 8px;">📚</div>
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">Resurse Educaționale</p>
          </div>
          <div style="background: rgba(255, 255, 255, 0.8); padding: 16px; border-radius: 8px;">
            <div style="font-size: 24px; margin-bottom: 8px;">🎁</div>
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">Oferte Exclusive</p>
          </div>
        </div>
      </div>
      
      ${relatedBlogsHtml}
      
      <!-- Quick Actions Section -->
      <div style="margin: 40px 0; text-align: center;">
        <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 18px; font-weight: 700;">🚀 Explorează Mai Mult</h3>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <a href="${baseUrl}/blog" 
             style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
            📰 Toate Articolele
          </a>
          <a href="${baseUrl}/products" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            🧸 Produse STEM
          </a>
          <a href="${baseUrl}/contact" 
             style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
            💬 Contactează-ne
          </a>
        </div>
      </div>
      
      <!-- Subscription Management -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; border: 1px solid #e5e7eb;">
        <div style="font-size: 24px; margin-bottom: 12px;">📧</div>
        <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Gestionează Abonamentul</h4>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">
          Primești acest email pentru că ești abonat la newsletter-ul nostru STEM.
        </p>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          Poți să îți 
          <a href="${baseUrl}/account" style="color: #3b82f6; text-decoration: none; font-weight: 600;">gestionezi preferințele</a>
          sau să te 
          <a href="${baseUrl}/unsubscribe?email={{params.email}}" style="color: #ef4444; text-decoration: none; font-weight: 600;">dezabonezi aici</a>.
        </p>
      </div>
      
      <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Cu respect și pasiune pentru educația STEM,<br><strong style="color: #1f2937;">Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>📰 Articol nou: ${blog.title} - ${storeSettings.storeName}</title>
        <meta name="description" content="${excerpt}">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `📰 Articol nou: ${blog.title} - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  /**
   * Order confirmation email with professional Romanian styling
   */
  orderConfirmation: async ({
    to,
    order,
    user,
  }: {
    to: string;
    order: any; // Full order with items and products
    user: { name: string };
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const itemsHtml = order.items
      .map((item: any) => {
        const productLink = `${baseUrl}/products/${item.product.slug}`;

        // Safely handle product images with proper type checking
        let imageUrl = `${baseUrl}/images/placeholder.png`;
        const productImages = item.product.images as string[] | null;
        if (
          productImages &&
          Array.isArray(productImages) &&
          productImages.length > 0
        ) {
          // Type guard to ensure we have string array
          const images = productImages.filter(
            (img): img is string => typeof img === "string"
          );
          if (images.length > 0) {
            imageUrl = images[0];
          }
        }

        return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center;">
              <a href="${productLink}" style="text-decoration: none; color: inherit;">
                <img src="${imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 12px; border-radius: 4px;">
              </a>
              <div>
                <a href="${productLink}" style="text-decoration: none; color: #1f2937; font-weight: 600; font-size: 16px;">
                  ${item.name}
                </a>
                ${
                  item.product.description
                    ? `<p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">${item.product.description.substring(0, 100)}${item.product.description.length > 100 ? "..." : ""}</p>`
                    : ""
                }
              </div>
            </div>
          </td>
          <td style="padding: 16px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${item.quantity}</td>
          <td style="padding: 16px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600;">
            ${formatPrice(item.price)}<br>
            <span style="font-size: 11px; color: #6b7280;">(inclusiv TVA)</span>
          </td>
          <td style="padding: 16px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #3b82f6;">
            ${formatPrice(item.price * item.quantity)}<br>
            <span style="font-size: 11px; color: #6b7280;">(inclusiv TVA)</span>
          </td>
        </tr>
      `;
      })
      .join("");

    // Find similar products based on categories
    const categoryIds = [
      ...new Set(order.items.map((item: any) => item.product.categoryId)),
    ];
    let relatedProductsHtml = "";

    if (categoryIds.length > 0) {
      const relatedProducts = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          id: { notIn: order.items.map((item: any) => item.productId) },
          isActive: true,
        },
        take: 3,
      });

      if (relatedProducts.length > 0) {
        relatedProductsHtml = `
          <div style="margin-top: 48px;">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 24px; font-size: 20px;">🎯 Ți-ar Putea Plăcea și</h2>
            <div style="display: flex; justify-content: space-between;">
              ${relatedProducts
                .map(product => {
                  // Safely get the first image URL or use placeholder
                  let imageUrl = `${baseUrl}/images/placeholder.png`;
                  const productImages = product.images as string[] | null;
                  if (
                    productImages &&
                    Array.isArray(productImages) &&
                    productImages.length > 0
                  ) {
                    // Type guard to ensure we have string array
                    const images = productImages.filter(
                      (img): img is string => typeof img === "string"
                    );
                    if (images.length > 0) {
                      imageUrl = images[0];
                    }
                  }

                  return `
                  <div style="flex: 1; margin: 0 8px; text-align: center; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <a href="${baseUrl}/products/${product.slug}" style="text-decoration: none; color: inherit;">
                      <img src="${imageUrl}" 
                           alt="${product.name}" 
                           style="width: 100%; height: 120px; object-fit: cover;">
                      <div style="padding: 12px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${product.name}</h3>
                        <p style="color: #3b82f6; font-weight: 700; margin: 0; font-size: 16px;">${formatPrice(product.price)}</p>
                        <p style="color: #6b7280; font-size: 11px; margin: 2px 0 0 0;">(inclusiv TVA)</p>
                      </div>
                    </a>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>
        `;
      }
    }

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 16px; text-align: center; font-size: 28px; font-weight: 700;">🎉 Confirmare Comandă</h1>
      <p style="text-align: center; font-size: 18px; color: #10b981; margin-bottom: 32px; font-weight: 600;">Îți mulțumim pentru comandă!</p>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; margin-bottom: 20px;">Suntem încântați să confirmăm că am primit comanda ta și este în curs de procesare. Iată detaliile comenzii tale:</p>
      
      <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1f2937;">Comandă #${order.orderNumber}</p>
            <p style="margin: 4px 0 0; color: #6b7280;">📅 ${new Date(order.createdAt).toLocaleDateString("ro-RO")}</p>
          </div>
          <div style="text-align: right;">
            <span style="background-color: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${order.status}</span>
          </div>
        </div>
        <p style="margin: 0; color: #1e40af;"><strong>Status Plată:</strong> ${order.paymentStatus}</p>
      </div>
      
      <h2 style="color: #1f2937; margin: 32px 0 16px 0; font-size: 20px;">🛍️ Sumar Comandă</h2>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 16px; border-bottom: 2px solid #e5e7eb; font-weight: 700;">Produs</th>
            <th style="text-align: center; padding: 16px; border-bottom: 2px solid #e5e7eb; font-weight: 700;">Cant.</th>
            <th style="text-align: right; padding: 16px; border-bottom: 2px solid #e5e7eb; font-weight: 700;">Preț</th>
            <th style="text-align: right; padding: 16px; border-bottom: 2px solid #e5e7eb; font-weight: 700;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot style="background-color: #f8fafc;">
          <tr>
            <td colspan="3" style="text-align: right; padding: 12px 16px; font-weight: 600;">Subtotal (inclusiv TVA):</td>
            <td style="text-align: right; padding: 12px 16px; font-weight: 600;">${formatPrice(order.subtotal + order.tax)}</td>
          </tr>
          ${
            order.discountAmount && order.discountAmount > 0
              ? `
          <tr style="color: #10b981;">
            <td colspan="3" style="text-align: right; padding: 12px 16px; font-weight: 600;">
              Reducere ${order.couponCode ? `(${order.couponCode})` : ""}:
            </td>
            <td style="text-align: right; padding: 12px 16px; font-weight: 700;">-${formatPrice(order.discountAmount)}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td colspan="3" style="text-align: right; padding: 12px 16px; font-weight: 600;">Transport:</td>
            <td style="text-align: right; padding: 12px 16px; font-weight: 600;">${formatPrice(order.shippingCost)}</td>
          </tr>
          <!-- TVA line removed - prices already include VAT for EU compliance -->
          <tr style="font-weight: 700; font-size: 18px; background-color: #dbeafe;">
            <td colspan="3" style="text-align: right; padding: 16px; border-top: 2px solid #3b82f6;">TOTAL:</td>
            <td style="text-align: right; padding: 16px; border-top: 2px solid #3b82f6; color: #3b82f6;">${formatPrice(order.total)}</td>
          </tr>
          ${
            order.discountAmount && order.discountAmount > 0
              ? `
          <tr>
            <td colspan="4" style="text-align: center; padding: 8px; background-color: #ecfdf5; color: #059669; font-size: 14px; font-weight: 600;">
              🎉 Ai economisit ${formatPrice(order.discountAmount)} cu acest cupon!
            </td>
          </tr>
          `
              : ""
          }
        </tfoot>
      </table>
      
      <div style="margin: 32px 0; text-align: center;">
        <a href="${baseUrl}/account/orders/${order.id}" 
           style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
          📋 Vezi Detalii Comandă
        </a>
      </div>
      
      <div style="margin-top: 32px; border-top: 2px solid #e5e7eb; padding-top: 24px;">
        <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 18px;">🚚 Informații Livrare</h2>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${order.shippingAddress.fullName}</p>
          <p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.addressLine1}</p>
          ${order.shippingAddress.addressLine2 ? `<p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.addressLine2}</p>` : ""}
          <p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          <p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.country}</p>
          <p style="margin: 0; color: #4b5563;"><strong>📞 Telefon:</strong> ${order.shippingAddress.phone}</p>
        </div>
      </div>
      
      <div style="margin-top: 32px; background-color: #ecfdf5; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px;">
        <h3 style="color: #059669; margin: 0 0 12px 0; font-size: 16px;">✅ Ce Urmează?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #047857;">
          <li style="margin-bottom: 8px;">Vei primi o confirmare de expediere când comanda ta este pe drum</li>
          <li style="margin-bottom: 8px;">Poți urmări statusul comenzii tale oricând din <a href="${baseUrl}/account/orders" style="color: #059669; text-decoration: none; font-weight: 600;">panoul de control al contului tău</a></li>
          <li style="margin-bottom: 8px;">Dacă ai întrebări despre comanda ta, te rugăm să <a href="${baseUrl}/contact" style="color: #059669; text-decoration: none; font-weight: 600;">contactezi echipa noastră de asistență</a></li>
        </ul>
      </div>
      
      ${relatedProductsHtml}
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmare Comandă #${order.orderNumber} - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `Confirmare Comandă #${order.orderNumber} - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  /**
   * Return processing email with professional Romanian styling
   */
  returnProcessing: async ({
    to,
    order,
    returnStatus,
    returnDetails,
    user,
  }: {
    to: string;
    order: any; // Full order reference
    returnStatus: "RECEIVED" | "PROCESSING" | "APPROVED" | "COMPLETED";
    returnDetails: {
      id: string;
      reason: string;
      comments?: string;
    };
    user: { name: string };
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    // Return status information
    let statusInfo = {
      title: "",
      description: "",
      steps: [] as { status: string; active: boolean }[],
      color: "",
      emoji: "",
    };

    switch (returnStatus) {
      case "RECEIVED":
        statusInfo = {
          title: "Cerere de Retur Primită",
          description:
            "Am primit cererea ta de retur și este analizată de echipa noastră.",
          steps: [
            { status: "Cerere Primită", active: true },
            { status: "În Procesare", active: false },
            { status: "Aprobat", active: false },
            { status: "Finalizat", active: false },
          ],
          color: "#3b82f6",
          emoji: "📝",
        };
        break;
      case "PROCESSING":
        statusInfo = {
          title: "Retur în Procesare",
          description:
            "Returul tău este în curs de procesare. Îți vom trimite o actualizare când va fi aprobat.",
          steps: [
            { status: "Cerere Primită", active: true },
            { status: "În Procesare", active: true },
            { status: "Aprobat", active: false },
            { status: "Finalizat", active: false },
          ],
          color: "#f59e0b",
          emoji: "⏳",
        };
        break;
      case "APPROVED":
        statusInfo = {
          title: "Retur Aprobat",
          description:
            "Vești bune! Returul tău a fost aprobat. După ce primim produsele, vom procesa rambursarea.",
          steps: [
            { status: "Cerere Primită", active: true },
            { status: "În Procesare", active: true },
            { status: "Aprobat", active: true },
            { status: "Finalizat", active: false },
          ],
          color: "#10b981",
          emoji: "✅",
        };
        break;
      case "COMPLETED":
        statusInfo = {
          title: "Retur Finalizat",
          description:
            "Returul tău a fost finalizat și rambursarea a fost procesată. Poate dura câteva zile lucrătoare până va apărea în contul tău.",
          steps: [
            { status: "Cerere Primită", active: true },
            { status: "În Procesare", active: true },
            { status: "Aprobat", active: true },
            { status: "Finalizat", active: true },
          ],
          color: "#059669",
          emoji: "🎉",
        };
        break;
    }

    // Generate progress bar HTML
    const progressBarHtml = `
      <div style="margin: 32px 0;">
        <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">📊 Progres Retur</h3>
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
          ${statusInfo.steps
            .map(
              (step, index) => `
            <div style="flex: 1; text-align: center; position: relative;">
              <div style="width: 32px; height: 32px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: white; background-color: ${
                step.active ? statusInfo.color : "#d1d5db"
              };">
                ${index + 1}
              </div>
              <p style="margin: 0; font-size: 12px; color: ${step.active ? statusInfo.color : "#6b7280"}; font-weight: ${
                step.active ? "600" : "400"
              };">
                ${step.status}
              </p>
              ${
                index < statusInfo.steps.length - 1
                  ? `<div style="position: absolute; top: 16px; left: 50%; right: -50%; height: 2px; background-color: ${
                      statusInfo.steps[index + 1].active
                        ? statusInfo.color
                        : "#d1d5db"
                    }; z-index: -1;"></div>`
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">${statusInfo.emoji} ${statusInfo.title}</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; margin-bottom: 20px;">${statusInfo.description}</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">📦 Detalii Retur</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">ID Retur:</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${returnDetails.id}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Comandă Asociată:</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">#${order.orderNumber}</p>
          </div>
          <div style="grid-column: 1 / -1;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Motiv Retur:</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${returnDetails.reason}</p>
          </div>
          ${
            returnDetails.comments
              ? `
          <div style="grid-column: 1 / -1;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Comentarii:</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${returnDetails.comments}</p>
          </div>
          `
              : ""
          }
        </div>
      </div>
      
      ${progressBarHtml}
      
      <div style="margin: 32px 0; text-align: center;">
        <a href="${baseUrl}/account/returns/${returnDetails.id}" 
           style="background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
          📋 Vezi Detalii Retur
        </a>
      </div>
      
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 32px 0;">
        <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">ℹ️ Aspecte Importante din Politica de Retur</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
          <li style="margin-bottom: 8px;">Retururile trebuie inițiate în termen de 30 de zile de la livrare</li>
          <li style="margin-bottom: 8px;">Produsele trebuie să fie în ambalajul original și în stare nefolosită</li>
          <li style="margin-bottom: 8px;">Includeți toate accesoriile, manualele și cadourile gratuite</li>
        </ul>
        <p style="margin: 16px 0 0 0;">
          <a href="${baseUrl}/privacy" style="color: #1e40af; text-decoration: none; font-weight: 600;">📖 Citește Politica noastră completă de Returnare și Rambursare</a>
        </p>
      </div>
      
      <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 32px 0; text-align: center;">
        <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">💬 Ai întrebări despre returul tău?</h3>
        <p style="margin: 0; color: #1e40af;">
          Contactează echipa noastră de relații cu clienții la 
          <a href="mailto:webira.rem.srl@gmail.com" style="color: #1e40af; text-decoration: none; font-weight: 600;">webira.rem.srl@gmail.com</a> 
          sau sună-ne la <strong>+40 771 248 029</strong>
        </p>
      </div>
      
      <h3 style="color: #1f2937; margin: 40px 0 20px 0; text-align: center; font-size: 20px;">🎯 Produse Recomandate</h3>
      <p style="text-align: center; color: #6b7280; margin-bottom: 24px;">În timp ce aștepți procesarea returului tău, aruncă o privire la câteva dintre jucăriile noastre STEM de top:</p>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1; margin: 0 8px; text-align: center; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb;">
          <a href="${baseUrl}/products" style="text-decoration: none; color: inherit;">
            <div style="padding: 24px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
              <p style="font-weight: 600; margin: 0;">Produse Recomandate</p>
            </div>
          </a>
        </div>
        <div style="flex: 1; margin: 0 8px; text-align: center; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb;">
          <a href="${baseUrl}/products" style="text-decoration: none; color: inherit;">
            <div style="padding: 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">✨</div>
              <p style="font-weight: 600; margin: 0;">Noutăți</p>
            </div>
          </a>
        </div>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusInfo.title} - Comandă #${order.orderNumber} - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `${statusInfo.title} - Comandă #${order.orderNumber} - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  /**
   * Bulk return confirmation email for customers
   */
  bulkReturnConfirmation: async ({
    to,
    customerName,
    orderNumber,
    returnItems,
    reason,
    details,
    returnIds,
  }: {
    to: string;
    customerName: string;
    orderNumber: string;
    returnItems: Array<{
      name: string;
      quantity: number;
      sku?: string;
    }>;
    reason: string;
    details?: string;
    returnIds: string[];
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    // Map reason codes to user-friendly labels
    const reasonLabels: { [key: string]: string } = {
      DOES_NOT_MEET_EXPECTATIONS: "Nu corespunde așteptărilor",
      DAMAGED_OR_DEFECTIVE: "Produs deteriorat sau defect",
      WRONG_ITEM_SHIPPED: "Produs greșit livrat",
      CHANGED_MIND: "Mi-am schimbat părerea",
      ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
      OTHER: "Alte motive",
    };

    const reasonLabel = reasonLabels[reason] || reason;

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">📦 Cererea de Retur Confirmată</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${customerName}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Am primit cererea ta de retur pentru comanda <strong>#${orderNumber}</strong>. Îți mulțumim pentru încrederea acordată și ne cerem scuze pentru orice neplăcere.</p>
      
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1e40af; margin: 0 0 16px 0; text-align: center;">📋 Detalii Retur</h3>
        
        <div style="background-color: #ffffff; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Comandă:</strong> #${orderNumber}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Numărul de produse returnate:</strong> ${returnItems.length}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Motive:</strong> ${reasonLabel}</p>
          ${details ? `<p style="margin: 0; color: #374151;"><strong>Detalii suplimentare:</strong> ${details}</p>` : ""}
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px;">
          <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">🛍️ Produse pentru retur:</h4>
          ${returnItems
            .map(
              item => `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 8px 0; margin-bottom: 8px;">
              <p style="margin: 0; color: #1f2937; font-weight: 500;">• ${item.name}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Cantitate: ${item.quantity} ${item.sku ? `• SKU: ${item.sku}` : ""}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      
      <div style="background-color: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #047857; margin: 0 0 12px 0; font-size: 16px;">✅ Ce urmează?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #047857;">
          <li style="margin-bottom: 8px;">Echipa noastră va procesa cererea ta în următoarele <strong>24-48 de ore</strong></li>
          <li style="margin-bottom: 8px;">Vei primi un email cu instrucțiunile de returnare și eticheta de expediere</li>
          <li style="margin-bottom: 8px;">După primirea produselor, returul va fi processat în <strong>5-7 zile lucrătoare</strong></li>
          <li style="margin-bottom: 8px;">Vei fi notificat prin email despre statusul returului</li>
        </ul>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">⚠️ Informații importante despre retur:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #92400e;">
          <li style="margin-bottom: 8px;">Produsele trebuie returnate în starea originală, cu ambalajul intact</li>
          <li style="margin-bottom: 8px;">Retururile sunt procesate în ordinea primirii</li>
          <li style="margin-bottom: 8px;">Rambursarea se va efectua prin aceeași metodă de plată folosită la cumpărare</li>
          <li style="margin-bottom: 8px;">Pentru întrebări despre retur, contactează echipa noastră de suport</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/account/returns" 
           style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
          📊 Urmărește Statusul Returului
        </a>
      </div>
      
      <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
        <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">💬 Ai întrebări despre returul tău?</h3>
        <p style="margin: 0; color: #1e40af;">
          Echipa noastră de relații cu clienții este aici pentru tine! 
          <a href="mailto:webira.rem.srl@gmail.com" style="color: #1e40af; text-decoration: none; font-weight: 600;">webira.rem.srl@gmail.com</a> 
          sau sună-ne la <strong>+40 771 248 029</strong>
        </p>
      </div>
      
      <div style="margin: 32px 0; text-align: center;">
        <p style="color: #6b7280; margin: 0 0 12px 0; font-size: 14px;">Cod(uri) de referință retur:</p>
        <p style="color: #3b82f6; font-family: monospace; font-size: 12px; background-color: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb; margin: 0;">${returnIds.join(", ")}</p>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Îți mulțumim pentru înțelegere!<br><strong>Echipa ${storeSettings.storeName}</strong></p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cererea de Retur Confirmată - Comandă #${orderNumber} - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `📦 Cererea de Retur Confirmată - Comandă #${orderNumber} - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  /**
   * Bulk return admin notification email
   */
  bulkReturnAdminNotification: async ({
    to,
    customerName,
    customerEmail,
    orderNumber,
    returnItems,
    reason,
    details,
    returnIds,
  }: {
    to: string;
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    returnItems: Array<{
      name: string;
      quantity: number;
      sku?: string;
    }>;
    reason: string;
    details?: string;
    returnIds: string[];
  }) => {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    // Map reason codes to user-friendly labels
    const reasonLabels: { [key: string]: string } = {
      DOES_NOT_MEET_EXPECTATIONS: "Nu corespunde așteptărilor",
      DAMAGED_OR_DEFECTIVE: "Produs deteriorat sau defect",
      WRONG_ITEM_SHIPPED: "Produs greșit livrat",
      CHANGED_MIND: "Mi-am schimbat părerea",
      ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
      OTHER: "Alte motive",
    };

    const reasonLabel = reasonLabels[reason] || reason;

    const content = `
      ${generateEmailHeader(storeSettings)}
      
      <h1 style="color: #dc2626; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">🚨 Cerere de Retur Nouă</h1>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Un client a inițiat o cerere de retur pentru mai multe produse.</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #dc2626; margin: 0 0 16px 0; text-align: center;">📋 Informații Client</h3>
        
        <div style="background-color: #ffffff; border-radius: 6px; padding: 16px;">
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Nume:</strong> ${customerName}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #dc2626; text-decoration: none;">${customerEmail}</a></p>
          <p style="margin: 0; color: #374151;"><strong>Comandă:</strong> #${orderNumber}</p>
        </div>
      </div>
      
      <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #92400e; margin: 0 0 16px 0; text-align: center;">📦 Detalii Retur</h3>
        
        <div style="background-color: #ffffff; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Numărul de produse:</strong> ${returnItems.length}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Motiv:</strong> ${reasonLabel}</p>
          ${details ? `<p style="margin: 0; color: #374151;"><strong>Detalii suplimentare:</strong> ${details}</p>` : ""}
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px;">
          <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">🛍️ Produse pentru retur:</h4>
          ${returnItems
            .map(
              item => `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 8px 0; margin-bottom: 8px;">
              <p style="margin: 0; color: #1f2937; font-weight: 500;">• ${item.name}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Cantitate: ${item.quantity} ${item.sku ? `• SKU: ${item.sku}` : ""}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      
      <div style="background-color: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #047857; margin: 0 0 12px 0; font-size: 16px;">✅ Acțiuni necesare:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #047857;">
          <li style="margin-bottom: 8px;">Revizuiește cererea de retur în panoul de administrare</li>
          <li style="margin-bottom: 8px;">Contactează clientul dacă ai nevoie de clarificări suplimentare</li>
          <li style="margin-bottom: 8px;">Aprobă sau respinge cererea în funcție de politica companiei</li>
          <li style="margin-bottom: 8px;">Trimite instrucțiunile de returnare clientului</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${baseUrl}/admin/returns" 
           style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
          🔧 Gestionează Returul în Admin
        </a>
      </div>
      
      <div style="margin: 32px 0; text-align: center;">
        <p style="color: #6b7280; margin: 0 0 12px 0; font-size: 14px;">Coduri de referință retur:</p>
        <p style="color: #dc2626; font-family: monospace; font-size: 12px; background-color: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb; margin: 0;">${returnIds.join(", ")}</p>
      </div>
      
      <p style="font-size: 16px; text-align: center; margin-top: 32px;">Echipa ${storeSettings.storeName}</p>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚨 Cerere de Retur Nouă - Comandă #${orderNumber} - ${storeSettings.storeName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${generateEmailContainer(content)}
        ${generateEmailFooter(storeSettings)}
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `🚨 Cerere de Retur Nouă - Comandă #${orderNumber} - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  // Order Processing Email Templates
  async sendOrderFulfilledEmail({
    to,
    orderNumber,
    customerName,
    orderTotal,
    items,
    shippingAddress,
  }: {
    to: string;
    orderNumber: string;
    customerName: string;
    orderTotal: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    shippingAddress: any;
  }) {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comanda #${orderNumber} - Gata pentru Expediere</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #667eea; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Comanda Ta Este Gata!</h1>
            <p>Comanda #${orderNumber} a fost procesată și este gata pentru expediere</p>
          </div>
          <div class="content">
            <h2>Salut ${customerName}!</h2>
            <p>Excelente știri! Comanda ta #${orderNumber} a fost procesată cu succes și este acum gata pentru expediere.</p>
            
            <div class="order-details">
              <h3>Detalii Comandă</h3>
              ${items
                .map(
                  item => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>${new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(item.price * item.quantity)}</span>
                </div>
              `
                )
                .join("")}
              <div class="item total">
                <span>Total</span>
                <span>${new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(orderTotal)}</span>
              </div>
            </div>

            <p><strong>Adresa de livrare:</strong></p>
            <p>${shippingAddress.fullName}<br>
            ${shippingAddress.addressLine1}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
            ${shippingAddress.country}</p>

            <p>Vei primi o notificare cu numărul de urmărire când comanda va fi expediată.</p>
            
            <a href="${baseUrl}/account/orders" class="cta-button">Vezi Comanda</a>
            
            <p>Mulțumim că ai ales ${storeSettings.storeName}!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `🎉 Comanda #${orderNumber} - Gata pentru Expediere - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  async sendOrderShippedEmail({
    to,
    orderNumber,
    customerName,
    trackingNumber,
    items,
    shippingAddress,
  }: {
    to: string;
    orderNumber: string;
    customerName: string;
    trackingNumber?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    shippingAddress: any;
  }) {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comanda #${orderNumber} - Expediată</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .tracking { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .tracking-number { font-size: 24px; font-weight: bold; color: #4CAF50; margin: 10px 0; }
          .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Comanda Ta a Fost Expediată!</h1>
            <p>Comanda #${orderNumber} este în drum spre tine</p>
          </div>
          <div class="content">
            <h2>Salut ${customerName}!</h2>
            <p>Excelente știri! Comanda ta #${orderNumber} a fost expediată și este în drum spre tine.</p>
            
            ${
              trackingNumber
                ? `
              <div class="tracking">
                <h3>Numărul de Urmărire</h3>
                <div class="tracking-number">${trackingNumber}</div>
                <p>Folosește acest număr pentru a urmări comanda ta online</p>
              </div>
            `
                : ""
            }

            <p><strong>Adresa de livrare:</strong></p>
            <p>${shippingAddress.fullName}<br>
            ${shippingAddress.addressLine1}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
            ${shippingAddress.country}</p>

            <p>Comanda ta ar trebui să ajungă în următoarele 2-5 zile lucrătoare.</p>
            
            <a href="${baseUrl}/account/orders" class="cta-button">Urmărește Comanda</a>
            
            <p>Mulțumim că ai ales ${storeSettings.storeName}!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `🚚 Comanda #${orderNumber} - Expediată - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  async sendOrderDeliveredEmail({
    to,
    orderNumber,
    customerName,
    items,
  }: {
    to: string;
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }) {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comanda #${orderNumber} - Livrată</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Comanda Ta a Fost Livrată!</h1>
            <p>Comanda #${orderNumber} a ajuns la destinație</p>
          </div>
          <div class="content">
            <h2>Salut ${customerName}!</h2>
            <p>Excelente știri! Comanda ta #${orderNumber} a fost livrată cu succes.</p>
            
            <p>Sperăm că te vei bucura de produsele tale noi! Dacă ai întrebări sau ai nevoie de asistență, nu ezita să ne contactezi.</p>
            
            <a href="${baseUrl}/account/orders" class="cta-button">Vezi Comanda</a>
            <a href="${baseUrl}/contact" class="cta-button">Contactează-ne</a>
            
            <p>Mulțumim că ai ales ${storeSettings.storeName} și sperăm să te vedem din nou curând!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `📦 Comanda #${orderNumber} - Livrată - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },

  async sendOrderCompletedEmail({
    to,
    orderNumber,
    customerName,
  }: {
    to: string;
    orderNumber: string;
    customerName: string;
  }) {
    const storeSettings = await getStoreSettings();
    const baseUrl = getBaseUrl();

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comanda #${orderNumber} - Completată</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #9C27B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Comanda Ta a Fost Completată!</h1>
            <p>Comanda #${orderNumber} - Proces completat</p>
          </div>
          <div class="content">
            <h2>Salut ${customerName}!</h2>
            <p>Comanda ta #${orderNumber} a fost completată cu succes! Procesul de comandă s-a încheiat.</p>
            
            <p>Mulțumim pentru încrederea acordată ${storeSettings.storeName}! Sperăm că te vei bucura de produsele tale și că vei reveni curând pentru alte achiziții.</p>
            
            <a href="${baseUrl}/products" class="cta-button">Descoperă Produse Noi</a>
            <a href="${baseUrl}/account/orders" class="cta-button">Vezi Istoricul Comenzilor</a>
            
            <p>Echipa ${storeSettings.storeName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendMail({
      to,
      subject: `✅ Comanda #${orderNumber} - Completată - ${storeSettings.storeName}`,
      html,
      params: { email: to },
    });
  },
};
