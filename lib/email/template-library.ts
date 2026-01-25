/**
 * Email Template Library
 *
 * Pre-built email templates for common use cases
 * These templates are optimized for deliverability and user engagement
 */

export interface EmailTemplate {
    id: string;
    name: string;
    slug: string;
    subject: string;
    content: string;
    variables: string[];
    category: string;
    isActive: boolean;
    createdBy: string;
    metadata?: {
        provider?: string;
        tags?: string[];
        priority?: number;
        estimatedOpenRate?: number;
        description?: string;
    };
}

import { ADDITIONAL_EMAIL_TEMPLATES } from "./additional-templates";

export const EMAIL_TEMPLATES: EmailTemplate[] = [
    // AUTHENTICATION TEMPLATES
    {
        id: "welcome-email",
        name: "Welcome Email",
        slug: "welcome",
        subject: "Bun venit la TechTots STEM Store! 🎉",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bun venit la TechTots!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 Bun venit la TechTots!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Jucării STEM pentru Minți Curioase
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{userName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Mulțumim că te-ai alăturat comunității noastre de entuziaști STEM! 
                Suntem încântați să te avem alături în călătoria de descoperire a științei și tehnologiei.
            </p>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">
                    🚀 Ce poți face acum:
                </h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>Explorează colecția noastră de jucării STEM</li>
                    <li>Configurează profilul tău și preferințele</li>
                    <li>Alătură-te newsletter-ului pentru oferte exclusive</li>
                    <li>Urmărește-ne pe rețelele sociale</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/products" 
                   style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    🛍️ Începe să cumperi
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong><br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: ["userName", "siteUrl"],
        category: "authentication",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["welcome", "onboarding", "authentication"],
            priority: 1,
            estimatedOpenRate: 0.85,
            description: "Email de bun venit pentru utilizatori noi",
        },
    },

    {
        id: "email-verification",
        name: "Email Verification",
        slug: "email-verification",
        subject: "Verifică-ți adresa de email - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifică-ți email-ul</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📧 Verifică-ți email-ul
            </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{userName}}!
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Pentru a finaliza înregistrarea contului tău, te rugăm să verifici adresa de email 
                făcând clic pe butonul de mai jos.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{verificationLink}}" 
                   style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                    ✅ Verifică email-ul
                </a>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Important:</strong> Acest link va expira în 24 de ore din motive de securitate.
                </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Dacă butonul nu funcționează, copiază și lipește acest link în browser:<br>
                <a href="{{verificationLink}}" style="color: #3b82f6; word-break: break-all;">{{verificationLink}}</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: ["userName", "verificationLink"],
        category: "authentication",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["verification", "authentication", "security"],
            priority: 1,
            estimatedOpenRate: 0.75,
            description: "Email pentru verificarea adresei de email",
        },
    },

    // ORDER TEMPLATES
    {
        id: "order-confirmation",
        name: "Order Confirmation",
        slug: "order-confirmation",
        subject: "Confirmare comandă #{{order.number}} - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmare comandă</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                ✅ Comanda confirmată!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Mulțumim pentru comandă, {{customerName}}! 🎉
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Am primit comanda ta și o procesăm acum. Vei primi un email de confirmare 
                când comanda va fi expediată.
            </p>
            
            <!-- Order Summary -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    📦 Detalii comandă
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <strong style="color: #374151;">Număr comandă:</strong><br>
                        <span style="color: #1f2937;">#{{order.number}}</span>
                    </div>
                    <div>
                        <strong style="color: #374151;">Data:</strong><br>
                        <span style="color: #1f2937;">{{orderDate}}</span>
                    </div>
                </div>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    {{#if order.subtotal}}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: #374151;">Subtotal produse:</span>
                        <span style="color: #1f2937;">{{order.subtotal}}</span>
                    </div>
                    {{/if}}
                    {{#if order.shippingCost}}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: #374151;">Transport:</span>
                        <span style="color: #1f2937;">{{order.shippingCost}}</span>
                    </div>
                    {{/if}}
                    {{#if order.discountAmount}}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: #16a34a;">Reducere aplicată:</span>
                        <span style="color: #16a34a; font-weight: 600;">-{{order.discountAmount}}</span>
                    </div>
                    {{/if}}
                    {{#if order.codFee}}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: #374151;">Taxă plată la livrare (ramburs):</span>
                        <span style="color: #1f2937;">{{order.codFee}}</span>
                    </div>
                    {{/if}}
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px solid #3b82f6; margin-top: 12px;">
                        <div>
                            <strong style="color: #1f2937; font-size: 18px;">Total de plată</strong>
                            <br><span style="color: #6b7280; font-size: 12px;">(TVA inclus în prețuri)</span>
                        </div>
                        <span style="color: #3b82f6; font-size: 24px; font-weight: 700;">{{order.total}}</span>
                    </div>
                </div>
            </div>
            
            <!-- Items -->
            <div style="margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    🛍️ Produse comandate
                </h3>
                {{#each items}}
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
                <a href="{{siteUrl}}/account/orders/{{order.number}}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    📋 Vezi comanda
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "order.number",
            "orderDate",
            "order.total",
            "items",
            "siteUrl",
        ],
        category: "orders",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["order", "confirmation", "ecommerce"],
            priority: 1,
            estimatedOpenRate: 0.9,
            description: "Email de confirmare pentru comenzi",
        },
    },

    // MARKETING TEMPLATES
    {
        id: "newsletter-welcome",
        name: "Newsletter Welcome",
        slug: "newsletter-welcome",
        subject: "Bun venit în comunitatea TechTots! 🚀",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter TechTots</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🚀 Bun venit în comunitatea TechTots!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Ultimele noutăți STEM direct în inbox-ul tău
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Mulțumim că te-ai abonat la newsletter-ul nostru! Ești acum parte din comunitatea 
                de părinți și educatori care își doresc să inspireze dragostea pentru știință și tehnologie.
            </p>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">
                    📧 Ce vei primi în newsletter:
                </h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>Noutăți despre jucării STEM noi</li>
                    <li>Ghiduri educaționale pentru părinți</li>
                    <li>Oferte exclusive și reduceri</li>
                    <li>Idei de activități științifice pentru acasă</li>
                    <li>Interviuri cu experți în educație STEM</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/products" 
                   style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                    🛍️ Explorează produsele
                </a>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>💡 Sfat:</strong> Adaugă adresa noastră în lista de contacte pentru a ne asigura 
                    că newsletter-ul ajunge în inbox-ul tău, nu în spam.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: underline;">Dezabonează-te</a> | 
                <a href="{{siteUrl}}/privacy" style="color: #6b7280; text-decoration: underline;">Politica de confidențialitate</a>
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: ["siteUrl", "unsubscribeUrl"],
        category: "marketing",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["newsletter", "welcome", "marketing"],
            priority: 2,
            estimatedOpenRate: 0.8,
            description: "Email de bun venit pentru newsletter",
        },
    },

    // AUTHENTICATION & SECURITY TEMPLATES
    {
        id: "password-change-confirmation",
        name: "Password Change Confirmation",
        slug: "password-change-confirmation",
        subject: "Parola a fost schimbată cu succes - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parola schimbată</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🔒 Parola schimbată cu succes
            </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{userName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Parola contului tău TechTots a fost schimbată cu succes la {{changeTime}}.
            </p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">
                    ✅ Schimbare confirmată
                </h3>
                <p style="color: #155724; margin: 0;">
                    Parola ta a fost actualizată cu succes. Contul tău este sigur.
                </p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    📱 Detalii despre schimbare
                </h3>
                <p style="color: #374151; margin: 5px 0;"><strong>Ora:</strong> {{changeTime}}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Dispozitiv:</strong> {{deviceInfo}}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>IP:</strong> {{ipAddress}}</p>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Important:</strong> Dacă nu ai făcut această schimbare, te rugăm să ne contactezi imediat la support@techtots.ro
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/account" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    🔐 Accesează contul
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: ["userName", "changeTime", "deviceInfo", "ipAddress", "siteUrl"],
        category: "authentication",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["password", "security", "authentication"],
            priority: 1,
            estimatedOpenRate: 0.95,
            description: "Confirmare schimbare parolă",
        },
    },

    {
        id: "new-device-login",
        name: "New Device Login Alert",
        slug: "new-device-login",
        subject: "Conectare de pe dispozitiv nou - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conectare dispozitiv nou</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📱 Conectare de pe dispozitiv nou
            </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{userName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Am detectat o conectare la contul tău TechTots de pe un dispozitiv nou la {{loginTime}}.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">
                    🔍 Detalii despre conectare
                </h3>
                <p style="color: #856404; margin: 5px 0;"><strong>Ora:</strong> {{loginTime}}</p>
                <p style="color: #856404; margin: 5px 0;"><strong>Dispozitiv:</strong> {{deviceInfo}}</p>
                <p style="color: #856404; margin: 5px 0;"><strong>Locație:</strong> {{location}}</p>
                <p style="color: #856404; margin: 5px 0;"><strong>IP:</strong> {{ipAddress}}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    ✅ Ești tu?
                </h3>
                <p style="color: #374151; margin: 0;">
                    Dacă ai fost tu care te-ai conectat, nu trebuie să faci nimic. 
                    Dacă nu recunoști această activitate, te rugăm să schimbi parola imediat.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/account/security" 
                   style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);">
                    🔒 Verifică securitatea
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "userName",
            "loginTime",
            "deviceInfo",
            "location",
            "ipAddress",
            "siteUrl",
        ],
        category: "authentication",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["security", "login", "device", "authentication"],
            priority: 1,
            estimatedOpenRate: 0.9,
            description: "Alertă conectare dispozitiv nou",
        },
    },

    // ORDER LIFECYCLE TEMPLATES
    {
        id: "order-processing",
        name: "Order Processing",
        slug: "order-processing",
        subject: "Comanda #{{order.number}} este în procesare - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comanda în procesare</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                ⚙️ Comanda în procesare
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Comanda ta a fost confirmată și este acum în procesare. Echipa noastră se ocupă de pregătirea comenzii pentru expediere.
            </p>
            
            <div style="background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #01579b; margin: 0 0 10px 0; font-size: 18px;">
                    📦 Statusul comenzii
                </h3>
                <p style="color: #01579b; margin: 0;">
                    <strong>În procesare</strong> - Pregătim produsele pentru expediere
                </p>
            </div>
            
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
                        <strong style="color: #374151;">Data comenzii:</strong><br>
                        <span style="color: #1f2937;">{{orderDate}}</span>
                    </div>
                </div>
                <div>
                    <strong style="color: #374151;">Livrare estimată:</strong><br>
                    <span style="color: #1f2937;">{{estimatedDelivery}}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/account/orders/{{order.number}}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    📋 Urmărește comanda
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "orderNumber",
            "orderDate",
            "estimatedDelivery",
            "siteUrl",
        ],
        category: "orders",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["order", "processing", "status"],
            priority: 1,
            estimatedOpenRate: 0.85,
            description: "Notificare comandă în procesare",
        },
    },

    {
        id: "order-shipped",
        name: "Order Shipped",
        slug: "order-shipped",
        subject: "Comanda #{{order.number}} a fost expediată! 🚚",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comanda expediată</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🚚 Comanda a fost expediată!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 🎉
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Comanda ta a fost expediată cu succes! Produsele sunt pe drum către tine.
            </p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">
                    📦 Informații despre expediere
                </h3>
                <p style="color: #155724; margin: 5px 0;"><strong>Număr de urmărire:</strong> {{trackingNumber}}</p>
                <p style="color: #155724; margin: 5px 0;"><strong>Curier:</strong> FanCourier</p>
                <p style="color: #155724; margin: 5px 0;"><strong>Data expedierii:</strong> {{shippingDate}}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    🚚 Urmărește-ți comanda
                </h3>
                <p style="color: #374151; margin: 0;">
                    Folosește numărul de urmărire pentru a vedea unde se află comanda ta în timp real.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.fancourier.ro/awb-tracking/?tracking={{trackingNumber}}" 
                   style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    🚚 Urmărește pe FanCourier
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "orderNumber",
            "trackingNumber",
            "carrier",
            "shippingDate",
            "trackingUrl",
        ],
        category: "orders",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["order", "shipped", "tracking"],
            priority: 1,
            estimatedOpenRate: 0.9,
            description: "Notificare comandă expediată",
        },
    },

    // ORDER LIFECYCLE TEMPLATES (CONTINUED)
    {
        id: "order-delivered",
        name: "Order Delivered",
        slug: "order-delivered",
        subject: "Comanda #{{order.number}} a fost livrată! 📦",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comanda livrată</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📦 Comanda a fost livrată!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 🎉
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Comanda ta a fost livrată cu succes! Sperăm că te vei bucura de produsele comandate.
            </p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">
                    ✅ Livrare confirmată
                </h3>
                <p style="color: #155724; margin: 5px 0;"><strong>Data livrării:</strong> {{deliveryDate}}</p>
                <p style="color: #155724; margin: 5px 0;"><strong>Status:</strong> Livrat cu succes</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    ⭐ Evaluează-ți experiența
                </h3>
                <p style="color: #374151; margin: 0;">
                    Ne-ar face plăcere să știm cum ți-a plăcut comanda! Evaluează produsele și experiența ta de cumpărare.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{reviewUrl}}" 
                   style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                    ⭐ Evaluează comanda
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "orderNumber",
            "deliveryDate",
            "reviewUrl",
            "siteUrl",
        ],
        category: "orders",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["order", "delivered", "review"],
            priority: 1,
            estimatedOpenRate: 0.85,
            description: "Notificare comandă livrată",
        },
    },

    {
        id: "order-cancelled",
        name: "Order Cancelled",
        slug: "order-cancelled",
        subject: "Comanda #{{order.number}} a fost anulată - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comanda anulată</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                ❌ Comanda a fost anulată
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Comanda ta a fost anulată. Înțelegem că poate fi dezamăgitor și ne cerem scuze pentru orice inconveniență.
            </p>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #721c24; margin: 0 0 10px 0; font-size: 18px;">
                    📋 Detalii despre anulare
                </h3>
                <p style="color: #721c24; margin: 5px 0;"><strong>Motivul anulării:</strong> {{cancellationReason}}</p>
                <p style="color: #721c24; margin: 5px 0;"><strong>Data anulării:</strong> {{cancellationDate}}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    💰 Informații despre rambursare
                </h3>
                <p style="color: #374151; margin: 0;">
                    {{refundInfo}} Dacă ai întrebări despre rambursare, te rugăm să ne contactezi.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/products" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    🛍️ Explorează produsele
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "orderNumber",
            "cancellationReason",
            "cancellationDate",
            "refundInfo",
            "siteUrl",
        ],
        category: "orders",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["order", "cancelled", "refund"],
            priority: 1,
            estimatedOpenRate: 0.9,
            description: "Notificare comandă anulată",
        },
    },

    {
        id: "order-failed",
        name: "Order Failed",
        slug: "order-failed",
        subject: "Probleme cu comanda #{{order.number}} - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comanda eșuată</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                ⚠️ Problema cu comanda
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Comanda #{{order.number}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Ne pare rău să te anunțăm că a apărut o problemă cu comanda ta. Echipa noastră lucrează pentru a rezolva situația.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">
                    🔍 Detalii despre problemă
                </h3>
                <p style="color: #856404; margin: 5px 0;"><strong>Motivul:</strong> {{failureReason}}</p>
                <p style="color: #856404; margin: 5px 0;"><strong>Data detectării:</strong> {{failureDate}}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    🛠️ Ce facem acum
                </h3>
                <p style="color: #374151; margin: 0;">
                    Echipa noastră lucrează pentru a rezolva problema. Te vom contacta în cel mai scurt timp posibil cu o soluție.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{retryUrl}}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    🔄 Încearcă din nou
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "orderNumber",
            "failureReason",
            "failureDate",
            "retryUrl",
            "siteUrl",
        ],
        category: "orders",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["order", "failed", "error"],
            priority: 1,
            estimatedOpenRate: 0.95,
            description: "Notificare comandă eșuată",
        },
    },

    // MARKETING TEMPLATES (CONTINUED)
    {
        id: "blog-post-notification",
        name: "Blog Post Notification",
        slug: "blog-post-notification",
        subject: "Nou articol: {{blogTitle}} - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nou articol TechTots</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📝 Nou articol pe blog
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                Descoperă ultimele noutăți STEM
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{subscriberName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Am publicat un nou articol pe blogul nostru și am vrut să îl împărtășim cu tine!
            </p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">
                    {{blogTitle}}
                </h3>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                    {{blogExcerpt}}
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{blogUrl}}" 
                   style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                    📖 Citește articolul
                </a>
            </div>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">
                    💡 De ce să citești?
                </h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>Ghiduri practice pentru părinți</li>
                    <li>Idei de activități STEM pentru acasă</li>
                    <li>Noutăți despre educația științifică</li>
                    <li>Interviuri cu experți în domeniu</li>
                </ul>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: underline;">Dezabonează-te</a> | 
                <a href="{{siteUrl}}/privacy" style="color: #6b7280; text-decoration: underline;">Politica de confidențialitate</a>
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "subscriberName",
            "blogTitle",
            "blogExcerpt",
            "blogUrl",
            "unsubscribeUrl",
            "siteUrl",
        ],
        category: "marketing",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["blog", "newsletter", "content"],
            priority: 2,
            estimatedOpenRate: 0.75,
            description: "Notificare articol nou pe blog",
        },
    },

    {
        id: "coupon-distribution",
        name: "Coupon Distribution",
        slug: "coupon-distribution",
        subject:
            "🎁 Ofertă specială pentru tine! {{discountAmount}} reducere - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ofertă specială TechTots</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🎁 Ofertă specială!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                {{discountAmount}} reducere pentru tine
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Am pregătit o ofertă specială doar pentru tine! Folosește codul de reducere de mai jos pentru a economisi la următoarea ta comandă.
            </p>
            
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
                <h3 style="color: white; margin: 0 0 15px 0; font-size: 24px;">
                    🎫 Codul tău de reducere
                </h3>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <span style="color: #1f2937; font-size: 32px; font-weight: 700; letter-spacing: 2px;">{{couponCode}}</span>
                </div>
                <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
                    Valabil până la {{expiryDate}}
                </p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    🛍️ Cum să folosești codul
                </h3>
                <ol style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>Adaugă produsele dorite în coș</li>
                    <li>La finalizarea comenzii, introdu codul {{couponCode}}</li>
                    <li>Reducerea se va aplica automat</li>
                    <li>Finalizează comanda și bucură-te de economii!</li>
                </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/products" 
                   style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                    🛒 Cumpără acum
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: underline;">Dezabonează-te</a> | 
                <a href="{{siteUrl}}/privacy" style="color: #6b7280; text-decoration: underline;">Politica de confidențialitate</a>
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "couponCode",
            "discountAmount",
            "expiryDate",
            "siteUrl",
            "unsubscribeUrl",
        ],
        category: "marketing",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["coupon", "promotion", "discount"],
            priority: 2,
            estimatedOpenRate: 0.8,
            description: "Distribuție cupoane de reducere",
        },
    },

    {
        id: "flash-sale-alert",
        name: "Flash Sale Alert",
        slug: "flash-sale-alert",
        subject: "⚡ Vânzare flash! {{saleTitle}} - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vânzare flash TechTots</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                ⚡ VÂNZARE FLASH!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                {{saleTitle}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 🚨
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Oferte incredibile pentru o perioadă limitată! Nu rata această oportunitate unică de a economisi la jucăriile STEM preferate.
            </p>
            
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
                <h3 style="color: white; margin: 0 0 15px 0; font-size: 24px;">
                    🔥 {{discountPercent}}% REDUCERE
                </h3>
                <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">
                    Valabil până la {{saleEndTime}}
                </p>
            </div>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 18px;">
                    ⏰ Atenție! Timp limitat
                </h3>
                <p style="color: #991b1b; margin: 0;">
                    Această ofertă expiră în curând! Grăbește-te să nu ratezi șansa de a economisi.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/products" 
                   style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                    ⚡ Cumpără acum
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: underline;">Dezabonează-te</a> | 
                <a href="{{siteUrl}}/privacy" style="color: #6b7280; text-decoration: underline;">Politica de confidențialitate</a>
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "customerName",
            "saleTitle",
            "discountPercent",
            "saleEndTime",
            "siteUrl",
            "unsubscribeUrl",
        ],
        category: "marketing",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["flash-sale", "promotion", "urgent"],
            priority: 1,
            estimatedOpenRate: 0.85,
            description: "Alertă vânzare flash",
        },
    },

    // SUPPLIER TEMPLATES
    {
        id: "supplier-registration-confirmation",
        name: "Supplier Registration Confirmation",
        slug: "supplier-registration-confirmation",
        subject: "Confirmare înregistrare furnizor - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmare înregistrare furnizor</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🏢 Confirmare înregistrare furnizor
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                {{companyName}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{contactPersonName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Mulțumim pentru înregistrarea ca furnizor la TechTots! Am primit cererea ta și o analizăm.
            </p>
            
            <div style="background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #01579b; margin: 0 0 10px 0; font-size: 18px;">
                    📋 Următorii pași
                </h3>
                <ul style="color: #01579b; margin: 0; padding-left: 20px;">
                    <li>Verificăm documentele încărcate</li>
                    <li>Analizăm profilul companiei</li>
                    <li>Contactăm pentru întrebări suplimentare (dacă este necesar)</li>
                    <li>Te notificăm despre decizia de aprobare</li>
                </ul>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    📊 Detalii înregistrare
                </h3>
                <p style="color: #374151; margin: 5px 0;"><strong>Companie:</strong> {{companyName}}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Persoană de contact:</strong> {{contactPersonName}}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> {{contactPersonEmail}}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Data înregistrării:</strong> {{registrationDate}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/supplier/dashboard" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    📊 Accesează dashboard-ul
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "companyName",
            "contactPersonName",
            "contactPersonEmail",
            "registrationDate",
            "siteUrl",
        ],
        category: "suppliers",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["supplier", "registration", "confirmation"],
            priority: 1,
            estimatedOpenRate: 0.9,
            description: "Confirmare înregistrare furnizor",
        },
    },

    {
        id: "supplier-approval",
        name: "Supplier Approval",
        slug: "supplier-approval",
        subject: "Felicitări! Contul de furnizor a fost aprobat - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Furnizor aprobat</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 Felicitări! Ești aprobat!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                {{companyName}} este acum furnizor TechTots
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{contactPersonName}}! 🚀
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Suntem încântați să te anunțăm că {{companyName}} a fost aprobat ca furnizor oficial TechTots! 
                Acum poți începe să adaugi produse și să construiești afacerea ta cu noi.
            </p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">
                    ✅ Ce poți face acum
                </h3>
                <ul style="color: #155724; margin: 0; padding-left: 20px;">
                    <li>Adaugă produse în catalogul tău</li>
                    <li>Configurează prețurile și stocurile</li>
                    <li>Urmărește comenzile și vânzările</li>
                    <li>Accesează rapoartele de performanță</li>
                </ul>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    📊 Detalii cont
                </h3>
                <p style="color: #374151; margin: 5px 0;"><strong>Companie:</strong> {{companyName}}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Comision:</strong> {{commissionRate}}%</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Termeni de plată:</strong> {{paymentTerms}} zile</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Valoare minimă comandă:</strong> {{minimumOrderValue}} RON</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/supplier/dashboard" 
                   style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    🚀 Începe să adaugi produse
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "companyName",
            "contactPersonName",
            "commissionRate",
            "paymentTerms",
            "minimumOrderValue",
            "siteUrl",
        ],
        category: "suppliers",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["supplier", "approval", "success"],
            priority: 1,
            estimatedOpenRate: 0.95,
            description: "Notificare aprobare furnizor",
        },
    },

    {
        id: "supplier-rejection",
        name: "Supplier Rejection",
        slug: "supplier-rejection",
        subject: "Decizie privind cererea de furnizor - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cerere furnizor respinsă</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📋 Decizie privind cererea
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                {{companyName}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{contactPersonName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Mulțumim pentru interesul arătat față de parteneriatul cu TechTots. 
                După o analiză atentă, am luat decizia să nu aprobăm cererea de furnizor în acest moment.
            </p>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #721c24; margin: 0 0 10px 0; font-size: 18px;">
                    📝 Motivele deciziei
                </h3>
                <p style="color: #721c24; margin: 0;">{{rejectionReason}}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">
                    🔄 Ce poți face în viitor
                </h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                    <li>Îmbunătățește profilul companiei</li>
                    <li>Completează documentația lipsă</li>
                    <li>Contactează-ne pentru clarificări</li>
                    <li>Reîncearcă după 6 luni</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/contact" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    💬 Contactează-ne
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>
                +40 771 248 029
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: [
            "companyName",
            "contactPersonName",
            "rejectionReason",
            "siteUrl",
        ],
        category: "suppliers",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["supplier", "rejection", "feedback"],
            priority: 1,
            estimatedOpenRate: 0.9,
            description: "Notificare respingere furnizor",
        },
    },

    // ADDITIONAL TEMPLATES
    ...ADDITIONAL_EMAIL_TEMPLATES,
];

/**
 * Get template by slug
 */
export function getTemplateBySlug(slug: string): EmailTemplate | undefined {
    return EMAIL_TEMPLATES.find(
        template => template.slug === slug && template.isActive
    );
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): EmailTemplate[] {
    return EMAIL_TEMPLATES.filter(
        template => template.category === category && template.isActive
    );
}

/**
 * Get all active templates
 */
export function getAllTemplates(): EmailTemplate[] {
    return EMAIL_TEMPLATES.filter(template => template.isActive);
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): EmailTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return EMAIL_TEMPLATES.filter(
        template =>
            template.isActive &&
            (template.name.toLowerCase().includes(lowercaseQuery) ||
                template.description.toLowerCase().includes(lowercaseQuery) ||
                template.metadata?.tags?.some(tag =>
                    tag.toLowerCase().includes(lowercaseQuery)
                ))
    );
}

/**
 * Get template categories
 */
export function getTemplateCategories(): string[] {
    const categories = new Set(
        EMAIL_TEMPLATES.map(template => template.category)
    );
    return Array.from(categories).sort();
}
