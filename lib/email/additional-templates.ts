/**
 * Additional Email Templates
 *
 * Additional templates for admin notifications, returns, digital products, and password reset
 */

import { appConfig } from "@/lib/config/app-config";

export const ADDITIONAL_EMAIL_TEMPLATES = [
  {
    id: "order-awaiting-payment",
    name: "Order Awaiting Payment",
    slug: "order-awaiting-payment",
    subject: "Finalizează plata pentru comanda #{{order.number}} - TechTots",
    content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comandă în așteptarea plății</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                ⏳ Comanda așteaptă plata
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>

        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}!
            </h2>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Am creat comanda ta, dar plata prin <strong>{{paymentMethodLabel}}</strong> nu a fost încă finalizată.
                Dacă ai terminat deja plata, poți ignora acest email. Dacă nu, redeschide comanda și finalizează plata când dorești.
            </p>

            <div style="background-color: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #9a3412; margin: 0 0 15px 0; font-size: 18px;">
                    📋 Rezumat comandă
                </h3>
                <p style="margin: 0 0 10px 0; color: #7c2d12;">
                    <strong>Număr comandă:</strong> #{{order.number}}
                </p>
                <p style="margin: 0 0 10px 0; color: #7c2d12;">
                    <strong>Total:</strong> {{order.total}}
                </p>
                <p style="margin: 0; color: #7c2d12;">
                    <strong>Status:</strong> În așteptarea plății
                </p>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 18px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.6;">
                    Poți relua plata în siguranță din contul tău. Nu este nevoie să refaci comanda.
                </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{{orderUrl}}"
                   style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                    Finalizează plata
                </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Dacă întâmpini probleme, răspunde la acest email sau contactează-ne la
                <a href="mailto:${appConfig.supportEmail}" style="color: #2563eb; text-decoration: none;">${appConfig.supportEmail}</a>.
            </p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong><br>
                ${appConfig.fullAddress} | ${appConfig.storePhoneFormatted}
            </p>
        </div>
    </div>
</body>
</html>`,
    variables: [
      "customerName",
      "order.number",
      "order.total",
      "paymentMethodLabel",
      "orderUrl",
    ],
    category: "orders",
    isActive: true,
    createdBy: "system",
    metadata: {
      tags: ["order", "payment", "pending"],
      priority: 1,
      estimatedOpenRate: 0.9,
      description: "Notifică clientul că o comandă a fost creată dar plata nu a fost finalizată încă",
    },
  },

  // ADMIN TEMPLATES
  {
    id: "admin-new-order",
    name: "Admin New Order Notification",
    slug: "admin-new-order",
    subject: "🛒 Comandă nouă #{{order.number}} - TechTots Admin",
    content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comandă nouă - Admin</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🛒 Comandă nouă
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Notificare comandă nouă! 📦
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                A fost plasată o comandă nouă pe platforma TechTots. Detaliile comenzii sunt prezentate mai jos.
            </p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    📋 Detalii comandă
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <strong style="color: #374151;">Număr comandă:</strong><br>
                        <span style="color: #1f2937;">#{{order.number}}</span>
                    </div>
                    <div>
                        <strong style="color: #374151;">Client:</strong><br>
                        <span style="color: #1f2937;">{{customerName}}</span>
                    </div>
                    <div>
                        <strong style="color: #374151;">Email client:</strong><br>
                        <span style="color: #1f2937;">{{customerEmail}}</span>
                    </div>
                    <div>
                        <strong style="color: #374151;">Total:</strong><br>
                        <span style="color: #1f2937; font-weight: 700;">{{order.total}} RON</span>
                    </div>
                </div>
            </div>
            
            <div style="background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #01579b; margin: 0 0 10px 0; font-size: 18px;">
                    🛍️ Produse comandate
                </h3>
                {{#each orderItems}}
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #1f2937;">{{this.name}}</strong><br>
                            <span style="color: #6b7280; font-size: 14px;">Cantitate: {{this.quantity}}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #1f2937; font-weight: 600;">{{this.price}} RON</span>
                        </div>
                    </div>
                </div>
                {{/each}}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{adminUrl}}/orders/{{order.number}}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    📊 Vezi comanda în admin
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Admin Panel<br>
                ${appConfig.fullAddress} | ${appConfig.storePhoneFormatted}
            </p>
        </div>
    </div>
</body>
</html>`,
    variables: [
      "order.number",
      "customerName",
      "customerEmail",
      "order.total",
      "orderItems",
      "adminUrl",
    ],
    category: "admin",
    isActive: true,
    createdBy: "system",
    metadata: {
      tags: ["admin", "order", "notification"],
      priority: 1,
      estimatedOpenRate: 0.95,
      description: "Notificare comandă nouă pentru admin",
    },
  },

  {
    id: "admin-high-value-order",
    name: "Admin High Value Order Notification",
    slug: "admin-high-value-order",
    subject: "💰 Comandă de valoare mare #{{order.number}} - TechTots Admin",
    content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comandă de valoare mare - Admin</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                💰 Comandă de valoare mare!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}} - {{order.total}} RON
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Atenție! Comandă de valoare mare! 🚨
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                A fost plasată o comandă cu valoare mare pe platforma TechTots. Această comandă necesită atenție specială.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">
                    ⚠️ Acțiuni recomandate
                </h3>
                <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>Verifică disponibilitatea produselor</li>
                    <li>Contactează clientul pentru confirmare</li>
                    <li>Pregătește ambalarea specială</li>
                    <li>Planifică livrarea cu asigurare</li>
                </ul>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    📊 Detalii comandă
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <strong style="color: #374151;">Număr comandă:</strong><br>
                        <span style="color: #1f2937;">#{{order.number}}</span>
                    </div>
                    <div>
                        <strong style="color: #374151;">Client:</strong><br>
                        <span style="color: #1f2937;">{{customerName}}</span>
                    </div>
                    <div>
                        <strong style="color: #374151;">Email client:</strong><br>
                        <span style="color: #1f2937;">{{customerEmail}}</span>
                    </div>
                    <div>
                        <strong style="color: #374151;">Total:</strong><br>
                        <span style="color: #1f2937; font-weight: 700; font-size: 18px;">{{order.total}} RON</span>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{adminUrl}}/orders/{{order.number}}" 
                   style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                    📊 Vezi comanda în admin
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Admin Panel<br>
                ${appConfig.fullAddress} | ${appConfig.storePhoneFormatted}
            </p>
        </div>
    </div>
