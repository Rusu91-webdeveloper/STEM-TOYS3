import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function comprehensiveEmailAudit() {
  console.log("🔍 AUDIT COMPLET AL ȘABLOANELOR DE EMAIL\n");

  try {
    // Get all current templates
    const currentTemplates = await prisma.emailTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        subject: true,
        isActive: true,
      },
      orderBy: { category: "asc" },
    });

    console.log(
      `📧 Șabloane găsite în baza de date: ${currentTemplates.length}\n`
    );

    // Group by category
    const byCategory = currentTemplates.reduce(
      (acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
      },
      {} as Record<string, typeof currentTemplates>
    );

    Object.entries(byCategory).forEach(([category, templates]) => {
      console.log(`📂 ${category} (${templates.length}):`);
      templates.forEach(template => {
        const status = template.isActive ? "🟢" : "🔴";
        console.log(`   ${status} ${template.name} (${template.slug})`);
      });
      console.log("");
    });

    // Define comprehensive template requirements for e-commerce
    const requiredTemplates = {
      // Authentication & Account
      authentication: [
        "welcome",
        "account-verification",
        "password-reset",
        "email-change-confirmation",
        "account-created",
        "login-notification",
      ],

      // Order Management
      orders: [
        "order-confirmation",
        "order-shipped",
        "order-delivered",
        "order-cancelled",
        "order-refunded",
        "payment-successful",
        "payment-failed",
        "payment-pending",
      ],

      // Shipping & Delivery
      shipping: [
        "shipping-confirmation",
        "shipping-delay",
        "delivery-update",
        "customs-clearance",
        "failed-delivery",
      ],

      // Customer Service
      support: [
        "contact-form-response",
        "support-ticket-update",
        "complaint-acknowledgment",
        "feedback-request",
      ],

      // Marketing & Promotions
      marketing: [
        "newsletter-subscription",
        "promotional-offer",
        "flash-sale",
        "new-product-launch",
        "abandoned-cart-reminder",
        "price-drop-alert",
      ],

      // Reviews & Feedback
      reviews: ["review-request", "feedback-survey", "testimonial-request"],

      // Loyalty & VIP
      loyalty: [
        "loyalty-points-earned",
        "vip-upgrade",
        "birthday-special",
        "loyalty-tier-upgrade",
      ],

      // Returns & Exchanges
      returns: [
        "return-request-confirmation",
        "return-approved",
        "return-rejected",
        "return-shipped",
        "exchange-confirmation",
        "refund-processed",
      ],

      // Legal & Compliance
      legal: [
        "privacy-policy-update",
        "terms-update",
        "gdpr-consent-request",
        "data-export-ready",
      ],

      // Admin Notifications
      admin: [
        "admin-new-order",
        "admin-order-issue",
        "admin-payment-failed",
        "admin-return-request",
        "admin-low-stock",
      ],

      // Trigger Templates (from our automation system)
      automation: [
        "welcome-new-user",
        "welcome-series-day3",
        "welcome-series-day7",
        "vip-monthly-perks",
        "vip-birthday",
        "reengagement-30days",
        "reengagement-60days",
        "winback-campaign",
        "cart-abandonment",
        "product-recommendation",
        "wishlist-reminder",
        "first-purchase-thanks",
        "churn-prevention",
        "romanian-holiday",
      ],

      // Seasonal & Events
      seasonal: [
        "christmas-special",
        "easter-offer",
        "back-to-school",
        "black-friday",
        "cyber-monday",
        "mothers-day",
        "fathers-day",
        "valentine-special",
      ],
    };

    const existingSlugs = new Set(currentTemplates.map(t => t.slug));

    let totalRequired = 0;
    let totalPresent = 0;
    let missingByCategory: Record<string, string[]> = {};

    Object.entries(requiredTemplates).forEach(([category, slugs]) => {
      totalRequired += slugs.length;
      const present = slugs.filter(slug => existingSlugs.has(slug));
      const missing = slugs.filter(slug => !existingSlugs.has(slug));

      totalPresent += present.length;

      if (missing.length > 0) {
        missingByCategory[category] = missing;
      }

      console.log(`📋 ${category}: ${present.length}/${slugs.length} ✅`);
      if (missing.length > 0) {
        console.log(`   ❌ Lipsesc: ${missing.join(", ")}`);
      }
    });

    console.log(`\n📊 REZUMAT FINAL:`);
    console.log(`   • Șabloane în DB: ${currentTemplates.length}`);
    console.log(
      `   • Șabloane esențiale: ${totalPresent}/${totalRequired} (${Math.round((totalPresent / totalRequired) * 100)}%)`
    );
    console.log(
      `   • Categorii complete: ${Object.keys(requiredTemplates).length - Object.keys(missingByCategory).length}/${Object.keys(requiredTemplates).length}`
    );
    console.log(`   • Total lipsesc: ${totalRequired - totalPresent}`);

    if (Object.keys(missingByCategory).length > 0) {
      console.log(`\n⚠️  CATEGORII CU ȘABLOANE LIPSE:`);
      Object.entries(missingByCategory).forEach(([category, missing]) => {
        console.log(`   ${category}: ${missing.length} șabloane`);
      });

      console.log(`\n🔧 RECOMANDĂRI:`);
      console.log(
        `   1. Creează șabloanele lipsă pentru funcționalități esențiale`
      );
      console.log(`   2. Prioritizează ordine, plăți și suport client`);
      console.log(`   3. Adaugă șabloane pentru evenimente sezoniere`);
      console.log(`   4. Configurează automatizarea pentru șabloanele trigger`);
    } else {
      console.log(
        `\n🎉 FELICITĂRI! Ai toate șabloanele esențiale pentru e-commerce!`
      );
    }
  } catch (error) {
    console.error("❌ Eroare la audit:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if database is accessible
async function checkDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Conexiune la baza de date reușită");
    return true;
  } catch (error) {
    console.log("❌ Eroare conexiune bază de date:", error);
    return false;
  }
}

async function main() {
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log("❌ Nu se poate continua fără conexiune la baza de date");
    process.exit(1);
  }

  await comprehensiveEmailAudit();
}

main().catch(console.error);
