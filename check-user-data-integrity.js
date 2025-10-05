require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUserDataIntegrity() {
  console.log("🔍 Checking User table data integrity...\n");

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        role: true,
        emailVerified: true,
        verificationToken: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            addresses: true,
            orders: true,
            blogs: true,
          },
        },
      },
    });

    console.log(`👥 Total Users: ${users.length}\n`);

    let issues = [];

    // Check 1: Email uniqueness
    console.log("📧 Checking email uniqueness...");
    const emails = users.map(u => u.email);
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      issues.push(
        `❌ Email uniqueness violation: Found ${emails.length - uniqueEmails.size} duplicate emails`
      );
      const duplicates = emails.filter(
        (email, index) => emails.indexOf(email) !== index
      );
      console.log("   Duplicate emails:", [...new Set(duplicates)]);
    } else {
      console.log("   ✅ All emails are unique");
    }

    // Check 2: Email format validation
    console.log("\n📧 Checking email format...");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = users.filter(u => !emailRegex.test(u.email));
    if (invalidEmails.length > 0) {
      issues.push(`❌ Invalid email formats: ${invalidEmails.length} users`);
      console.log(
        "   Invalid emails:",
        invalidEmails.map(u => u.email)
      );
    } else {
      console.log("   ✅ All emails have valid format");
    }

    // Check 3: Role validation
    console.log("\n👤 Checking role validation...");
    const validRoles = ["CUSTOMER", "ADMIN", "SUPPLIER", "VISITOR"];
    const invalidRoles = users.filter(u => !validRoles.includes(u.role));
    if (invalidRoles.length > 0) {
      issues.push(`❌ Invalid roles: ${invalidRoles.length} users`);
      console.log(
        "   Invalid roles:",
        invalidRoles.map(u => `${u.email}: ${u.role}`)
      );
    } else {
      console.log("   ✅ All roles are valid");
    }

    // Role distribution
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    console.log("   Role distribution:", roleCounts);

    // Check 4: Password hash integrity
    console.log("\n🔐 Checking password hash integrity...");
    const bcryptRegex = /^\$2[ayb]\$.{56}$/; // bcrypt hash pattern
    const invalidPasswords = users.filter(
      u => u.password && !bcryptRegex.test(u.password)
    );
    if (invalidPasswords.length > 0) {
      issues.push(
        `❌ Invalid password hashes: ${invalidPasswords.length} users`
      );
      console.log(
        "   Users with invalid hashes:",
        invalidPasswords.map(u => u.email)
      );
    } else {
      console.log("   ✅ All password hashes are valid");
    }

    // Check 5: Verification status consistency
    console.log("\n✅ Checking verification status consistency...");
    const inconsistentVerification = users.filter(
      u =>
        (u.emailVerified && !u.isActive) ||
        (u.verificationToken && u.emailVerified)
    );
    if (inconsistentVerification.length > 0) {
      issues.push(
        `❌ Verification status inconsistencies: ${inconsistentVerification.length} users`
      );
      console.log(
        "   Inconsistent users:",
        inconsistentVerification.map(u => ({
          email: u.email,
          emailVerified: u.emailVerified,
          isActive: u.isActive,
          hasToken: !!u.verificationToken,
        }))
      );
    } else {
      console.log("   ✅ Verification status is consistent");
    }

    // Check 6: Timestamp validation
    console.log("\n🕒 Checking timestamp validation...");
    const now = new Date();
    const invalidTimestamps = users.filter(u => {
      const createdAt = new Date(u.createdAt);
      const updatedAt = new Date(u.updatedAt);
      return createdAt > now || updatedAt > now || updatedAt < createdAt;
    });
    if (invalidTimestamps.length > 0) {
      issues.push(`❌ Invalid timestamps: ${invalidTimestamps.length} users`);
      console.log(
        "   Users with invalid timestamps:",
        invalidTimestamps.map(u => ({
          email: u.email,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }))
      );
    } else {
      console.log("   ✅ All timestamps are valid");
    }

    // Check 7: Data normalization (null/empty values)
    console.log("\n📋 Checking data normalization...");
    const nullNameUsers = users.filter(u => !u.name || u.name.trim() === "");
    if (nullNameUsers.length > 0) {
      console.log(`   ⚠️  ${nullNameUsers.length} users have null/empty names`);
    }

    const nullPhoneUsers = users.filter(u => !u.phone || u.phone.trim() === "");
    if (nullPhoneUsers.length > 0) {
      console.log(
        `   ⚠️  ${nullPhoneUsers.length} users have null/empty phones`
      );
    }

    // Check 8: Relationship integrity
    console.log("\n🔗 Checking relationship integrity...");
    const usersWithRelationships = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            addresses: true,
            orders: true,
            blogs: true,
            passwordResetTokens: true,
            paymentCards: true,
            returns: true,
            reviews: true,
            tickets: true,
            wishlistItems: true,
          },
        },
      },
    });

    const totalRelationships = usersWithRelationships.reduce((acc, user) => {
      return (
        acc + Object.values(user._count).reduce((sum, count) => sum + count, 0)
      );
    }, 0);

    console.log(`   Total relationships: ${totalRelationships}`);
    console.log(
      "   Average relationships per user:",
      (totalRelationships / users.length).toFixed(2)
    );

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 DATA INTEGRITY SUMMARY");
    console.log("=".repeat(50));

    if (issues.length === 0) {
      console.log("✅ ALL CHECKS PASSED - User data integrity is good!");
    } else {
      console.log(`❌ FOUND ${issues.length} ISSUES:`);
      issues.forEach((issue, index) =>
        console.log(`   ${index + 1}. ${issue}`)
      );
    }

    console.log(`\n📈 User Statistics:`);
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Active users: ${users.filter(u => u.isActive).length}`);
    console.log(
      `   - Verified users: ${users.filter(u => u.emailVerified).length}`
    );
    console.log(
      `   - Users with pending verification: ${users.filter(u => u.verificationToken).length}`
    );
  } catch (error) {
    console.error("❌ Data integrity check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserDataIntegrity();
