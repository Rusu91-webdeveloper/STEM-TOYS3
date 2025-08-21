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
 * Order confirmation email
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

  const content = `
    ${generateEmailHeader(storeSettings)}
    
    <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">✅ Comanda confirmată!</h1>
    
    <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${customerName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Îți mulțumim pentru comanda <strong>#${orderId}</strong>! Am primit comanda ta și o procesăm în acest moment.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #047857; margin: 0 0 16px 0; text-align: center;">🛒 Detaliile comenzii tale</h3>
      
      ${orderItems
        .map(
          item => `
        <div style="border-bottom: 1px solid #d1fae5; padding: 12px 0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">` : ""}
            <div>
              <p style="margin: 0; font-weight: 600; color: #1f2937;">${item.name}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Cantitate: ${item.quantity}</p>
            </div>
          </div>
          <p style="margin: 0; font-weight: 600; color: #047857;">${formatPrice(item.price * item.quantity)} <span style="font-size: 12px; color: #6b7280;">(inclusiv TVA)</span></p>
        </div>
      `
        )
        .join("")}
      
      <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #047857;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #047857;">Total (inclusiv TVA): ${formatPrice(totalAmount)}</p>
      </div>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0;">📦 Informații de livrare:</h3>
      <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Adresa:</strong> ${shippingAddress}</p>
      <p style="margin: 0; color: #1f2937;"><strong>Livrare estimată:</strong> ${estimatedDelivery}</p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${baseUrl}/account/orders/${orderId}" 
         style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
        👁️ Urmărește Comanda
      </a>
    </div>
    
    <p style="font-size: 16px; text-align: center; margin-top: 32px;">Îți mulțumim că ai ales ${storeSettings.storeName}!<br><strong>Echipa ${storeSettings.storeName}</strong></p>
  `;

  const html = generateEmailHTML(content, storeSettings, "Comanda confirmată");

  return sendMail({
    to,
    subject: `✅ Comanda #${orderId} confirmată - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}