</body>
</html>`,
    variables: [
      "order.number",
      "customerName",
      "customerEmail",
      "order.total",
      "adminUrl",
    ],
    category: "admin",
    isActive: true,
    createdBy: "system",
    metadata: {
      tags: ["admin", "high-value", "order", "priority"],
      priority: 1,
      estimatedOpenRate: 0.98,
      description: "Notificare comandă de valoare mare pentru admin",
    },
  },

  // RETURN TEMPLATES
  {
    id: "return-request-confirmation",
    name: "Return Request Confirmation",
    slug: "return-request-confirmation",
    subject: "Confirmare cerere de returnare #{{returnId}} - TechTots",
    content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmare cerere returnare</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🔄 Cerere de returnare confirmată
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Cerere #{{returnId}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Am primit cererea ta de returnare și o procesăm. Vei primi o notificare când cererea va fi aprobată.
            </p>
            
            <div style="background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #01579b; margin: 0 0 10px 0; font-size: 18px;">
                    📋 Detalii cerere
                </h3>
                <p style="color: #01579b; margin: 5px 0;"><strong>Număr cerere:</strong> #{{returnId}}</p>
                <p style="color: #01579b; margin: 5px 0;"><strong>Comanda:</strong> #{{order.number}}</p>
                <p style="color: #01579b; margin: 5px 0;"><strong>Motivul:</strong> {{reason}}</p>
                <p style="color: #01579b; margin: 5px 0;"><strong>Data:</strong> {{requestDate}}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    📦 Următorii pași
                </h3>
                <ol style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>Analizăm cererea (1-2 zile lucrătoare)</li>
                    <li>Te notificăm despre aprobare/respingere</li>
                    <li>Dacă este aprobată, primești instrucțiuni de returnare</li>
                    <li>Procesăm rambursarea după primirea produsului</li>
                </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/account/returns/{{returnId}}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    📋 Vezi cererea
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                ${appConfig.fullAddress} | ${appConfig.storePhoneFormatted}
            </p>
        </div>
    </div>
</body>
</html>`,
    variables: [
      "customerName",
      "returnId",
      "order.number",
      "reason",
      "requestDate",
      "siteUrl",
    ],
    category: "returns",
    isActive: true,
    createdBy: "system",
    metadata: {
      tags: ["return", "confirmation", "customer"],
      priority: 1,
      estimatedOpenRate: 0.9,
      description: "Confirmare cerere de returnare",
    },
  },

  // DIGITAL PRODUCT TEMPLATES
  {
    id: "digital-product-delivery",
    name: "Digital Product Delivery",
    slug: "digital-product-delivery",
    subject: "📚 Produsul digital este gata! - TechTots",
    content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Produs digital livrat</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📚 Produsul digital este gata!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                {{productName}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 🎉
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Produsul digital pe care l-ai comandat este gata pentru descărcare! Poți accesa conținutul folosind linkurile de mai jos.
            </p>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">
                    📖 Detalii produs
                </h3>
                <p style="color: #1e40af; margin: 5px 0;"><strong>Nume:</strong> {{productName}}</p>
                <p style="color: #1e40af; margin: 5px 0;"><strong>Autor:</strong> {{author}}</p>
                <p style="color: #1e40af; margin: 5px 0;"><strong>Format:</strong> {{format}}</p>
                <p style="color: #1e40af; margin: 5px 0;"><strong>Mărime:</strong> {{fileSize}}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    🔗 Linkuri de descărcare
                </h3>
                {{#each downloadLinks}}
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #1f2937;">{{format}}</strong><br>
                            <span style="color: #6b7280; font-size: 14px;">{{language}}</span>
                        </div>
                        <div>
                            <a href="{{url}}" 
                               style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                                📥 Descarcă
                            </a>
                        </div>
                    </div>
                </div>
                {{/each}}
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Important:</strong> Linkurile de descărcare expiră în {{expiryDays}} zile. 
                    Descarcă produsul cât mai curând posibil.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/account/digital-library" 
                   style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                    📚 Biblioteca digitală
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                ${appConfig.fullAddress} | ${appConfig.storePhoneFormatted}
            </p>
        </div>
    </div>
</body>
</html>`,
    variables: [
      "customerName",
      "productName",
      "author",
      "format",
      "fileSize",
      "downloadLinks",
      "expiryDays",
      "siteUrl",
    ],
    category: "digital",
    isActive: true,
    createdBy: "system",
    metadata: {
      tags: ["digital", "download", "ebook", "delivery"],
      priority: 1,
      estimatedOpenRate: 0.95,
      description: "Livrare produs digital",
    },
  },

  // PASSWORD RESET TEMPLATES
  {
    id: "password-reset",
    name: "Password Reset",
    slug: "password-reset",
    subject: "Resetare parolă - TechTots",
    content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resetare parolă</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🔒 Resetare parolă
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                TechTots STEM Store
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Am primit o cerere de resetare a parolei pentru contul tău TechTots. 
                Dacă ai făcut această cerere, fă clic pe butonul de mai jos pentru a reseta parola.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" 
                   style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);">
                    🔑 Resetează parola
                </a>
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px;">
                    <strong>⚠️ Important:</strong> Acest link va expira în 1 oră din motive de securitate. 
                    Dacă nu ai cerut resetarea parolei, ignoră acest email.
                </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Dacă butonul nu funcționează, copiază și lipește acest link în browser:<br>
                <a href="{{resetLink}}" style="color: #3b82f6; word-break: break-all;">{{resetLink}}</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                ${appConfig.fullAddress} | ${appConfig.storePhoneFormatted}
            </p>
        </div>
    </div>
</body>
</html>`,
    variables: ["resetLink"],
    category: "authentication",
    isActive: true,
    createdBy: "system",
    metadata: {
      tags: ["password", "reset", "security", "authentication"],
      priority: 1,
      estimatedOpenRate: 0.8,
      description: "Email pentru resetarea parolei",
    },
  },
];
