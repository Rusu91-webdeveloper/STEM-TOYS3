#!/usr/bin/env tsx

/**
 * Script to test authentication status and admin access
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testAuthStatus() {
  try {
    console.log("🔐 Testing authentication and admin access...");

    // Check admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    console.log(`\n👑 Admin users available:`);
    adminUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.name} (${user.email}) - Active: ${user.isActive}`
      );
    });

    // Check email templates count
    const templateCount = await prisma.emailTemplate.count();
    console.log(`\n📧 Email templates in database: ${templateCount}`);

    if (templateCount > 0) {
      const sampleTemplates = await prisma.emailTemplate.findMany({
        take: 3,
        select: {
          name: true,
          slug: true,
          category: true,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`\n📝 Sample templates:`);
      sampleTemplates.forEach(template => {
        console.log(
          `   - ${template.name} (${template.slug}) - ${template.category}`
        );
      });
    }

    console.log(`\n✅ To access email templates:`);
    console.log(`   1. Go to http://localhost:3000/auth/login`);
    console.log(`   2. Log in with one of the admin accounts above`);
    console.log(
      `   3. Navigate to http://localhost:3000/admin/email-templates`
    );
    console.log(`   4. You should see all ${templateCount} templates!`);
  } catch (error) {
    console.error("💥 Error testing auth status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthStatus().catch(console.error);
