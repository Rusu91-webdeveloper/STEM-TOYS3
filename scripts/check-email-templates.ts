#!/usr/bin/env tsx

/**
 * Script to check email templates in database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkEmailTemplates() {
  try {
    console.log("🔍 Checking email templates in database...");

    // Get total count
    const totalCount = await prisma.emailTemplate.count();
    console.log(`📊 Total templates in database: ${totalCount}`);

    // Get active templates
    const activeCount = await prisma.emailTemplate.count({
      where: { isActive: true },
    });
    console.log(`✅ Active templates: ${activeCount}`);

    // Get inactive templates
    const inactiveCount = await prisma.emailTemplate.count({
      where: { isActive: false },
    });
    console.log(`❌ Inactive templates: ${inactiveCount}`);

    // Get templates by category
    const categories = await prisma.emailTemplate.groupBy({
      by: ["category"],
      _count: {
        category: true,
      },
    });

    console.log("\n📂 Templates by category:");
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count.category} templates`);
    });

    // Get first 5 templates
    const sampleTemplates = await prisma.emailTemplate.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n📝 Sample templates:");
    sampleTemplates.forEach(template => {
      console.log(
        `   ${template.name} (${template.slug}) - ${template.category} - ${template.isActive ? "Active" : "Inactive"}`
      );
    });
  } catch (error) {
    console.error("💥 Error checking templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailTemplates().catch(console.error);
