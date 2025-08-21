/**
 * Order-related email templates
 * Includes digital book delivery, order confirmation, and shipping notifications
 */

import { sendMail } from "../brevo";

import {
  getStoreSettings,
  getBaseUrl,
  generateEmailHeader,
  generateEmailHTML,
  formatPrice,
} from "./base";

/**
 * Digital book delivery email with download links
 */
export async function sendDigitalBookDeliveryEmail({
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
}) {
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

  const html = generateEmailHTML(
    content,
    storeSettings,
    "Cărțile tale digitale sunt gata!"
  );

  return sendMail({
    to,
    subject: `📚 Cărțile tale digitale sunt gata pentru descărcare! - Comanda #${orderId}`,
    html,
    params: { email: to },
  });
}

/**
 * Professional Order Confirmation Email
 * Enterprise-grade design with advanced order tracking and engagement features
 */
export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderId,
  orderItems,
  totalAmount,
  shippingAddress,
  estimatedDelivery,
}: {
  to: string;
  customerName: string;
  orderId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalAmount: number;
  shippingAddress: string;
  estimatedDelivery: string;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();

  // Import professional components
  const {
    createHeroSection,
    createButton,
    createOrderSummary,
    createAlert,
    createFeatureGrid,
    createCTASection,
  } = await import("./components");

  const { generateProfessionalEmail, generatePreviewText } = await import(
    "./base"
  );

  const { colors, gradients, typography, spacing, borderRadius } = await import(
    "./design-system"
  );

  // Professional order confirmation content
  const content = `
    ${createHeroSection(
      "✅ Comanda Confirmată!",
      "Mulțumim pentru comanda ta! Am primit comanda și o procesăm cu atenție.",
      gradients.success
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${customerName}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Îți mulțumim pentru comanda <strong style="color: ${colors.primary[600]};">#${orderId}</strong>! Am primit comanda ta și o procesăm cu atenție în acest moment.
      </p>
    </div>

    ${createOrderSummary(orderItems, totalAmount)}

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        📦 Informații de Livrare
      </h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${spacing.lg}; margin-top: ${spacing.lg};">
        <div>
          <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            🏠 Adresa de Livrare
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.normal};">
            ${shippingAddress}
          </p>
        </div>
        
        <div>
          <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            📅 Livrare Estimată
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.normal};">
            ${estimatedDelivery}
          </p>
        </div>
      </div>
    </div>

    ${createAlert(
      `<strong>Procesarea comenzii:</strong> Comanda ta va fi procesată în următoarele 24-48 de ore. Vei primi un email când comanda va fi expediată, cu numărul de urmărire.`,
      "info",
      "⏱️"
    )}

    ${createFeatureGrid([
      {
        icon: "📱",
        title: "Urmărire în Timp Real",
        description:
          "Urmărește statusul comenzii tale din contul personal sau prin notificări email.",
        color: colors.primary[600],
      },
      {
        icon: "🚚",
        title: "Livrare Rapidă",
        description:
          "Livrare în 2-5 zile lucrătoare în toată România, cu curier de încredere.",
        color: colors.success[600],
      },
      {
        icon: "🛡️",
        title: "Garanție Completă",
        description:
          "Toate produsele beneficiază de garanție de 2 ani și retur gratuit în 30 de zile.",
        color: colors.warning[600],
      },
      {
        icon: "💬",
        title: "Suport 24/7",
        description:
          "Echipa noastră de suport este disponibilă pentru orice întrebare despre comanda ta.",
        color: colors.accent.purple,
      },
    ])}

    ${createCTASection(
      "Urmărește Comanda Ta",
      "Accesează contul tău pentru a vedea statusul comenzii în timp real și pentru a gestiona toate comenzile tale.",
      {
        text: "👁️ Vezi Comanda",
        url: `${baseUrl}/account/orders/${orderId}`,
      },
      {
        text: "📋 Toate Comenzile",
        url: `${baseUrl}/account/orders`,
      }
    )}

    <div style="background: ${colors.neutral[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; text-align: center;">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[900]};">
        🎁 Recomandări Personalizate
      </h3>
      <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.neutral[600]};">
        În funcție de produsele comandate, îți recomandăm și aceste jucării STEM complementare:
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: ${spacing.md}; margin-top: ${spacing.lg};">
        <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; border: 1px solid ${colors.neutral[200]};">
          <div style="font-size: ${typography.fontSize["2xl"]}; margin-bottom: ${spacing.sm};">🧩</div>
          <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            Puzzle-uri STEM
          </h4>
          <p style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
            Dezvoltă logica și creativitatea
          </p>
          ${createButton("Vezi Colecția", `${baseUrl}/products?category=puzzles`, "primary", "sm")}
        </div>
        
        <div style="background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.md}; border: 1px solid ${colors.neutral[200]};">
          <div style="font-size: ${typography.fontSize["2xl"]}; margin-bottom: ${spacing.sm};">🔬</div>
          <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            Seturi Experimente
          </h4>
          <p style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.sm}; color: ${colors.neutral[600]};">
            Descoperă lumea științei
          </p>
          ${createButton("Vezi Colecția", `${baseUrl}/products?category=experiments`, "primary", "sm")}
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Îți mulțumim că ai ales ${storeSettings.storeName}!
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
    `Comanda #${orderId} a fost confirmată! Mulțumim pentru comanda ta. Vei primi un email când comanda va fi expediată.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Comanda confirmată",
    previewText
  );

  return sendMail({
    to,
    subject: `✅ Comanda #${orderId} confirmată - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}

/**
 * Professional Shipping Notification Email
 * Enterprise-grade design with advanced tracking and delivery features
 */
export async function sendShippingNotificationEmail({
  to,
  customerName,
  orderId,
  trackingNumber,
  estimatedDelivery,
  courierName = "Curier",
}: {
  to: string;
  customerName: string;
  orderId: string;
  trackingNumber: string;
  estimatedDelivery: string;
  courierName?: string;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();

  // Import professional components
  const {
    createHeroSection,
    createButton,
    createAlert,
    createFeatureGrid,
    createCTASection,
  } = await import("./components");

  const { generateProfessionalEmail, generatePreviewText } = await import(
    "./base"
  );

  const { colors, gradients, typography, spacing, borderRadius } = await import(
    "./design-system"
  );

  // Professional shipping notification content
  const content = `
    ${createHeroSection(
      "🚚 Comanda Ta Este în Drum!",
      "Vestea bună! Comanda ta a fost expediată și este în drum către tine.",
      gradients.success
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${customerName}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Vestea bună! Comanda ta <strong style="color: ${colors.primary[600]};">#${orderId}</strong> a fost expediată și este în drum către tine.
      </p>
    </div>

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        📋 Detalii Expediere
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: ${spacing.lg};">
        <div style="text-align: center; background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]};">
          <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            🔍 Numărul de Urmărire
          </h4>
          <div style="background: ${colors.neutral[100]}; border: 2px solid ${colors.primary[300]}; border-radius: ${borderRadius.md}; padding: ${spacing.md}; margin: ${spacing.sm} 0;">
            <p style="margin: 0; font-family: monospace; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]};">
              ${trackingNumber}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]};">
          <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            🚚 Curier
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[600]};">
            ${courierName}
          </p>
        </div>
        
        <div style="text-align: center; background: white; border-radius: ${borderRadius.lg}; padding: ${spacing.lg}; border: 1px solid ${colors.primary[200]};">
          <h4 style="margin: 0 0 ${spacing.sm} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.neutral[800]};">
            📅 Livrare Estimată
          </h4>
          <p style="margin: 0; font-size: ${typography.fontSize.lg}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.success[600]};">
            ${estimatedDelivery}
          </p>
        </div>
      </div>
    </div>

    ${createAlert(
      `<strong>Urmărire în timp real:</strong> Poți urmări statusul coletului folosind numărul de urmărire de mai sus. Vei primi notificări despre fiecare etapă a livrării.`,
      "info",
      "📱"
    )}

    ${createFeatureGrid([
      {
        icon: "📱",
        title: "Urmărire în Timp Real",
        description:
          "Urmărește statusul coletului în timp real prin aplicația curierului sau site-ul nostru.",
        color: colors.primary[600],
      },
      {
        icon: "🏠",
        title: "Livrare la Adresa Ta",
        description:
          "Coletul va fi livrat la adresa specificată în comandă, cu semnătura ta.",
        color: colors.success[600],
      },
      {
        icon: "📞",
        title: "Notificări SMS/Email",
        description:
          "Primești notificări despre fiecare etapă a livrării prin SMS și email.",
        color: colors.warning[600],
      },
      {
        icon: "🛡️",
        title: "Asigurare Completă",
        description:
          "Coletul este asigurat împotriva deteriorării și pierderii în timpul transportului.",
        color: colors.accent.purple,
      },
    ])}

    ${createCTASection(
      "Urmărește Coletul Ta",
      "Accesează link-ul de urmărire pentru a vedea statusul exact al coletului și pentru a primi notificări în timp real.",
      {
        text: "📦 Urmărește Coletul",
        url: `${baseUrl}/account/orders/${orderId}`,
      },
      {
        text: "📱 Descarcă Aplicația",
        url: `${baseUrl}/mobile-app`,
      }
    )}

    <div style="background: ${colors.warning[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.warning[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.warning[800]}; text-align: center;">
        💡 Sfaturi pentru Primirea Pachetului
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: ${spacing.md}; margin-top: ${spacing.lg};">
        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: ${typography.fontSize.lg}; margin-right: ${spacing.sm}; color: ${colors.warning[600]};">1️⃣</span>
          <div>
            <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.warning[800]};">
              Urmărește Statusul
            </h4>
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.warning[700]};">
              Urmărește statusul coletului folosind numărul de urmărire
            </p>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: ${typography.fontSize.lg}; margin-right: ${spacing.sm}; color: ${colors.warning[600]};">2️⃣</span>
          <div>
            <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.warning[800]};">
              Fii Prezent
            </h4>
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.warning[700]};">
              Asigură-te că cineva este prezent la adresa de livrare
            </p>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: ${typography.fontSize.lg}; margin-right: ${spacing.sm}; color: ${colors.warning[600]};">3️⃣</span>
          <div>
            <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.warning[800]};">
              Verifică Conținutul
            </h4>
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.warning[700]};">
              Verifică conținutul pachetului la primire
            </p>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <span style="font-size: ${typography.fontSize.lg}; margin-right: ${spacing.sm}; color: ${colors.warning[600]};">4️⃣</span>
          <div>
            <h4 style="margin: 0 0 ${spacing.xs} 0; font-size: ${typography.fontSize.base}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.warning[800]};">
              Contactează-ne
            </h4>
            <p style="margin: 0; font-size: ${typography.fontSize.sm}; color: ${colors.warning[700]};">
              Contactează-ne dacă întâmpini probleme cu livrarea
            </p>
          </div>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Îți mulțumim pentru încredere!
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
    `Comanda #${orderId} a fost expediată! Urmărește coletul folosind numărul de urmărire ${trackingNumber}. Livrare estimată: ${estimatedDelivery}.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Comanda expediată",
    previewText
  );

  return sendMail({
    to,
    subject: `🚚 Comanda #${orderId} a fost expediată - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}

