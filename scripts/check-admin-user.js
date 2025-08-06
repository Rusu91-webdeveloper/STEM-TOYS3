const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log("🔍 Checking admin user in database...");

    // Check for admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log(`Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach(user => {
      console.log(
        `- ${user.name} (${user.email}) - Active: ${user.isActive}, Verified: ${!!user.emailVerified}`
      );
    });

    // Check environment variables
    console.log("\n🔧 Checking environment variables...");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
    console.log("ADMIN_NAME:", process.env.ADMIN_NAME);
    console.log("USE_ENV_ADMIN:", process.env.USE_ENV_ADMIN);
    console.log(
      "NEXTAUTH_SECRET:",
      process.env.NEXTAUTH_SECRET ? "***set***" : "not set"
    );
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

    // Check if admin email matches any user
    if (process.env.ADMIN_EMAIL) {
      const envAdminUser = await prisma.user.findUnique({
        where: {
          email: process.env.ADMIN_EMAIL,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (envAdminUser) {
        console.log(
          `\n✅ Environment admin email matches database user: ${envAdminUser.name} (${envAdminUser.email})`
        );
      } else {
        console.log(
          `\n⚠️  Environment admin email (${process.env.ADMIN_EMAIL}) not found in database`
        );
      }
    }

    // Check total users
    const totalUsers = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);
  } catch (error) {
    console.error("❌ Error checking admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
