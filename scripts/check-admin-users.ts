#!/usr/bin/env tsx

/**
 * Script to check admin users in database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log("👤 Checking admin users in database...");

    // Get all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📊 Total users in database: ${users.length}`);

    // Count by role
    const roleCounts = users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("\n👥 Users by role:");
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });

    // Show admin users
    const adminUsers = users.filter(user => user.role === "ADMIN");
    console.log(`\n🔑 Admin users: ${adminUsers.length}`);

    adminUsers.forEach(user => {
      console.log(`   ${user.name} (${user.email}) - Active: ${user.isActive}`);
    });

    // Show all users
    console.log("\n📝 All users:");
    users.forEach(user => {
      console.log(
        `   ${user.name} (${user.email}) - ${user.role} - Active: ${user.isActive}`
      );
    });
  } catch (error) {
    console.error("💥 Error checking users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers().catch(console.error);