/**
 * Order completed email - Enhanced with better UX and engagement features
 */
export async function sendOrderCompletedEmail({
  to,
  customerName,
  orderId,
  orderItems,
  totalAmount,
  shippingAddress,
  completedAt,
}: {
  to: string;
  customerName: string;
  orderId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalAmount: number;
  shippingAddress: string;
  completedAt: string;
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
    createOrderSummary,
    createAlert,
    createProductCard,
    createFeatureGrid,
    createTestimonial,
    createCTASection,
    createButton,
  } = await import("./components");

  // Professional order completion content
  const content = `
    ${createHeroSection(
      "🎉 Comanda Ta a Fost Finalizată cu Succes!",
      "Mulțumim că ai ales ${storeSettings.storeName} pentru jucăriile STEM ale copilului tău!",
      gradients.success
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${customerName}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Comanda ta <strong style="color: ${colors.primary[600]};">#${orderId}</strong> a fost finalizată cu succes pe data de <strong style="color: ${colors.success[600]};">${completedAt}</strong>. 
        Mulțumim că ai ales ${storeSettings.storeName} pentru jucăriile STEM ale copilului tău!
      </p>
    </div>

    ${createOrderSummary(orderItems, totalAmount)}

    ${createAlert(
      `<strong>📦 Informații de livrare:</strong><br>
       <strong>Adresa:</strong> ${shippingAddress}<br>
       <strong>Status:</strong> <span style="color: ${colors.success[600]}; font-weight: ${typography.fontWeight.semibold};">✅ Finalizată cu succes</span>`,
      "success",
      "📦"
    )}

    ${createAlert(
      `<strong>⭐ Părerea ta contează pentru noi!</strong><br>
       Ajută-ne să îmbunătățim experiența pentru alți părinți și să recomandăm produsele tale favorite.`,
      "warning",
      "⭐"
    )}

    ${createCTASection(
      "Lasă un Review",
      "Ajută alți părinți să facă alegerea potrivită prin părerea ta valoroasă.",
      {
        text: "✍️ Lasă un Review",
        url: `${baseUrl}/account/orders/${orderId}/review`,
      },
      {
        text: "👁️ Vezi Comanda",
        url: `${baseUrl}/account/orders/${orderId}`,
      }
    )}

    ${createFeatureGrid([
      {
        icon: "🧩",
        title: "Puzzle-uri STEM",
        description:
          "Dezvoltă logica și creativitatea prin jocuri educaționale interactive.",
        color: colors.primary[600],
      },
      {
        icon: "🤖",
        title: "Roboți Educaționali",
        description:
          "Introduce-te în lumea tehnologiei cu roboți programabili și inteligent.",
        color: colors.accent.purple,
      },
      {
        icon: "🔬",
        title: "Seturi de Experimente",
        description:
          "Descoperă lumea științei prin experimente practice și interactive.",
        color: colors.success[600],
      },
      {
        icon: "🎯",
        title: "Jocuri de Logică",
        description:
          "Îmbunătățește abilitățile cognitive prin jocuri strategice.",
        color: colors.warning[600],
      },
    ])}

    ${createTestimonial(
      "Produsele STEM de la ${storeSettings.storeName} au transformat complet modul în care copilul meu învață. Recomand cu încredere!",
      "Maria Popescu",
      "Mamă de 2 copii",
      5
    )}

    ${createCTASection(
      "Descoperă Mai Multe Produse",
      "Explorează colecția noastră completă de jucării STEM și găsește următoarea aventură educațională.",
      {
        text: "🛍️ Vezi Produse Noi",
        url: `${baseUrl}/products`,
      },
      {
        text: "📚 Vezi Cărți Digitale",
        url: `${baseUrl}/digital-books`,
      }
    )}

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        💬 Ai întrebări sau nevoie de ajutor?
      </h3>
      <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.primary[700]}; text-align: center; line-height: ${typography.lineHeight.relaxed};">
        Echipa noastră de suport este aici pentru tine! Contactează-ne pentru orice întrebare despre produsele tale.
      </p>
      
      <div style="display: flex; justify-content: center; gap: ${spacing.md}; flex-wrap: wrap;">
        ${createButton(
          "📞 Contact Suport",
          `${baseUrl}/contact`,
          "primary",
          "md"
        )}
        ${createButton(
          "❓ Întrebări Frecvente",
          `${baseUrl}/faq`,
          "secondary",
          "md"
        )}
      </div>
    </div>

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Îți mulțumim că ai ales ${storeSettings.storeName}!
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
    `Comanda #${orderId} a fost finalizată cu succes! Mulțumim că ai ales ${storeSettings.storeName}. Lasă un review și descoperă produse noi.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Comanda finalizată",
    previewText
  );

  return sendMail({
    to,
    subject: `🎉 Comanda #${orderId} a fost finalizată cu succes! - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}

/**
 * Order delivered email
 */
export async function sendOrderDeliveredEmail({
  to,
  customerName,
  orderId,
  orderItems,
  totalAmount,
  shippingAddress,
  deliveredAt,
}: {
  to: string;
  customerName: string;
  orderId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalAmount: number;
  shippingAddress: string;
  deliveredAt: string;
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
    createOrderSummary,
    createAlert,
    createFeatureGrid,
    createTestimonial,
    createCTASection,
    createButton,
  } = await import("./components");

  // Professional order delivered content
  const content = `
    ${createHeroSection(
      "📦 Comanda Ta a Fost Livrată cu Succes!",
      "Sperăm că totul este în regulă cu produsele primite și că copilul tău se bucură de jucăriile STEM!",
      gradients.success
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${customerName}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Comanda ta <strong style="color: ${colors.primary[600]};">#${orderId}</strong> a fost livrată cu succes pe data de <strong style="color: ${colors.success[600]};">${deliveredAt}</strong>. 
        Sperăm că totul este în regulă cu produsele primite și că copilul tău se bucură de jucăriile STEM!
      </p>
    </div>

    ${createOrderSummary(orderItems, totalAmount)}

    ${createAlert(
      `<strong>📦 Informații de livrare:</strong><br>
       <strong>Adresa:</strong> ${shippingAddress}<br>
       <strong>Livrat la data:</strong> ${deliveredAt}<br>
       <strong>Status:</strong> <span style="color: ${colors.success[600]}; font-weight: ${typography.fontWeight.semibold};">✅ Livrat cu succes</span>`,
      "success",
      "📦"
    )}

    ${createAlert(
      `<strong>💬 Feedback:</strong><br>
       Te rugăm să ne spui dacă totul a fost în regulă cu comanda ta sau dacă ai întâmpinat probleme. Părerea ta contează pentru noi!`,
      "warning",
      "💬"
    )}

    ${createCTASection(
      "Lasă un Review",
      "Ajută alți părinți să facă alegerea potrivită prin părerea ta valoroasă despre produsele primite.",
      {
        text: "✍️ Lasă un Review",
        url: `${baseUrl}/account/orders/${orderId}/review`,
      },
      {
        text: "👁️ Vezi Comanda",
        url: `${baseUrl}/account/orders/${orderId}`,
      }
    )}

    ${createFeatureGrid([
      {
        icon: "🎯",
        title: "Calitate Garantată",
        description:
          "Toate produsele noastre sunt testate și aprobate pentru siguranța copiilor.",
        color: colors.success[600],
      },
      {
        icon: "🚚",
        title: "Livrare Rapidă",
        description:
          "Livrăm în toată România cu curieri de încredere și tracking în timp real.",
        color: colors.primary[600],
      },
      {
        icon: "🛡️",
        title: "Garanție Extinsă",
        description:
          "Oferim garanție extinsă pentru toate produsele STEM din colecția noastră.",
        color: colors.warning[600],
      },
      {
        icon: "💬",
        title: "Suport Dedicat",
        description:
          "Echipa noastră este aici să te ajute cu orice întrebare despre produse.",
        color: colors.accent.purple,
      },
    ])}

    ${createTestimonial(
      "Livrarea a fost perfectă și copilul meu este încântat de jucăriile STEM! Recomand cu încredere ${storeSettings.storeName}.",
      "Alexandru Ionescu",
      "Tată de 2 copii",
      5
    )}

    ${createCTASection(
      "Descoperă Mai Multe Produse",
      "Explorează colecția noastră completă de jucării STEM și găsește următoarea aventură educațională.",
      {
        text: "🛍️ Vezi Produse Noi",
        url: `${baseUrl}/products`,
      },
      {
        text: "📚 Vezi Cărți Digitale",
        url: `${baseUrl}/digital-books`,
      }
    )}

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        💬 Ai întrebări sau nevoie de ajutor?
      </h3>
      <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.primary[700]}; text-align: center; line-height: ${typography.lineHeight.relaxed};">
        Echipa noastră de suport este aici pentru tine! Contactează-ne pentru orice întrebare despre produsele tale.
      </p>
      
      <div style="display: flex; justify-content: center; gap: ${spacing.md}; flex-wrap: wrap;">
        ${createButton(
          "📞 Contact Suport",
          `${baseUrl}/contact`,
          "primary",
          "md"
        )}
        ${createButton(
          "❓ Întrebări Frecvente",
          `${baseUrl}/faq`,
          "secondary",
          "md"
        )}
      </div>
    </div>

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Îți mulțumim că ai ales ${storeSettings.storeName}!
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
    `Comanda #${orderId} a fost livrată cu succes! Sperăm că totul este în regulă cu produsele. Lasă un review și descoperă produse noi.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Comanda livrată",
    previewText
  );

  return sendMail({
    to,
    subject: `📦 Comanda #${orderId} a fost livrată - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}

/**
 * Order cancellation email
 */
export async function sendOrderCancellationEmail({
  to,
  customerName,
  orderId,
  orderItems,
  totalAmount,
  cancellationReason,
  cancelledAt,
}: {
  to: string;
  customerName: string;
  orderId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalAmount: number;
  cancellationReason?: string;
  cancelledAt: string;
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
    createOrderSummary,
    createAlert,
    createFeatureGrid,
    createCTASection,
    createButton,
  } = await import("./components");

  // Professional order cancellation content
  const content = `
    ${createHeroSection(
      "❌ Comanda Ta a Fost Anulată",
      "Înțelegem că circumstanțele se pot schimba. Suntem aici să te ajutăm.",
      gradients.error
    )}

    <div style="text-align: center; margin: ${spacing.xl} 0;">
      <p style="font-size: ${typography.fontSize.lg}; margin-bottom: ${spacing.md}; color: ${colors.neutral[700]};">
        Salut <strong style="color: ${colors.neutral[900]};">${customerName}</strong>,
      </p>
      <p style="font-size: ${typography.fontSize.base}; margin-bottom: ${spacing.lg}; color: ${colors.neutral[600]}; line-height: ${typography.lineHeight.relaxed};">
        Comanda ta <strong style="color: ${colors.primary[600]};">#${orderId}</strong> a fost anulată pe data de <strong style="color: ${colors.error[600]};">${cancelledAt}</strong>.
      </p>
    </div>

    ${
      cancellationReason
        ? createAlert(
            `<strong>📝 Motivul anulării:</strong><br>
             <em>"${cancellationReason}"</em>`,
            "error",
            "📝"
          )
        : ""
    }

    ${createOrderSummary(orderItems, totalAmount)}

    ${createAlert(
      `<strong>💳 Informații despre rambursare:</strong><br>
       Dacă ai plătit comanda, rambursarea va fi procesată în următoarele 3-5 zile lucrătoare.<br>
       Rambursarea va fi făcută pe metoda de plată folosită la comandă.`,
      "info",
      "💳"
    )}

    ${createFeatureGrid([
      {
        icon: "⏱️",
        title: "Procesare Rapidă",
        description:
          "Rambursarea este procesată automat în 3-5 zile lucrătoare.",
        color: colors.primary[600],
      },
      {
        icon: "🔄",
        title: "Metoda Originală",
        description:
          "Banii sunt returnați pe aceeași metodă de plată folosită.",
        color: colors.success[600],
      },
      {
        icon: "📧",
        title: "Confirmare Email",
        description: "Primești confirmarea rambursării prin email.",
        color: colors.warning[600],
      },
      {
        icon: "🛡️",
        title: "Siguranță Garantată",
        description: "Toate tranzacțiile sunt securizate și monitorizate.",
        color: colors.accent.purple,
      },
    ])}

    ${createCTASection(
      "Explorează Produsele Noastre",
      "Descoperă colecția noastră de jucării STEM și găsește produsele perfecte pentru copilul tău.",
      {
        text: "🛍️ Vezi Produsele Noastre",
        url: `${baseUrl}/products`,
      },
      {
        text: "📚 Vezi Cărți Digitale",
        url: `${baseUrl}/digital-books`,
      }
    )}

    <div style="background: ${colors.primary[50]}; border-radius: ${borderRadius.xl}; padding: ${spacing.xl}; margin: ${spacing.xl} 0; border: 1px solid ${colors.primary[200]};">
      <h3 style="margin: 0 0 ${spacing.md} 0; font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.semibold}; color: ${colors.primary[800]}; text-align: center;">
        ❓ Ai întrebări sau nevoie de ajutor?
      </h3>
      <p style="margin: 0 0 ${spacing.lg} 0; font-size: ${typography.fontSize.base}; color: ${colors.primary[700]}; text-align: center; line-height: ${typography.lineHeight.relaxed};">
        Echipa noastră de suport este aici pentru tine! Contactează-ne dacă ai nevoie de ajutor.
      </p>
      
      <div style="display: flex; justify-content: center; gap: ${spacing.md}; flex-wrap: wrap;">
        ${createButton(
          "📞 Contact Suport",
          `${baseUrl}/contact`,
          "primary",
          "md"
        )}
        ${createButton(
          "❓ Întrebări Frecvente",
          `${baseUrl}/faq`,
          "secondary",
          "md"
        )}
      </div>
    </div>

    <div style="text-align: center; margin: ${spacing["2xl"]} 0;">
      <p style="font-size: ${typography.fontSize.lg}; color: ${colors.neutral[700]}; margin-bottom: ${spacing.md};">
        Îți mulțumim pentru înțelegere!
      </p>
      <p style="font-size: ${typography.fontSize.xl}; font-weight: ${typography.fontWeight.bold}; color: ${colors.primary[600]}; margin: 0;">
        Echipa ${storeSettings.storeName}
      </p>
      <p style="font-size: ${typography.fontSize.sm}; color: ${colors.neutral[500]}; margin-top: ${spacing.sm};">
        Suntem aici să te ajutăm să găsești produsele perfecte pentru copilul tău
      </p>
    </div>
  `;

  const previewText = generatePreviewText(
    `Comanda #${orderId} a fost anulată. Rambursarea va fi procesată în 3-5 zile lucrătoare. Contactează-ne pentru orice întrebare.`,
    150
  );

  const html = generateProfessionalEmail(
    content,
    storeSettings,
    "Comanda anulată",
    previewText
  );

  return sendMail({
    to,
    subject: `❌ Comanda #${orderId} a fost anulată - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}
