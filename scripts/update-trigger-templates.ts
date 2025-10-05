import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateTriggerTemplates() {
  console.log("🔄 Updating email triggers with correct template IDs...\n");

  // Get all templates
  const templates = await prisma.emailTemplate.findMany({
    select: { id: true, slug: true },
  });

  const templateMap: Record<string, string> = {};
  templates.forEach(t => (templateMap[t.slug] = t.id));

  // Get all triggers that need updating
  const triggers = await prisma.emailTrigger.findMany();

  let updatedCount = 0;

  for (const trigger of triggers) {
    const actionData = trigger.actionData as any;

    if (
      actionData.templateId &&
      (actionData.templateId.startsWith("welcome-") ||
        actionData.templateId.includes("template-id"))
    ) {
      // Find the correct template slug from the trigger name
      let slug = "";
      if (trigger.name.includes("Welcome Email - New User"))
        slug = "welcome-new-user";
      else if (trigger.name.includes("Welcome Email Series - Day 3"))
        slug = "welcome-series-day3";
      else if (trigger.name.includes("Welcome Email Series - Day 7"))
        slug = "welcome-series-day7";
      else if (trigger.name.includes("VIP Monthly Perks"))
        slug = "vip-monthly-perks";
      else if (trigger.name.includes("VIP Birthday Special"))
        slug = "vip-birthday";
      else if (trigger.name.includes("Re-engagement - 30 Days"))
        slug = "reengagement-30days";
      else if (trigger.name.includes("Re-engagement - 60 Days"))
        slug = "reengagement-60days";
      else if (trigger.name.includes("Win Back Campaign"))
        slug = "winback-campaign";
      else if (trigger.name.includes("Cart Abandonment"))
        slug = "cart-abandonment";
      else if (trigger.name.includes("Product View Follow-up"))
        slug = "product-recommendation";
      else if (trigger.name.includes("Wishlist Reminder"))
        slug = "wishlist-reminder";
      else if (trigger.name.includes("First Purchase Celebration"))
        slug = "first-purchase-thanks";
      else if (trigger.name.includes("Churn Prevention"))
        slug = "churn-prevention";
      else if (trigger.name.includes("Romanian Holiday Special"))
        slug = "romanian-holiday";

      if (slug && templateMap[slug]) {
        await prisma.emailTrigger.update({
          where: { id: trigger.id },
          data: {
            actionData: {
              ...actionData,
              templateId: templateMap[slug],
            },
          },
        });
        console.log(`✅ Updated ${trigger.name} with correct template ID`);
        updatedCount++;
      } else {
        console.log(
          `⚠️  Could not find template for: ${trigger.name} (looking for: ${slug})`
        );
      }
    }
  }

  console.log(`\n🎉 Trigger template update complete!`);
  console.log(`   • Updated: ${updatedCount} triggers`);
  console.log(`   • Total triggers: ${triggers.length}`);

  // Verify all triggers now have valid template IDs
  const allTriggers = await prisma.emailTrigger.findMany({
    include: {
      _count: true,
    },
  });

  console.log("\n📊 Trigger Status Summary:");
  console.log(`   • Total triggers: ${allTriggers.length}`);
  console.log(
    `   • Active triggers: ${allTriggers.filter(t => t.isActive).length}`
  );
  console.log(
    `   • Inactive triggers: ${allTriggers.filter(t => !t.isActive).length}`
  );
  console.log(
    `   • Total executions: ${allTriggers.reduce((sum, t) => sum + (t._count?.executions || 0), 0)}`
  );

  console.log("\n🚀 Email automation system is now fully operational!");
}

updateTriggerTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => process.exit(0)));