/**
 * Shipping notification email
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

  const content = `
    ${generateEmailHeader(storeSettings)}
    
    <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">🚚 Comanda ta este în drum!</h1>
    
    <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${customerName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Vestea bună! Comanda ta <strong>#${orderId}</strong> a fost expediată și este în drum către tine.</p>
    
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 16px 0; text-align: center;">📋 Detalii expediere</h3>
      <div style="text-align: center;">
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Numărul de urmărire:</strong></p>
        <p style="margin: 0 0 16px 0; font-family: monospace; font-size: 18px; font-weight: 700; color: #3b82f6; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 2px solid #bfdbfe;">${trackingNumber}</p>
        <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Curier:</strong> ${courierName}</p>
        <p style="margin: 0; color: #1f2937;"><strong>Livrare estimată:</strong> ${estimatedDelivery}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${baseUrl}/account/orders/${orderId}" 
         style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
        📦 Urmărește Pachetul
      </a>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #92400e; margin: 0 0 12px 0;">💡 Sfaturi pentru primirea pachetului:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #92400e;">
        <li style="margin-bottom: 8px;">Urmărește statusul coletului folosind numărul de urmărire</li>
        <li style="margin-bottom: 8px;">Asigură-te că cineva este prezent la adresa de livrare</li>
        <li style="margin-bottom: 8px;">Verifică conținutul pachetului la primire</li>
        <li style="margin-bottom: 8px;">Contactează-ne dacă întâmpini probleme cu livrarea</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; text-align: center; margin-top: 32px;">Îți mulțumim pentru încredere!<br><strong>Echipa ${storeSettings.storeName}</strong></p>
  `;

  const html = generateEmailHTML(content, storeSettings, "Comanda expediată");

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

  const content = `
    ${generateEmailHeader(storeSettings)}
    
    <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">🎉 Comanda ta a fost finalizată cu succes!</h1>
    
    <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${customerName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Comanda ta <strong>#${orderId}</strong> a fost finalizată cu succes pe data de <strong>${completedAt}</strong>. Mulțumim că ai ales ${storeSettings.storeName} pentru jucăriile STEM ale copilului tău!</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #047857; margin: 0 0 16px 0; text-align: center;">🛒 Detaliile comenzii tale</h3>
      
      ${orderItems
        .map(
          item => `
        <div style="border-bottom: 1px solid #d1fae5; padding: 12px 0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">` : ""}
            <div>
              <p style="margin: 0; font-weight: 600; color: #1f2937;">${item.name}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Cantitate: ${item.quantity}</p>
            </div>
          </div>
          <p style="margin: 0; font-weight: 600; color: #047857;">${formatPrice(item.price * item.quantity)} <span style="font-size: 12px; color: #6b7280;">(inclusiv TVA)</span></p>
        </div>
      `
        )
        .join("")}
      
      <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #047857;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #047857;">Total (inclusiv TVA): ${formatPrice(totalAmount)}</p>
      </div>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0;">📦 Informații de livrare:</h3>
      <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Adresa:</strong> ${shippingAddress}</p>
      <p style="margin: 0; color: #1f2937;"><strong>Status:</strong> <span style="color: #047857; font-weight: 600;">✅ Finalizată cu succes</span></p>
    </div>

    <!-- Review Request Section -->
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #92400e; margin: 0 0 12px 0; text-align: center;">⭐ Părerea ta contează pentru noi!</h3>
      <p style="margin: 0 0 16px 0; color: #92400e; text-align: center;">Ajută-ne să îmbunătățim experiența pentru alți părinți și să recomandăm produsele tale favorite.</p>
      <div style="text-align: center;">
        <a href="${baseUrl}/account/orders/${orderId}/review" 
           style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
          ✍️ Lasă un Review
        </a>
      </div>
    </div>

    <!-- Call to Action Buttons -->
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; margin: 0 8px;">
        <a href="${baseUrl}/account/orders/${orderId}" 
           style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
          👁️ Vezi Comanda
        </a>
      </div>
      <div style="display: inline-block; margin: 0 8px;">
        <a href="${baseUrl}/products" 
           style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
          🛍️ Vezi Produse Noi
        </a>
      </div>
    </div>

    <!-- Related Products Section -->
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1f2937; margin: 0 0 16px 0; text-align: center;">🚀 Produse Recomandate pentru Tine</h3>
      <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px; max-width: 250px; background: white; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 32px; margin-bottom: 8px;">🧩</div>
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">Puzzle-uri STEM</h4>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Dezvoltă logica și creativitatea</p>
          <a href="${baseUrl}/products?category=puzzles" 
             style="background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
            Vezi Colecția
          </a>
        </div>
        <div style="flex: 1; min-width: 200px; max-width: 250px; background: white; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 32px; margin-bottom: 8px;">🤖</div>
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">Roboți Educaționali</h4>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Introduce-te în lumea tehnologiei</p>
          <a href="${baseUrl}/products?category=robotics" 
             style="background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
            Vezi Colecția
          </a>
        </div>
        <div style="flex: 1; min-width: 200px; max-width: 250px; background: white; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e5e7eb;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔬</div>
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">Seturi de Experimente</h4>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Descoperă lumea științei</p>
          <a href="${baseUrl}/products?category=experiments" 
             style="background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
            Vezi Colecția
          </a>
        </div>
      </div>
    </div>

    <!-- Customer Support Section -->
    <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0;">💬 Ai întrebări sau nevoie de ajutor?</h3>
      <p style="margin: 0 0 16px 0; color: #1e40af;">
        Echipa noastră de suport este aici pentru tine! 
        <a href="${baseUrl}/contact" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Contactează-ne</a> 
        pentru orice întrebare despre produsele tale.
      </p>
      <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
        <a href="${baseUrl}/contact" 
           style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
          📞 Contact Suport
        </a>
        <a href="${baseUrl}/faq" 
           style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
          ❓ Întrebări Frecvente
        </a>
      </div>
    </div>
    
    <p style="font-size: 16px; text-align: center; margin-top: 32px;">
      Îți mulțumim că ai ales ${storeSettings.storeName}!<br>
      <strong>Echipa ${storeSettings.storeName}</strong><br>
      <span style="color: #6b7280; font-size: 14px;">Împreună construim viitorul prin educație STEM</span>
    </p>
  `;

  const html = generateEmailHTML(content, storeSettings, "Comanda finalizată");

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

  const content = `
    ${generateEmailHeader(storeSettings)}
    
    <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">📦 Comanda ta a fost livrată!</h1>
    
    <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${customerName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Comanda ta <strong>#${orderId}</strong> a fost livrată cu succes pe data de <strong>${deliveredAt}</strong>. Sperăm că totul este în regulă cu produsele primite!</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #047857; margin: 0 0 16px 0; text-align: center;">🛒 Detaliile comenzii tale</h3>
      ${orderItems
        .map(
          item => `
        <div style="border-bottom: 1px solid #d1fae5; padding: 12px 0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">` : ""}
            <div>
              <p style="margin: 0; font-weight: 600; color: #1f2937;">${item.name}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Cantitate: ${item.quantity}</p>
            </div>
          </div>
          <p style="margin: 0; font-weight: 600; color: #047857;">${formatPrice(item.price * item.quantity)} <span style="font-size: 12px; color: #6b7280;">(inclusiv TVA)</span></p>
        </div>
      `
        )
        .join("")}
      <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #047857;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #047857;">Total (inclusiv TVA): ${formatPrice(totalAmount)}</p>
      </div>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0;">📦 Informații de livrare:</h3>
      <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Adresa:</strong> ${shippingAddress}</p>
      <p style="margin: 0; color: #1f2937;"><strong>Livrat la data:</strong> ${deliveredAt}</p>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #92400e; margin: 0 0 12px 0;">💬 Feedback:</h3>
      <p style="margin: 0 0 8px 0; color: #92400e;">Te rugăm să ne spui dacă totul a fost în regulă cu comanda ta sau dacă ai întâmpinat probleme. Părerea ta contează pentru noi!</p>
      <div style="text-align: center; margin-top: 16px;">
        <a href="${baseUrl}/account/orders/${orderId}/review" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Lasă un review</a>
      </div>
    </div>
    
    <p style="font-size: 16px; text-align: center; margin-top: 32px;">Îți mulțumim că ai ales ${storeSettings.storeName}!<br><strong>Echipa ${storeSettings.storeName}</strong></p>
  `;

  const html = generateEmailHTML(content, storeSettings, "Comanda livrată");

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

  const content = `
    ${generateEmailHeader(storeSettings)}
    
    <h1 style="color: #1f2937; margin-bottom: 24px; text-align: center; font-size: 28px; font-weight: 700;">❌ Comanda anulată</h1>
    
    <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong>${customerName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Comanda ta <strong>#${orderId}</strong> a fost anulată pe data de <strong>${cancelledAt}</strong>.</p>
    
    ${
      cancellationReason
        ? `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #dc2626; margin: 0 0 12px 0;">📝 Motivul anulării:</h3>
      <p style="margin: 0; color: #1f2937; font-style: italic;">"${cancellationReason}"</p>
    </div>
    `
        : ""
    }
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #047857; margin: 0 0 16px 0; text-align: center;">🛒 Detaliile comenzii anulate</h3>
      
      ${orderItems
        .map(
          item => `
        <div style="border-bottom: 1px solid #d1fae5; padding: 12px 0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">` : ""}
            <div>
              <p style="margin: 0; font-weight: 600; color: #1f2937;">${item.name}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Cantitate: ${item.quantity}</p>
            </div>
          </div>
          <p style="margin: 0; font-weight: 600; color: #047857;">${formatPrice(item.price * item.quantity)} <span style="font-size: 12px; color: #6b7280;">(inclusiv TVA)</span></p>
        </div>
      `
        )
        .join("")}
      
      <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #047857;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #047857;">Total (inclusiv TVA): ${formatPrice(totalAmount)}</p>
      </div>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0;">💳 Informații despre rambursare:</h3>
      <p style="margin: 0 0 8px 0; color: #1f2937;">Dacă ai plătit comanda, rambursarea va fi procesată în următoarele 3-5 zile lucrătoare.</p>
      <p style="margin: 0; color: #1f2937;">Rambursarea va fi făcută pe metoda de plată folosită la comandă.</p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${baseUrl}/products" 
         style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
        🛍️ Vezi Produsele Noastre
      </a>
    </div>
    
    <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
      <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: 600;">❓ Ai întrebări?</p>
      <p style="margin: 0; color: #1e40af;">
        Echipa noastră de suport este aici pentru tine! 
        <a href="${baseUrl}/contact" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Contactează-ne</a> 
        dacă ai nevoie de ajutor.
      </p>
    </div>
    
    <p style="font-size: 16px; text-align: center; margin-top: 32px;">Îți mulțumim pentru înțelegere!<br><strong>Echipa ${storeSettings.storeName}</strong></p>
  `;

  const html = generateEmailHTML(content, storeSettings, "Comanda anulată");

  return sendMail({
    to,
    subject: `❌ Comanda #${orderId} a fost anulată - ${storeSettings.storeName}`,
    html,
    params: { email: to },
  });
}
