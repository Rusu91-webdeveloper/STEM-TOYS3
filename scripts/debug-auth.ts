#!/usr/bin/env tsx

/**
 * Script to debug authentication issues
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugAuth() {
  try {
    console.log("🔍 Debugging authentication issues...");

    // Check admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log(`\n👑 Admin users in database:`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Active: ${user.isActive}`);
      console.log(`      Created: ${user.createdAt}`);
      console.log("");
    });

    // Check if there are any users with the emails you might be using
    const testEmails = [
      "rusu.emanuel.webdeveloper@gmail.com",
      "rusu.jobs@gmail.com",
      "rusuemanuel1991@gmail.com",
      "webira.rem.srl@gmail.com",
    ];

    console.log(`\n🔍 Checking specific email addresses:`);
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (user) {
        console.log(`   ✅ ${email}:`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Active: ${user.isActive}`);
      } else {
        console.log(`   ❌ ${email}: Not found in database`);
      }
    }

    // Check recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log(`\n📝 Recent users (last 5):`);
    recentUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - Active: ${user.isActive}`
      );
    });
  } catch (error) {
    console.error("💥 Error debugging auth:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth().catch(console.error);
