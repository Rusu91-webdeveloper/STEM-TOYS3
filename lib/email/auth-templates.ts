/**
 * Authentication email templates
 * Includes welcome, verification, and password reset emails
 */

import { sendMail } from "../brevo";
import { prisma } from "@/lib/prisma";
import { ro as roTranslations } from "@/lib/i18n/translations/ro";
import {
  getStoreSettings,
  getBaseUrl,
  generateEmailHeader,
  generateEmailHTML,
} from "./base";

/**
 * Welcome email with SEO optimized links and content
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

  const html = generateEmailHTML(content, storeSettings, "Bine ai venit");

  return sendMail({
    to,
    subject: roTranslations.email_welcome_subject,
    html,
    params: { email: to },
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

  const html = generateEmailHTML(
    content,
    storeSettings,
    "Verifică adresa de email"
  );

  return sendMail({
    to,
    subject: roTranslations.email_verification_subject,
    html,
    params: { email: to },
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

  const content = `
    ${generateEmailHeader(storeSettings)}
    
    <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">🔑 Resetare Parolă</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Am primit o solicitare de resetare a parolei pentru contul tău ${storeSettings.storeName}.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" 
         style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
        🔑 Resetează Parola
      </a>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">⚠️ Important:</p>
      <p style="margin: 0; color: #92400e;">Acest link va expira în <strong>${expiresIn}</strong>. Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email și parola ta va rămâne neschimbată.</p>
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Sau copiază și lipește acest link în browserul tău:</p>
      <p style="word-break: break-all; color: #3b82f6; margin: 0; font-family: monospace; font-size: 13px; background-color: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">${resetLink}</p>
    </div>
    
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
      <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: 600;">💡 Sfat de securitate:</p>
      <p style="margin: 0; color: #1e40af; font-size: 14px;">Alege o parolă puternică cu cel puțin 8 caractere, combinând litere mari și mici, numere și simboluri.</p>
    </div>
    
    <p style="font-size: 16px; text-align: center; margin-top: 32px;">Echipa de securitate,<br><strong>${storeSettings.storeName}</strong></p>
  `;

  const html = generateEmailHTML(content, storeSettings, "Resetare Parolă");

  return sendMail({
    to,
    subject: "🔑 Resetare parolă pentru contul tău",
    html,
    params: { email: to },
  });
}
