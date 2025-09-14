#!/usr/bin/env tsx

/**
 * Script to check admin user passwords
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminPasswords() {
  try {
    console.log("🔍 Checking admin user passwords...");

    // Get admin users with password info
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true,
      },
    });

    console.log(`\\n👑 Admin users (${adminUsers.length}):`);

    for (const user of adminUsers) {
      console.log(`\\n📧 ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Has Password: ${user.password ? "Yes" : "No"}`);
      if (user.password) {
        console.log(`   Password Length: ${user.password.length}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      }
    }

    // Test password verification
    console.log(`\\n🧪 Testing password verification...`);

    for (const user of adminUsers) {
      if (user.password) {
        const bcrypt = require("bcryptjs");

        // Test with common passwords
        const testPasswords = ["admin123", "password", "admin", "123456"];

        for (const testPassword of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPassword, user.password);
            if (isValid) {
              console.log(
                `   ✅ ${user.email}: Password '${testPassword}' is VALID`
              );
            } else {
              console.log(
                `   ❌ ${user.email}: Password '${testPassword}' is invalid`
              );
            }
          } catch (error) {
            console.log(
              `   ⚠️  ${user.email}: Error testing password '${testPassword}': ${error}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking admin passwords:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPasswords();
