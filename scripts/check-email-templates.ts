import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkEmailTemplates() {
  console.log("🔍 Checking existing email templates...\n");

  try {
    const templates = await prisma.emailTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (templates.length === 0) {
      console.log("❌ No email templates found in database");
      console.log(
        "\n📝 You need to create email templates first. Here are the required templates:\n"
      );

      const requiredTemplates = [
        // Welcome & Onboarding
        {
          slug: "welcome-new-user",
          category: "Welcome",
          name: "Welcome New User",
        },
        {
          slug: "welcome-series-day3",
          category: "Welcome",
          name: "Welcome Series - Day 3",
        },
        {
          slug: "welcome-series-day7",
          category: "Welcome",
          name: "Welcome Series - Day 7",
        },

        // VIP Customer
        {
          slug: "vip-monthly-perks",
          category: "VIP",
          name: "VIP Monthly Perks",
        },
        { slug: "vip-birthday", category: "VIP", name: "VIP Birthday Special" },

        // Re-engagement
        {
          slug: "reengagement-30days",
          category: "Re-engagement",
          name: "Re-engagement 30 Days",
        },
        {
          slug: "reengagement-60days",
          category: "Re-engagement",
          name: "Re-engagement 60 Days",
        },
        {
          slug: "winback-campaign",
          category: "Re-engagement",
          name: "Win Back Campaign",
        },

        // Behavioral
        {
          slug: "cart-abandonment",
          category: "Behavioral",
          name: "Cart Abandonment",
        },
        {
          slug: "product-recommendation",
          category: "Behavioral",
          name: "Product Recommendations",
        },
        {
          slug: "wishlist-reminder",
          category: "Behavioral",
          name: "Wishlist Reminder",
        },

        // Lifecycle
        {
          slug: "first-purchase-thanks",
          category: "Lifecycle",
          name: "First Purchase Thanks",
        },

        // Churn Prevention
        {
          slug: "churn-prevention",
          category: "Churn",
          name: "Churn Prevention",
        },

        // Romanian
        {
          slug: "romanian-holiday",
          category: "Romanian",
          name: "Romanian Holiday Special",
        },
      ];

      console.table(requiredTemplates);

      console.log("\n📧 Email sequences needed:");
      const sequences = [
        { name: "VIP Onboarding", type: "VIP Welcome" },
        { name: "Customer Retention", type: "Retention Program" },
        { name: "At Risk Recovery", type: "Recovery Sequence" },
      ];

      console.table(sequences);

      return;
    }

    console.log(`✅ Found ${templates.length} email templates:\n`);

    // Group by category
    const byCategory = templates.reduce(
      (acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
      },
      {} as Record<string, typeof templates>
    );

    Object.entries(byCategory).forEach(([category, categoryTemplates]) => {
      console.log(`📂 ${category}:`);
      categoryTemplates.forEach(template => {
        const status = template.isActive ? "🟢" : "🔴";
        console.log(
          `   ${status} ${template.name} (${template.slug}) - ${template.id}`
        );
      });
      console.log("");
    });

    // Check which required templates are missing
    const existingSlugs = new Set(templates.map(t => t.slug));
    const requiredSlugs = [
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
    ];

    const missingTemplates = requiredSlugs.filter(
      slug => !existingSlugs.has(slug)
    );

    if (missingTemplates.length > 0) {
      console.log("⚠️  Missing required email templates:");
      missingTemplates.forEach(slug => {
        console.log(`   ❌ ${slug}`);
      });
      console.log(
        "\n📝 You need to create these templates for the triggers to work properly."
      );
    } else {
      console.log("🎉 All required email templates are present!");
    }
  } catch (error) {
    console.error("❌ Error checking email templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailTemplates();
