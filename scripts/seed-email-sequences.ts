import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const emailSequences = [
  {
    name: "Welcome Series",
    description: "3-email welcome series for new users",
    trigger: "USER_REGISTRATION",
    isActive: true,
    maxEmails: 3,
    cooldownHours: 24,
    steps: [
      {
        order: 1,
        delayHours: 0,
        templateSlug: "welcome-email",
      },
      {
        order: 2,
        delayHours: 24,
        templateSlug: "abandoned-cart-reminder",
      },
      {
        order: 3,
        delayHours: 72,
        templateSlug: "welcome-email",
      },
    ],
  },
  {
    name: "Abandoned Cart Recovery",
    description: "3-email sequence to recover abandoned carts",
    trigger: "ABANDONED_CART",
    isActive: true,
    maxEmails: 3,
    cooldownHours: 12,
    steps: [
      {
        order: 1,
        delayHours: 1,
        templateSlug: "abandoned-cart-reminder",
      },
      {
        order: 2,
        delayHours: 12,
        templateSlug: "abandoned-cart-reminder",
      },
      {
        order: 3,
        delayHours: 24,
        templateSlug: "abandoned-cart-reminder",
      },
    ],
  },
  {
    name: "Post-Purchase Follow-up",
    description: "Follow-up sequence after order delivery",
    trigger: "ORDER_DELIVERED",
    isActive: true,
    maxEmails: 2,
    cooldownHours: 48,
    steps: [
      {
        order: 1,
        delayHours: 24,
        templateSlug: "order-delivered",
      },
      {
        order: 2,
        delayHours: 72,
        templateSlug: "order-delivered",
      },
    ],
  },
  {
    name: "First Purchase Welcome",
    description: "Welcome sequence for first-time buyers",
    trigger: "FIRST_PURCHASE",
    isActive: true,
    maxEmails: 2,
    cooldownHours: 24,
    steps: [
      {
        order: 1,
        delayHours: 0,
        templateSlug: "order-confirmation",
      },
      {
        order: 2,
        delayHours: 24,
        templateSlug: "welcome-email",
      },
    ],
  },
];

async function seedEmailSequences() {
  console.log("🌱 Starting email sequences seeding...");

  try {
    // Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      throw new Error(
        "No admin user found. Please run the main seed script first."
      );
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const sequenceData of emailSequences) {
      // Check if sequence already exists
      const existingSequence = await prisma.emailSequence.findFirst({
        where: { name: sequenceData.name },
      });

      if (existingSequence) {
        console.log(
          `⏭️  Sequence "${sequenceData.name}" already exists, skipping...`
        );
        skippedCount++;
        continue;
      }

      // Get templates for steps
      const templates = await prisma.emailTemplate.findMany({
        where: {
          slug: {
            in: sequenceData.steps.map(step => step.templateSlug),
          },
        },
      });

      // Create the sequence
      const sequence = await prisma.emailSequence.create({
        data: {
          name: sequenceData.name,
          description: sequenceData.description,
          trigger: sequenceData.trigger,
          isActive: sequenceData.isActive,
          maxEmails: sequenceData.maxEmails,
          cooldownHours: sequenceData.cooldownHours,
          createdBy: adminUser.id,
        },
      });

      // Create steps for the sequence
      for (const stepData of sequenceData.steps) {
        const template = templates.find(t => t.slug === stepData.templateSlug);

        if (!template) {
          console.warn(
            `⚠️  Template "${stepData.templateSlug}" not found, skipping step ${stepData.order}`
          );
          continue;
        }

        await prisma.emailSequenceStep.create({
          data: {
            sequenceId: sequence.id,
            templateId: template.id,
            order: stepData.order,
            delayHours: stepData.delayHours,
            subject: template.subject,
            content: template.content,
          },
        });
      }

      console.log(
        `✅ Created sequence: ${sequenceData.name} with ${sequenceData.steps.length} steps`
      );
      createdCount++;
    }

    console.log(`\n🎉 Email sequences seeding completed!`);
    console.log(`📊 Created: ${createdCount} sequences`);
    console.log(`⏭️  Skipped: ${skippedCount} sequences (already exist)`);
    console.log(`📧 Total sequences: ${createdCount + skippedCount}`);
  } catch (error) {
    console.error("❌ Error seeding email sequences:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedEmailSequences()
  .then(() => {
    console.log("✅ Email sequences seeding completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Email sequences seeding failed:", error);
    process.exit(1);
  });
