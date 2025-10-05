import {
  PrismaClient,
  EmailTriggerType,
  UserSegment,
  LifecycleStage,
} from "@prisma/client";
import { EmailTriggerService } from "../lib/services/email-trigger-service";

const prisma = new PrismaClient();
const triggerService = new EmailTriggerService(prisma);

async function setupEmailTriggers() {
  console.log("Setting up email triggers for real-world scenarios...");

  // Get existing email templates and sequences
  const templates = await prisma.emailTemplate.findMany({
    select: { id: true, slug: true, name: true },
  });

  const sequences = await prisma.emailSequence.findMany({
    select: { id: true, name: true },
  });

  console.log(
    `Found ${templates.length} email templates and ${sequences.length} sequences`
  );

  const triggers = [
    // ===== WELCOME & ONBOARDING TRIGGERS =====

    {
      name: "Welcome Email - New User Registration",
      description: "Send welcome email immediately when user registers",
      type: EmailTriggerType.SEGMENT_ENTER,
      conditions: {
        segment: UserSegment.NEW,
        // previousSegment: null - not needed for new registrations
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "welcome-new-user")?.id ||
          "welcome-template-id",
        subject: "Welcome to STEM Toys! 🚀 Your Learning Adventure Begins",
      },
      priority: 100,
      cooldownHours: 1,
      tags: ["welcome", "onboarding", "automated"],
    },

    {
      name: "Welcome Email Series - Day 3",
      description: "Educational content email 3 days after registration",
      type: EmailTriggerType.TIME_BASED,
      conditions: {
        inactiveDays: 3,
        segment: UserSegment.NEW,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "welcome-series-day3")?.id ||
          "welcome-day3-template-id",
        subject: "Your First STEM Activity Ideas ✨",
      },
      priority: 90,
      cooldownHours: 24,
      tags: ["welcome", "education", "nurture"],
    },

    {
      name: "Welcome Email Series - Day 7",
      description: "Product recommendations 7 days after registration",
      type: EmailTriggerType.TIME_BASED,
      conditions: {
        inactiveDays: 7,
        segment: UserSegment.NEW,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "welcome-series-day7")?.id ||
          "welcome-day7-template-id",
        subject: "Popular STEM Toys Your Kids Will Love 🎓",
      },
      priority: 85,
      cooldownHours: 24,
      tags: ["welcome", "recommendations", "conversion"],
    },

    // ===== VIP CUSTOMER TRIGGERS =====

    {
      name: "VIP Welcome Email",
      description: "Special welcome when user becomes VIP",
      type: EmailTriggerType.SEGMENT_ENTER,
      conditions: {
        segment: UserSegment.VIP,
        previousSegment: UserSegment.ACTIVE,
      },
      actionType: "start_sequence" as const,
      actionData: {
        sequenceId:
          sequences.find(s => s.name === "VIP Onboarding")?.id ||
          "vip-sequence-id",
      },
      priority: 95,
      cooldownHours: 24,
      segmentFilter: UserSegment.VIP,
      tags: ["vip", "loyalty", "premium"],
    },

    {
      name: "VIP Monthly Perks",
      description: "Monthly exclusive offers for VIP customers",
      type: EmailTriggerType.TIME_BASED,
      conditions: {
        inactiveDays: 30,
        segment: UserSegment.VIP,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "vip-monthly-perks")?.id ||
          "vip-perks-template-id",
        subject: "Your VIP Exclusive: Special Offers Just for You 💎",
      },
      priority: 80,
      cooldownHours: 720, // 30 days
      segmentFilter: UserSegment.VIP,
      tags: ["vip", "monthly", "exclusive"],
    },

    {
      name: "VIP Birthday Special",
      description: "Birthday offer for VIP customers",
      type: EmailTriggerType.BEHAVIOR_EVENT,
      conditions: {
        event: "birthday_approaching",
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "vip-birthday")?.id ||
          "birthday-template-id",
        subject: "Happy Birthday! A Special Gift from STEM Toys 🎂",
      },
      priority: 88,
      cooldownHours: 8760, // ~1 year
      segmentFilter: UserSegment.VIP,
      tags: ["vip", "birthday", "personal"],
    },

    // ===== RE-ENGAGEMENT TRIGGERS =====

    {
      name: "Re-engagement - 30 Days Inactive",
      description: "Gentle re-engagement for users inactive for 30 days",
      type: EmailTriggerType.TIME_BASED,
      conditions: {
        inactiveDays: 30,
        segment: UserSegment.ACTIVE,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "reengagement-30days")?.id ||
          "reengage-30-template-id",
        subject: "We Miss You! Special 15% Off Your Next Purchase 💝",
      },
      priority: 75,
      cooldownHours: 168, // 7 days
      tags: ["reengagement", "inactive", "retention"],
    },

    {
      name: "Re-engagement - 60 Days Inactive",
      description: "Stronger re-engagement for users inactive for 60 days",
      type: EmailTriggerType.TIME_BASED,
      conditions: {
        inactiveDays: 60,
        segment: UserSegment.ACTIVE,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "reengagement-60days")?.id ||
          "reengage-60-template-id",
        subject: "Your STEM Toys Wishlist Awaits! 20% Off Everything 🎁",
      },
      priority: 70,
      cooldownHours: 336, // 14 days
      tags: ["reengagement", "inactive", "urgent"],
    },

    {
      name: "Win Back Campaign - 90 Days Inactive",
      description: "Final attempt to win back inactive users",
      type: EmailTriggerType.TIME_BASED,
      conditions: {
        inactiveDays: 90,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "winback-campaign")?.id ||
          "winback-template-id",
        subject: "Last Chance: 25% Off + Free Shipping! ⏰",
      },
      priority: 65,
      cooldownHours: 720, // 30 days
      tags: ["winback", "inactive", "final-attempt"],
    },

    // ===== BEHAVIOR-BASED TRIGGERS =====

    {
      name: "Cart Abandonment - 1 Hour",
      description: "Remind users about abandoned carts after 1 hour",
      type: EmailTriggerType.BEHAVIOR_EVENT,
      conditions: {
        event: "cart_abandoned",
        hoursSinceAbandonment: 1,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "cart-abandonment")?.id ||
          "cart-abandon-template-id",
        subject: "Your STEM Toys Are Waiting! Complete Your Order 🛒",
      },
      priority: 92,
      cooldownHours: 24,
      tags: ["cart", "abandonment", "conversion"],
    },

    {
      name: "Product View Follow-up",
      description: "Follow up after user views multiple products",
      type: EmailTriggerType.BEHAVIOR_EVENT,
      conditions: {
        event: "multiple_product_views",
        minViews: 3,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "product-recommendation")?.id ||
          "product-rec-template-id",
        subject: "Based on Your Interest: Personalized STEM Recommendations 🎯",
      },
      priority: 78,
      cooldownHours: 72, // 3 days
      tags: ["product", "recommendation", "personalization"],
    },

    {
      name: "Wishlist Reminder",
      description: "Remind users about items in their wishlist",
      type: EmailTriggerType.BEHAVIOR_EVENT,
      conditions: {
        event: "wishlist_inactive",
        daysSinceLastWishlistAdd: 7,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "wishlist-reminder")?.id ||
          "wishlist-template-id",
        subject: "Your Saved STEM Toys Are Getting Popular! 📈",
      },
      priority: 76,
      cooldownHours: 168, // 7 days
      tags: ["wishlist", "reminder", "engagement"],
    },

    // ===== LIFECYCLE STAGE TRIGGERS =====

    {
      name: "First Purchase Celebration",
      description: "Celebrate when user moves to PURCHASE lifecycle stage",
      type: EmailTriggerType.LIFECYCLE_CHANGE,
      conditions: {
        lifecycleStage: LifecycleStage.PURCHASE,
        previousLifecycleStage: LifecycleStage.CONSIDERATION,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "first-purchase-thanks")?.id ||
          "first-purchase-template-id",
        subject: "Thank You for Your First STEM Toys Purchase! 🎉",
      },
      priority: 89,
      cooldownHours: 1,
      tags: ["lifecycle", "first-purchase", "celebration"],
    },

    {
      name: "Retention Program Activation",
      description: "Start retention sequence when user becomes loyal",
      type: EmailTriggerType.LIFECYCLE_CHANGE,
      conditions: {
        lifecycleStage: LifecycleStage.RETENTION,
        previousLifecycleStage: LifecycleStage.PURCHASE,
      },
      actionType: "start_sequence" as const,
      actionData: {
        sequenceId:
          sequences.find(s => s.name === "Customer Retention")?.id ||
          "retention-sequence-id",
      },
      priority: 87,
      cooldownHours: 24,
      tags: ["lifecycle", "retention", "loyalty"],
    },

    // ===== AT RISK & CHURN PREVENTION =====

    {
      name: "At Risk User Intervention",
      description: "Special attention for users entering AT_RISK segment",
      type: EmailTriggerType.SEGMENT_ENTER,
      conditions: {
        segment: UserSegment.AT_RISK,
      },
      actionType: "start_sequence" as const,
      actionData: {
        sequenceId:
          sequences.find(s => s.name === "At Risk Recovery")?.id ||
          "at-risk-sequence-id",
      },
      priority: 93,
      cooldownHours: 24,
      segmentFilter: UserSegment.AT_RISK,
      tags: ["at-risk", "intervention", "recovery"],
    },

    {
      name: "Churn Prevention Final Attempt",
      description: "Last-ditch effort to prevent churn",
      type: EmailTriggerType.SEGMENT_ENTER,
      conditions: {
        segment: UserSegment.CHURNED,
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "churn-prevention")?.id ||
          "churn-prev-template-id",
        subject: "We're Sorry to See You Go... One Last Special Offer 💔",
      },
      priority: 60,
      cooldownHours: 720, // 30 days
      maxExecutions: 3,
      segmentFilter: UserSegment.CHURNED,
      tags: ["churn", "prevention", "final-attempt"],
    },

    // ===== ROMANIAN MARKET SPECIFIC =====

    {
      name: "Romanian Holiday Special",
      description: "Seasonal offers for Romanian holidays",
      type: EmailTriggerType.BEHAVIOR_EVENT,
      conditions: {
        event: "romanian_holiday_approaching",
        holiday: ["craciun", "paste", "martisor"],
      },
      actionType: "send_email" as const,
      actionData: {
        templateId:
          templates.find(t => t.slug === "romanian-holiday")?.id ||
          "holiday-template-id",
        subject: "Sărbători Fericite! Oferte Speciale pentru Familie 🎄",
      },
      priority: 82,
      cooldownHours: 8760, // ~1 year
      tags: ["romanian", "holiday", "seasonal"],
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const triggerData of triggers) {
    try {
      // Check if trigger already exists
      const existing = await prisma.emailTrigger.findFirst({
        where: { name: triggerData.name },
      });

      if (existing) {
        console.log(`Skipping existing trigger: ${triggerData.name}`);
        skippedCount++;
        continue;
      }

      // Create the trigger
      const trigger = await triggerService.createTrigger(triggerData, "system");
      console.log(`Created trigger: ${trigger.name}`);

      // Set status to ACTIVE for production-ready triggers
      if (triggerData.tags?.includes("automated")) {
        await triggerService.updateTriggerStatus(trigger.id, "ACTIVE" as any);
        console.log(`Activated trigger: ${trigger.name}`);
      }

      createdCount++;
    } catch (error) {
      console.error(`Error creating trigger ${triggerData.name}:`, error);
    }
  }

  console.log(`\nEmail triggers setup complete!`);
  console.log(`Created: ${createdCount} triggers`);
  console.log(`Skipped: ${skippedCount} existing triggers`);
  console.log(`\nNext steps:`);
  console.log(`1. Review and customize email template IDs in triggers`);
  console.log(`2. Test triggers with sample users`);
  console.log(`3. Monitor trigger performance and adjust as needed`);
}

async function main() {
  try {
    await setupEmailTriggers();
  } catch (error) {
    console.error("Error setting up email triggers:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
