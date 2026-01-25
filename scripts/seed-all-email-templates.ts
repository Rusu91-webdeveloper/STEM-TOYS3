/**
 * Seed All Email Templates to Database
 *
 * This script imports all email templates from template-library.ts
 * into the database, allowing admin editing without code deployments.
 *
 * Run: pnpm tsx scripts/seed-all-email-templates.ts
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const prisma = new PrismaClient();

// Import templates from the library
import { EMAIL_TEMPLATES } from "../lib/email/template-library";

// Additional templates specific to TechTots operations
const ADDITIONAL_TEMPLATES = [
    {
        id: "order-shipped-fancourier",
        name: "Order Shipped (FanCourier)",
        slug: "order-shipped-fancourier",
        subject: "🚚 Comanda #{{orderNumber}} a fost expediată - TechTots",
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
                Comanda #{{orderNumber}}
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 🎉
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Comanda ta a fost expediată cu succes prin <strong>FanCourier</strong>! Produsele sunt pe drum către tine.
            </p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">
                    📦 Informații expediere
                </h3>
                <p style="color: #155724; margin: 5px 0;"><strong>AWB:</strong> {{trackingNumber}}</p>
                <p style="color: #155724; margin: 5px 0;"><strong>Curier:</strong> FanCourier</p>
                <p style="color: #155724; margin: 5px 0;"><strong>Livrare estimată:</strong> {{estimatedDelivery}}</p>
            </div>
            
            <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px;">
                    📱 Urmărește coletul în timp real
                </h3>
                <p style="color: #374151; margin: 0;">
                    Poți urmări statusul coletului tău pe site-ul FanCourier folosind AWB-ul de mai sus.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.fancourier.ro/awb-tracking/?tracking={{trackingNumber}}" 
                   style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin-right: 10px;">
                    🚚 Urmărește pe FanCourier
                </a>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0;">💡 Sfaturi pentru primire:</h4>
                <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                    <li>Asigură-te că cineva este prezent la adresa de livrare</li>
                    <li>Verifică conținutul pachetului la primire</li>
                    <li>Contactează-ne dacă ai probleme cu livrarea</li>
                </ul>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #ffffff; font-weight: 600;">{{storeName}}</p>
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                📧 {{contactEmail}} | 📞 {{contactPhone}}
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: ["orderNumber", "customerName", "trackingNumber", "estimatedDelivery", "storeName", "contactEmail", "contactPhone"],
        category: "orders",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["order", "shipped", "fancourier", "tracking"],
            priority: 1,
            description: "Notificare expediere cu FanCourier",
        },
    },
    {
        id: "return-confirmation-customer",
        name: "Return Confirmation (Customer)",
        slug: "return-confirmation-customer",
        subject: "🔄 Cererea ta de returnare #{{returnId}} - TechTots",
        content: `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmare returnare</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                🔄 Cerere de Returnare Primită
            </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Salut, {{customerName}}! 👋
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Am primit cererea ta de returnare pentru comanda <strong>#{{orderNumber}}</strong>. 
                Echipa noastră va analiza solicitarea și te va contacta în cel mai scurt timp.
            </p>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">📋 Detalii returnare</h3>
                <p style="color: #92400e; margin: 5px 0;"><strong>ID Returnare:</strong> {{returnId}}</p>
                <p style="color: #92400e; margin: 5px 0;"><strong>Comanda:</strong> #{{orderNumber}}</p>
                <p style="color: #92400e; margin: 5px 0;"><strong>Produs:</strong> {{productName}}</p>
                <p style="color: #92400e; margin: 5px 0;"><strong>Motiv:</strong> {{reason}}</p>
            </div>
            
            <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px;">⏱️ Următorii pași</h3>
                <ol style="color: #1e40af; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Analizăm cererea ta (1-2 zile lucrătoare)</li>
                    <li style="margin-bottom: 8px;">Te contactăm cu instrucțiuni de returnare</li>
                    <li style="margin-bottom: 8px;">Primim și verificăm produsul</li>
                    <li>Procesăm rambursarea (3-5 zile lucrătoare)</li>
                </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}/account/returns" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                    📋 Vezi Status Returnare
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #ffffff; font-weight: 600;">{{storeName}}</p>
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                📧 {{contactEmail}} | 📞 {{contactPhone}}
            </p>
        </div>
    </div>
</body>
</html>`,
        variables: ["customerName", "orderNumber", "returnId", "productName", "reason", "siteUrl", "storeName", "contactEmail", "contactPhone"],
        category: "returns",
        isActive: true,
        createdBy: "system",
        metadata: {
            tags: ["return", "customer", "confirmation"],
            priority: 1,
            description: "Confirmare returnare pentru client",
        },
    },
];

async function main() {
    console.log("🌱 Seeding All Email Templates to Database...\n");

    try {
        // Combine all templates
        const allTemplates = [...EMAIL_TEMPLATES, ...ADDITIONAL_TEMPLATES];

        console.log(`📧 Found ${allTemplates.length} templates to seed\n`);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const template of allTemplates) {
            try {
                // Check if template exists
                const existing = await prisma.emailTemplate.findUnique({
                    where: { slug: template.slug },
                });

                const templateData = {
                    name: template.name,
                    subject: template.subject,
                    content: template.content,
                    category: template.category,
                    isActive: template.isActive,
                    variables: template.variables || [],
                    metadata: template.metadata || null,
                    createdBy: template.createdBy || "system",
                };

                if (existing) {
                    // Update existing template
                    await prisma.emailTemplate.update({
                        where: { slug: template.slug },
                        data: {
                            ...templateData,
                            updatedAt: new Date(),
                        },
                    });
                    console.log(`📝 Updated: ${template.name}`);
                    updated++;
                } else {
                    // Create new template
                    await prisma.emailTemplate.create({
                        data: {
                            id: template.id,
                            slug: template.slug,
                            ...templateData,
                        },
                    });
                    console.log(`✅ Created: ${template.name}`);
                    created++;
                }
            } catch (error) {
                console.error(`❌ Failed: ${template.name}`, error);
                skipped++;
            }
        }

        // Update StoreSettings with TechTots info
        console.log("\n📦 Updating StoreSettings...");

        const storeSettings = await prisma.storeSettings.findFirst();
        if (storeSettings) {
            await prisma.storeSettings.update({
                where: { id: storeSettings.id },
                data: {
                    storeName: "TechTots STEM Store",
                    storeUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro",
                    contactEmail: "webira.rem.srl@gmail.com",
                    contactPhone: "+40 771 248 029",
                    currency: "RON",
                    timezone: "Europe/Bucharest",
                    metaTitle: "TechTots | Jucării STEM pentru Minți Curioase",
                    metaDescription: "Descoperă cele mai bune jucării STEM pentru copiii curioși. Jucării educaționale care fac învățarea distractivă.",
                },
            });
            console.log("✅ StoreSettings updated");
        } else {
            await prisma.storeSettings.create({
                data: {
                    storeName: "TechTots STEM Store",
                    storeUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro",
                    contactEmail: "webira.rem.srl@gmail.com",
                    contactPhone: "+40 771 248 029",
                    currency: "RON",
                    timezone: "Europe/Bucharest",
                    metaTitle: "TechTots | Jucării STEM pentru Minți Curioase",
                    metaDescription: "Descoperă cele mai bune jucării STEM pentru copiii curioși. Jucării educaționale care fac învățarea distractivă.",
                },
            });
            console.log("✅ StoreSettings created");
        }

        // Summary
        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Created: ${created}`);
        console.log(`   📝 Updated: ${updated}`);
        console.log(`   ❌ Skipped: ${skipped}`);
        console.log(`   📧 Total: ${allTemplates.length}`);

        // Verify key templates
        console.log("\n🔍 Verifying key templates...");

        const keyTemplates = [
            "welcome",
            "email-verification",
            "order-confirmation",
            "order-shipped",
            "order-shipped-fancourier",
            "newsletter-welcome",
        ];

        for (const slug of keyTemplates) {
            const template = await prisma.emailTemplate.findUnique({
                where: { slug },
            });
            if (template) {
                console.log(`   ✅ ${slug}: ${template.name}`);
            } else {
                console.log(`   ⚠️  ${slug}: NOT FOUND`);
            }
        }

        console.log("\n✨ Seeding completed!\n");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Script failed:", error);
        process.exit(1);
    });
