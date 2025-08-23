import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateEmailTemplates() {
  console.log("🚀 Starting email templates migration...");

  try {
    // 1. Welcome Email Template
    const welcomeTemplate = await prisma.emailTemplate.upsert({
      where: { slug: "welcome-email" },
      update: {},
      create: {
        name: "Welcome Email",
        slug: "welcome-email",
        subject: "🎉 Bine ai venit la {{storeName}} - Primești 10% Reducere!",
        content: `
<div style="text-align: center; margin: 2rem 0;">
  <p style="font-size: 1.125rem; margin-bottom: 1rem; color: #374151;">
    Salut <strong style="color: #111827;">{{name}}</strong>,
  </p>
  <p style="font-size: 1rem; margin-bottom: 1.5rem; color: #4b5563; line-height: 1.625;">
    Îți mulțumim că ți-ai creat un cont la {{storeName}}. Suntem încântați să te avem în comunitatea noastră de minți curioase care explorează lumea jucăriilor STEM!
  </p>
</div>

<div style="background: #f8fafc; border-radius: 1rem; padding: 2rem; margin: 2rem 0; text-align: center;">
  <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600; color: #111827;">
    🎁 Bonus de Bun Venit
  </h3>
  <p style="margin: 0 0 1.5rem 0; font-size: 1rem; color: #4b5563;">
    Primești automat <strong style="color: #2563eb;">10% reducere</strong> la prima ta comandă!
  </p>
  <a href="{{baseUrl}}/products?welcome=10off" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block;">
    Folosește Reducerea
  </a>
</div>

<div style="text-align: center; margin: 3rem 0;">
  <p style="font-size: 1.125rem; color: #374151; margin-bottom: 1rem;">
    Cu respect și entuziasm,
  </p>
  <p style="font-size: 1.25rem; font-weight: 700; color: #2563eb; margin: 0;">
    Echipa {{storeName}}
  </p>
  <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
    Împreună construim viitorul prin educație STEM
  </p>
</div>`,
        category: "auth",
        isActive: true,
        variables: ["name", "storeName", "baseUrl"],
        createdBy: "system-migration",
      },
    });

    // 2. Email Verification Template
    const verificationTemplate = await prisma.emailTemplate.upsert({
      where: { slug: "email-verification" },
      update: {},
      create: {
        name: "Email Verification",
        slug: "email-verification",
        subject: "🔐 Verifică-ți Adresa de Email - {{storeName}}",
        content: `
<div style="text-align: center; margin: 2rem 0;">
  <p style="font-size: 1.125rem; margin-bottom: 1rem; color: #374151;">
    Salut <strong style="color: #111827;">{{name}}</strong>,
  </p>
  <p style="font-size: 1rem; margin-bottom: 1.5rem; color: #4b5563; line-height: 1.625;">
    Îți mulțumim că ți-ai creat un cont la {{storeName}}. Pentru a finaliza înregistrarea și a începe să explorezi colecția noastră de jucării educaționale STEM, te rugăm să îți verifici adresa de email.
  </p>
</div>

<div style="text-align: center; margin: 2rem 0;">
  <a href="{{verificationLink}}" style="background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block;">
    ✅ Verifică Adresa de Email
  </a>
</div>

<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.75rem; padding: 1.5rem; margin: 2rem 0;">
  <p style="margin: 0; color: #92400e; font-size: 0.875rem;">
    <strong>⚠️ Important:</strong><br>
    Acest link va expira în <strong>{{expiresIn}}</strong>. Dacă nu ți-ai creat un cont la {{storeName}}, te rugăm să ignori acest email.
  </p>
</div>

<div style="background: #f8fafc; border-radius: 1rem; padding: 1.5rem; margin: 2rem 0; border: 1px solid #e5e7eb;">
  <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; color: #374151; text-align: center;">
    🔗 Sau copiază și lipește acest link în browserul tău:
  </h3>
  <div style="background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
    <p style="word-break: break-all; color: #2563eb; margin: 0; font-family: monospace; font-size: 0.875rem;">
      {{verificationLink}}
    </p>
  </div>
</div>

<div style="text-align: center; margin: 3rem 0;">
  <p style="font-size: 1.125rem; color: #374151; margin-bottom: 1rem;">
    Cu respect,
  </p>
  <p style="font-size: 1.25rem; font-weight: 700; color: #2563eb; margin: 0;">
    Echipa {{storeName}}
  </p>
  <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
    Împreună construim viitorul prin educație STEM
  </p>
</div>`,
        category: "auth",
        isActive: true,
        variables: [
          "name",
          "storeName",
          "verificationLink",
          "expiresIn",
          "baseUrl",
        ],
        createdBy: "system-migration",
      },
    });

    // 3. Password Reset Template
    const passwordResetTemplate = await prisma.emailTemplate.upsert({
      where: { slug: "password-reset" },
      update: {},
      create: {
        name: "Password Reset",
        slug: "password-reset",
        subject: "🔑 Resetare parolă pentru contul tău - {{storeName}}",
        content: `
<div style="text-align: center; margin: 2rem 0;">
  <p style="font-size: 1rem; margin-bottom: 1.5rem; color: #4b5563; line-height: 1.625;">
    Am primit o solicitare de resetare a parolei pentru contul tău <strong style="color: #2563eb;">{{storeName}}</strong>.
  </p>
</div>

<div style="text-align: center; margin: 2rem 0;">
  <a href="{{resetLink}}" style="background: #dc2626; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block;">
    🔑 Resetează Parola
  </a>
</div>

<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.75rem; padding: 1.5rem; margin: 2rem 0;">
  <p style="margin: 0; color: #92400e; font-size: 0.875rem;">
    <strong>⚠️ Important:</strong><br>
    Acest link va expira în <strong>{{expiresIn}}</strong>. Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email și parola ta va rămâne neschimbată.
  </p>
</div>

<div style="background: #f8fafc; border-radius: 1rem; padding: 1.5rem; margin: 2rem 0; border: 1px solid #e5e7eb;">
  <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; color: #374151; text-align: center;">
    🔗 Sau copiază și lipește acest link în browserul tău:
  </h3>
  <div style="background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
    <p style="word-break: break-all; color: #2563eb; margin: 0; font-family: monospace; font-size: 0.875rem;">
      {{resetLink}}
    </p>
  </div>
</div>

<div style="background: #eff6ff; border-radius: 1rem; padding: 1.5rem; margin: 2rem 0; border: 1px solid #bfdbfe;">
  <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600; color: #1e40af; text-align: center;">
    💡 Sfat de Securitate
  </h3>
  <p style="margin: 0 0 1.5rem 0; font-size: 1rem; color: #1e40af; text-align: center; line-height: 1.625;">
    Alege o parolă puternică cu cel puțin 8 caractere, combinând litere mari și mici, numere și simboluri.
  </p>
</div>

<div style="text-align: center; margin: 3rem 0;">
  <p style="font-size: 1.125rem; color: #374151; margin-bottom: 1rem;">
    Echipa de securitate,
  </p>
  <p style="font-size: 1.25rem; font-weight: 700; color: #2563eb; margin: 0;">
    {{storeName}}
  </p>
  <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
    Protejăm datele tale cu cea mai mare atenție
  </p>
</div>`,
        category: "auth",
        isActive: true,
        variables: ["storeName", "resetLink", "expiresIn"],
        createdBy: "system-migration",
      },
    });

    // 4. Order Confirmation Template
    const orderConfirmationTemplate = await prisma.emailTemplate.upsert({
      where: { slug: "order-confirmation" },
      update: {},
      create: {
        name: "Order Confirmation",
        slug: "order-confirmation",
        subject: "🎉 Confirmare Comandă #{{orderId}} - {{storeName}}",
        content: `
<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2.5rem 1.875rem; text-align: center;">
  <h1 style="color: #ffffff; margin: 0; font-size: 1.75rem; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🎉 Confirmare Comandă</h1>
  <p style="margin: 0.5rem 0 0 0; font-size: 1rem; opacity: 0.9; color: #ffffff;">Îți mulțumim pentru încrederea acordată!</p>
</div>

<div style="padding: 2.5rem 1.875rem;">
  <p style="font-size: 1.125rem; color: #374151; margin-bottom: 1.25rem; line-height: 1.6;">Vă mulțumim pentru comanda dumneavoastră!</p>
  
  <!-- Order Summary Box -->
  <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 0.5rem; padding: 1.25rem; margin: 1.5rem 0;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <div>
        <p style="margin: 0; font-size: 1.125rem; font-weight: 700; color: #1f2937;">Comandă #{{orderId}}</p>
        <p style="margin: 0.25rem 0 0; color: #6b7280;">📅 {{orderDate}}</p>
      </div>
      <div style="text-align: right;">
        <span style="background-color: #10b981; color: white; padding: 0.375rem 0.75rem; border-radius: 1.25rem; font-size: 0.75rem; font-weight: 600;">CONFIRMATĂ</span>
      </div>
    </div>
    <p style="margin: 0; color: #1e40af;">Am primit comanda ta și o vom procesa în curând!</p>
  </div>
  
  <!-- Products Table -->
  <div style="margin: 2rem 0;">
    <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.125rem;">📦 Produse Comandate</h2>
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead style="background-color: #f9fafb;">
          <tr>
            <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Produs</th>
            <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Cantitate</th>
            <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Preț</th>
            <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{orderItems}}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Order Summary -->
  <div style="background-color: #f8fafc; border-radius: 0.5rem; padding: 1.5rem; margin: 2rem 0;">
    <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.125rem;">💰 Sumar Comandă</h2>
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: #4b5563;">Subtotal:</span>
      <span style="font-weight: 600; color: #1f2937;">{{subtotal}} Lei</span>
    </div>
    {{#if tax}}
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: #4b5563;">TVA ({{taxRatePercentage}}):</span>
      <span style="font-weight: 600; color: #1f2937;">{{tax}} Lei</span>
    </div>
    {{/if}}
    {{#if shippingCost}}
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: #4b5563;">Transport:</span>
      <span style="font-weight: 600; color: #1f2937;">{{shippingCost}} Lei</span>
    </div>
    {{/if}}
    {{#if discountAmount}}
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: #10b981;">Reducere {{#if couponCode}}({{couponCode}}){{/if}}:</span>
      <span style="font-weight: 600; color: #10b981;">-{{discountAmount}} Lei</span>
    </div>
    {{/if}}
    <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
      <span style="font-weight: 700; color: #1f2937; font-size: 1.125rem;">Total:</span>
      <span style="font-weight: 700; color: #1f2937; font-size: 1.125rem;">{{total}} Lei</span>
    </div>
  </div>

  {{#if shippingAddress}}
  <!-- Shipping Info -->
  <div style="margin-top: 2rem; border-top: 2px solid #e5e7eb; padding-top: 1.5rem;">
    <h2 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.125rem;">🚚 Informații Livrare</h2>
    <div style="background-color: #f8fafc; border-radius: 0.5rem; padding: 1rem;">
      <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #1f2937;">{{shippingAddress.fullName}}</p>
      <p style="margin: 0 0 0.25rem 0; color: #4b5563;">{{shippingAddress.addressLine1}}</p>
      {{#if shippingAddress.addressLine2}}
      <p style="margin: 0 0 0.25rem 0; color: #4b5563;">{{shippingAddress.addressLine2}}</p>
      {{/if}}
      <p style="margin: 0 0 0.25rem 0; color: #4b5563;">{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.postalCode}}</p>
      <p style="margin: 0 0 0.25rem 0; color: #4b5563;">{{shippingAddress.country}}</p>
      <p style="margin: 0; color: #4b5563;"><strong>📞 Telefon:</strong> {{shippingAddress.phone}}</p>
    </div>
  </div>
  {{/if}}

  <!-- CTA -->
  <div style="text-align: center; margin: 2rem 0;">
    <a href="{{baseUrl}}/account/orders/{{orderId}}" style="background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block; margin: 0 0.5rem;">
      📦 Urmărește Comanda
    </a>
    <a href="{{baseUrl}}/products" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block; margin: 0 0.5rem;">
      🛒 Continuă Cumpărăturile
    </a>
  </div>
</div>`,
        category: "orders",
        isActive: true,
        variables: [
          "orderId",
          "orderDate",
          "orderItems",
          "subtotal",
          "tax",
          "taxRatePercentage",
          "shippingCost",
          "discountAmount",
          "couponCode",
          "total",
          "shippingAddress",
          "baseUrl",
          "storeName",
        ],
        createdBy: "system-migration",
      },
    });

    console.log("✅ Successfully migrated email templates:");
    console.log(`   - Welcome Email (${welcomeTemplate.id})`);
    console.log(`   - Email Verification (${verificationTemplate.id})`);
    console.log(`   - Password Reset (${passwordResetTemplate.id})`);
    console.log(`   - Order Confirmation (${orderConfirmationTemplate.id})`);
  } catch (error) {
    console.error("❌ Error migrating email templates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateEmailTemplates()
  .then(() => {
    console.log("🎉 Email templates migration completed successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
