import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createCompleteEcommerceTemplates() {
  console.log(
    "🏪 Crearea șabloanelor esențiale pentru e-commerce complet...\n"
  );

  const essentialTemplates = [
    // ===== AUTHENTICATION & ACCOUNT =====
    {
      name: "Confirmare Cont",
      slug: "account-verification",
      category: "authentication",
      subject: "Confirmă-ți contul TechTots - Link de verificare",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Confirmă-ți contul</h1>

          <p>Bună {{user.name}},</p>

          <p>Mulțumim că te-ai înregistrat la TechTots! Pentru a activa contul tău, te rugăm să confirmi adresa de email.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Confirmă Email-ul</a>
          </div>

          <p>Link-ul este valabil timp de 24 de ore.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: ["user.name", "verificationUrl"],
      isActive: true,
    },

    {
      name: "Resetare Parolă",
      slug: "password-reset",
      category: "authentication",
      subject: "Resetare parolă - TechTots STEM Store",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Resetare Parolă</h1>

          <p>Bună {{user.name}},</p>

          <p>Am primit o cerere de resetare a parolei pentru contul tău TechTots.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Resetează Parola</a>
          </div>

          <p>Dacă nu ai solicitat această resetare, ignoră acest email.</p>
          <p>Link-ul este valabil timp de 1 oră.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: ["user.name", "resetUrl"],
      isActive: true,
    },

    // ===== ORDER MANAGEMENT =====
    {
      name: "Confirmare Comandă",
      slug: "order-confirmation",
      category: "orders",
      subject: "Confirmare comandă #{{order.number}} - TechTots",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Comanda ta a fost confirmată! 🎉</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Mulțumim pentru comanda ta! Iată detaliile:</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalii Comandă #{{order.number}}</h3>
            <p><strong>Data:</strong> {{order.date}}</p>
            <p><strong>Status:</strong> Confirmată</p>
            <p><strong>Total:</strong> {{order.total}} RON</p>
          </div>

          <p>Vei primi actualizări despre statusul comenzii tale.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "order.date",
        "order.total",
      ],
      isActive: true,
    },

    {
      name: "Comandă Expediată",
      slug: "order-shipped",
      category: "orders",
      subject: "Comanda ta #{{order.number}} a fost expediată! 📦",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Comanda ta a fost expediată! 🚚</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Buna veste! Comanda ta #{{order.number}} a fost expediată și este în drum spre tine.</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📦 Detalii Livrare</h3>
            <p><strong>Curier:</strong> {{order.shipping.carrier}}</p>
            <p><strong>Număr AWB:</strong> {{order.shipping.trackingNumber}}</p>
            <p><strong>Timp estimat:</strong> {{order.shipping.deliveryEstimate}}</p>
          </div>

          <p>Poți urmări comanda aici: <a href="{{trackingUrl}}" style="color: #2563eb;">{{trackingUrl}}</a></p>

          <p>Întrebări? Suntem aici să te ajutăm!</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "order.shipping.carrier",
        "order.shipping.trackingNumber",
        "order.shipping.deliveryEstimate",
        "trackingUrl",
      ],
      isActive: true,
    },

    {
      name: "Comandă Livrată",
      slug: "order-delivered",
      category: "orders",
      subject: "Comanda ta #{{order.number}} a fost livrată! ✅",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Comanda ta a fost livrată! 🎉</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Sperăm că ești mulțumit de jucăriile STEM primite! Comanda #{{order.number}} a fost livrată cu succes.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{reviewUrl}}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Lasă o Recenzie ⭐</a>
          </div>

          <p>Îți mulțumim că ai ales TechTots! Te așteptăm înapoi curând.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: ["order.customerName", "order.number", "reviewUrl"],
      isActive: true,
    },

    {
      name: "Plată Reușită",
      slug: "payment-successful",
      category: "orders",
      subject: "Plată confirmată pentru comanda #{{order.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Plată Confirmată ✅</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Plata pentru comanda #{{order.number}} a fost procesată cu succes.</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>💳 Detalii Plată</h3>
            <p><strong>Sumă:</strong> {{payment.amount}} RON</p>
            <p><strong>Metodă:</strong> {{payment.method}}</p>
            <p><strong>Data:</strong> {{payment.date}}</p>
            <p><strong>ID Tranzacție:</strong> {{payment.transactionId}}</p>
          </div>

          <p>Vei primi confirmarea comenzii în scurt timp.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "payment.amount",
        "payment.method",
        "payment.date",
        "payment.transactionId",
      ],
      isActive: true,
    },

    {
      name: "Plată Eșuată",
      slug: "payment-failed",
      category: "orders",
      subject: "Problemă cu plata comenzii #{{order.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">Problemă cu Plata</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Din păcate, plata pentru comanda #{{order.number}} nu a putut fi procesată.</p>

          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>❌ Motiv</h3>
            <p>{{payment.error}}</p>
          </div>

          <p>Te rugăm să încerci din nou sau să contactezi banca pentru verificare.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{retryPaymentUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reîncearcă Plata</a>
          </div>

          <p>Întrebări? Contactează-ne la support@techtots.ro</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "payment.error",
        "retryPaymentUrl",
      ],
      isActive: true,
    },

    // ===== SHIPPING & DELIVERY =====
    {
      name: "Confirmare Livrare",
      slug: "shipping-confirmation",
      category: "shipping",
      subject: "Comanda ta #{{order.number}} va fi livrată {{deliveryDate}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Confirmare Livrare 📅</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Comanda ta #{{order.number}} va fi livrată {{deliveryDate}}.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📦 Detalii Livrare</h3>
            <p><strong>Adresă:</strong> {{order.shipping.address}}</p>
            <p><strong>Interval orar:</strong> {{order.shipping.timeSlot}}</p>
            <p><strong>Contact:</strong> {{order.shipping.contact}}</p>
          </div>

          <p>Pregătește-te să primești jucăriile STEM! 🎉</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "deliveryDate",
        "order.shipping.address",
        "order.shipping.timeSlot",
        "order.shipping.contact",
      ],
      isActive: true,
    },

    {
      name: "Întârziere Livrare",
      slug: "shipping-delay",
      category: "shipping",
      subject: "Întârziere temporară pentru comanda #{{order.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b; text-align: center;">Întârziere Temporară ⏰</h1>

          <p>Bună {{order.customerName}},</p>

          <p>Din cauza unor circumstanțe neprevăzute, livrarea comenzii #{{order.number}} va fi întârziată.</p>

          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📅 Noua Estimare</h3>
            <p><strong>Data nouă:</strong> {{newDeliveryDate}}</p>
            <p><strong>Motiv:</strong> {{delayReason}}</p>
          </div>

          <p>Îți cerem scuze pentru inconveniență. Pentru orice întrebări, contactează-ne.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "order.customerName",
        "order.number",
        "newDeliveryDate",
        "delayReason",
      ],
      isActive: true,
    },

    // ===== CUSTOMER SERVICE =====
    {
      name: "Răspuns Formular Contact",
      slug: "contact-form-response",
      category: "support",
      subject: "Am primit mesajul tău - TechTots Support",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Am Primit Mesajul Tău 💬</h1>

          <p>Bună {{contact.name}},</p>

          <p>Mulțumim că ne-ai contactat! Am primit mesajul tău și îți vom răspunde în maximum 24 de ore.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📝 Detaliile Mesajului Tău</h3>
            <p><strong>Subiect:</strong> {{contact.subject}}</p>
            <p><strong>Data:</strong> {{contact.date}}</p>
            <p><strong>ID Ticket:</strong> #{{ticket.number}}</p>
          </div>

          <p>Pentru urgențe, sună-ne la +40 771 248 029.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "contact.name",
        "contact.subject",
        "contact.date",
        "ticket.number",
      ],
      isActive: true,
    },

    {
      name: "Actualizare Ticket Suport",
      slug: "support-ticket-update",
      category: "support",
      subject: "Actualizare ticket suport #{{ticket.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Actualizare Ticket Suport 🔄</h1>

          <p>Bună {{ticket.customerName}},</p>

          <p>Avem o actualizare pentru ticket-ul tău #{{ticket.number}}.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>{{ticket.status}}</h3>
            <p>{{ticket.update}}</p>
            <p><strong>Actualizat de:</strong> {{ticket.agent}}</p>
            <p><strong>Data:</strong> {{ticket.updateDate}}</p>
          </div>

          <p>Dacă ai întrebări suplimentare, răspunde la acest email.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "ticket.customerName",
        "ticket.number",
        "ticket.status",
        "ticket.update",
        "ticket.agent",
        "ticket.updateDate",
      ],
      isActive: true,
    },

    // ===== MARKETING & PROMOTIONS =====
    {
      name: "Abonare Newsletter",
      slug: "newsletter-subscription",
      category: "marketing",
      subject: "Bun venit în comunitatea TechTots! 📰",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Bun Venit în Newsletter! 📰</h1>

          <p>Bună {{subscriber.name}},</p>

          <p>Mulțumim că te-ai abonat la newsletter-ul TechTots! Vei primi:</p>

          <ul>
            <li>🔬 Noutăți despre jucării STEM</li>
            <li>🎁 Oferte exclusive pentru abonați</li>
            <li>💡 Sfaturi și activități educaționale</li>
            <li>🚀 Lansări de produse noi</li>
          </ul>

          <p>Primul nostru newsletter va sosi în curând!</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: ["subscriber.name"],
      isActive: true,
    },

    {
      name: "Ofertă Promotională",
      slug: "promotional-offer",
      category: "marketing",
      subject: "{{offer.title}} - Ofertă Limitată! ⏰",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">{{offer.title}} 🔥</h1>

          <p>Bună {{customer.name}},</p>

          <p>{{offer.description}}</p>

          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0; font-size: 24px;">{{offer.discount}}</h2>
            <p style="margin: 10px 0; font-size: 16px;">{{offer.validUntil}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{offer.url}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Profită de Ofertă</a>
          </div>

          <p>Oferta este valabilă până {{offer.expiryDate}}.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "customer.name",
        "offer.title",
        "offer.description",
        "offer.discount",
        "offer.validUntil",
        "offer.url",
        "offer.expiryDate",
      ],
      isActive: true,
    },

    {
      name: "Lansare Produs Nou",
      slug: "new-product-launch",
      category: "marketing",
      subject: "🚀 Descoperă {{product.name}} - Noul nostru produs STEM!",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Produs Nou Lansat! 🚀</h1>

          <p>Bună {{customer.name}},</p>

          <p>Suntem încântați să îți prezentăm cel mai nou produs STEM:</p>

          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h2 style="color: #2563eb; margin: 0;">{{product.name}}</h2>
            <p style="font-size: 18px; margin: 10px 0;">{{product.price}} RON</p>
            <p>{{product.description}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{product.url}}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Vezi Produsul</a>
          </div>

          <p>Primii 50 de clienți primesc {{product.bonus}} cadou!</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "customer.name",
        "product.name",
        "product.price",
        "product.description",
        "product.url",
        "product.bonus",
      ],
      isActive: true,
    },

    // ===== REVIEWS & FEEDBACK =====
    {
      name: "Cerere Recenzie",
      slug: "review-request",
      category: "reviews",
      subject: "Cum a fost experiența cu TechTots? Lasă o recenzie ⭐",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Recenzia Ta Contează! ⭐</h1>

          <p>Bună {{customer.name}},</p>

          <p>Sperăm că ai fost mulțumit de cumpărăturile tale de la TechTots!</p>

          <p>Recenziile tale ne ajută să ne îmbunătățim și să oferim cele mai bune jucării STEM.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{reviewUrl}}" style="background: #fbbf24; color: #92400e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Lasă Recenzie ⭐⭐⭐⭐⭐</a>
          </div>

          <p>Mulțumim pentru timpul acordat!</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: ["customer.name", "reviewUrl"],
      isActive: true,
    },

    // ===== RETURNS & EXCHANGES =====
    {
      name: "Confirmare Cerere Returnare",
      slug: "return-request-confirmation",
      category: "returns",
      subject: "Am primit cererea ta de returnare #{{return.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Cerere Returnare Primită 📋</h1>

          <p>Bună {{customer.name}},</p>

          <p>Am primit cererea ta de returnare pentru comanda #{{order.number}}.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalii Returnare #{{return.number}}</h3>
            <p><strong>Status:</strong> În Procesare</p>
            <p><strong>Data cerere:</strong> {{return.date}}</p>
            <p><strong>Motiv:</strong> {{return.reason}}</p>
          </div>

          <p>Procesul de returnare durează de obicei 3-5 zile lucrătoare.</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "customer.name",
        "order.number",
        "return.number",
        "return.date",
        "return.reason",
      ],
      isActive: true,
    },

    {
      name: "Returnare Aprobată",
      slug: "return-approved",
      category: "returns",
      subject: "Returnarea #{{return.number}} a fost aprobată ✅",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981; text-align: center;">Returnare Aprobată ✅</h1>

          <p>Bună {{customer.name}},</p>

          <p>Buna veste! Cererea ta de returnare #{{return.number}} a fost aprobată.</p>

          <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📦 Instrucțiuni Returnare</h3>
            <p><strong>Adresă:</strong> {{return.address}}</p>
            <p><strong>AWB Returnare:</strong> {{return.label}}</p>
            <p><strong>Termen Limită:</strong> {{return.deadline}}</p>
          </div>

          <p>Te rugăm să expediezi produsul în ambalajul original.</p>

          <p>Întrebări? Contactează-ne la support@techtots.ro</p>

          <p>Cu stimă,<br>Echipa TechTots</p>
        </div>
      `,
      variables: [
        "customer.name",
        "return.number",
        "return.address",
        "return.label",
        "return.deadline",
      ],
      isActive: true,
    },

    // ===== ADMIN NOTIFICATIONS =====
    {
      name: "Admin - Comandă Nouă",
      slug: "admin-new-order",
      category: "admin",
      subject: "🛒 Comandă nouă #{{order.number}} - Alertă Admin",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">Comandă Nouă! 🛒</h1>

          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Detalii Comandă #{{order.number}}</h2>
            <p><strong>Client:</strong> {{order.customerName}} ({{order.customerEmail}})</p>
            <p><strong>Total:</strong> {{order.total}} RON</p>
            <p><strong>Data:</strong> {{order.date}}</p>
            <p><strong>Status:</strong> {{order.status}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Vezi în Admin Panel</a>
          </div>

          <p>ACTION REQUIRED: Procesează comanda cât mai curând.</p>
        </div>
      `,
      variables: [
        "order.number",
        "order.customerName",
        "order.customerEmail",
        "order.total",
        "order.date",
        "order.status",
        "adminUrl",
      ],
      isActive: true,
    },

    {
      name: "Admin - Problemă Comandă",
      slug: "admin-order-issue",
      category: "admin",
      subject: "🚨 Problemă cu comanda #{{order.number}}",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; text-align: center;">ALERTĂ: Problemă Comandă 🚨</h1>

          <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Comanda #{{order.number}}</h2>
            <p><strong>Problemă:</strong> {{issue.type}}</p>
            <p><strong>Descriere:</strong> {{issue.description}}</p>
            <p><strong>Client:</strong> {{order.customerName}}</p>
            <p><strong>Prioritate:</strong> {{issue.priority}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminUrl}}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Rezolvă Problema</a>
          </div>

          <p>URGENT: Necesită intervenție imediată!</p>
        </div>
      `,
      variables: [
        "order.number",
        "issue.type",
        "issue.description",
        "order.customerName",
        "issue.priority",
        "adminUrl",
      ],
      isActive: true,
    },

    // ===== SEASONAL TEMPLATES =====
    {
      name: "Crăciun Special",
      slug: "christmas-special",
      category: "seasonal",
      subject: "🎄 Sărbători Fericite! Cadouri STEM pentru Familie",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎄 Sărbători Fericite!</h1>
            <p style="margin: 10px 0; font-size: 18px;">Crăciun Plin de Descoperiri STEM</p>
          </div>

          <div style="background: white; padding: 30px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Dragă {{customer.name}},</p>

            <p>Sărbătorile sunt momentul perfect pentru a aduce magie și învățare în casa voastră!</p>

            <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #b91c1c; margin-top: 0;">🎁 Oferte Speciale de Sărbători</h3>
              <ul style="color: #b91c1c;">
                <li>Reduceri până la 30% la pachetele STEM</li>
                <li>Cadou gratuit pentru comenzi peste 300 RON</li>
                <li>Livrare gratuită în toată țara</li>
                <li>Pachete speciale familie</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="{{christmasUrl}}" style="background: #b91c1c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Vezi Ofertele de Crăciun</a>
            </div>

            <p>Sărbători fericite și un An Nou plin de aventuri STEM! 🎅</p>

            <p>Cu drag,<br>Echipa TechTots România 🇷🇴</p>
          </div>
        </div>
      `,
      variables: ["customer.name", "christmasUrl"],
      isActive: true,
    },

    {
      name: "Ziua Mamei Special",
      slug: "mothers-day",
      category: "seasonal",
      subject: "🎗️ Ziua Mamei - Cadouri STEM pentru Mama Minunată",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 40px 20px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">🎗️ La Mulți Ani, Mamă!</h1>
            <p style="margin: 10px 0; font-size: 18px;">Cadouri STEM pentru Mama cea Mai Bună</p>
          </div>

          <div style="background: white; padding: 30px; border: 2px solid #ec4899; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Draga noastră {{customer.name}},</p>

            <p>Ziua Mamei este ocazia perfectă să-i arăți mamei tale cât de mult apreciezi tot ceea ce face!</p>

            <div style="background: #fdf2f8; border: 2px solid #fbcfe8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #be185d; margin-top: 0;">💝 Recomandări pentru Mama Ta</h3>
              <ul style="color: #be185d;">
                <li>Kit-uri de gătit științific</li>
                <li>Jocuri de logică și puzzle-uri</li>
                <li>Seturi de grădinărit educative</li>
                <li>Cărți STEM ilustrate</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="{{mothersDayUrl}}" style="background: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Vezi Cadourile pentru Mamă</a>
            </div>

            <p>Surprinde-o cu ceva special și educativ! 🌹</p>

            <p>Cu drag,<br>Echipa TechTots</p>
          </div>
        </div>
      `,
      variables: ["customer.name", "mothersDayUrl"],
      isActive: true,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const templateData of essentialTemplates) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: templateData.slug },
      });

      if (existing) {
        console.log(`⏭️  Șablon existent: ${templateData.name}`);
        skippedCount++;
        continue;
      }

      await prisma.emailTemplate.create({
        data: {
          ...templateData,
          createdBy: "system",
        },
      });

      console.log(`✅ Șablon creat: ${templateData.name}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Eroare creare șablon ${templateData.slug}:`, error);
    }
  }

  console.log(`\n🏪 Creare șabloane esențiale completată!`);
  console.log(`   • Create: ${createdCount} șabloane`);
  console.log(`   • Omise: ${skippedCount} existente`);
  console.log(
    `   • Total șabloane în DB: ${await prisma.emailTemplate.count()}`
  );

  // Final audit
  console.log(`\n📊 AUDIT FINAL:`);
  const finalTemplates = await prisma.emailTemplate.findMany({
    select: { category: true },
  });

  const finalStats = finalTemplates.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(finalStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} șabloane`);
    });

  console.log(`\n🎉 Sistemul de email este acum COMPLET pentru e-commerce!`);
}

createCompleteEcommerceTemplates()
  .catch(console.error)
  .finally(() => process.exit(0));
