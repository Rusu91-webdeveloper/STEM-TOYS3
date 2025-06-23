#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

console.log("🚀 STEM TOYS Development Setup");
console.log("==============================\n");

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split(".")[0].substring(1));
if (majorVersion < 18) {
  console.error("❌ Node.js 18 or higher is required");
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if npm is installed
try {
  const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.error("❌ npm is not installed");
  process.exit(1);
}

// Check for .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.log("\n📝 Creating .env.local file...");

  const secret = crypto.randomBytes(32).toString("base64");
  const envContent = `# Application
NODE_ENV=development

# Database - Update with your PostgreSQL connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nextcommerce_dev"

# NextAuth - REQUIRED
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="${secret}"

# Admin User (for development)
ADMIN_EMAIL=admin@example.com
ADMIN_NAME="Admin User"
ADMIN_PASSWORD="admin123"
USE_ENV_ADMIN=true

# Optional Services - Uncomment and fill if using
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=
# RESEND_API_KEY=
# UPLOADTHING_SECRET=
# UPLOADTHING_APP_ID=

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
`;

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Created .env.local with secure defaults");
  console.log("⚠️  Please update DATABASE_URL with your PostgreSQL connection");
} else {
  console.log("✅ .env.local exists");

  // Check if NEXTAUTH_SECRET is set
  const envContent = fs.readFileSync(envPath, "utf8");
  if (
    !envContent.includes("NEXTAUTH_SECRET=") ||
    envContent.includes('NEXTAUTH_SECRET=""')
  ) {
    console.log("\n⚠️  NEXTAUTH_SECRET is missing or empty");
    const secret = crypto.randomBytes(32).toString("base64");
    console.log("📋 Add this to your .env.local:");
    console.log(`NEXTAUTH_SECRET="${secret}"\n`);
  }
}

// Check dependencies
console.log("\n📦 Checking dependencies...");
const packageJsonPath = path.join(process.cwd(), "package.json");
if (!fs.existsSync(packageJsonPath)) {
  console.error("❌ package.json not found");
  process.exit(1);
}

const nodeModulesPath = path.join(process.cwd(), "node_modules");
if (!fs.existsSync(nodeModulesPath)) {
  console.log("📦 Installing dependencies...");
  try {
    execSync("npm install", { stdio: "inherit" });
    console.log("✅ Dependencies installed");
  } catch (error) {
    console.error("❌ Failed to install dependencies");
    process.exit(1);
  }
} else {
  console.log("✅ Dependencies installed");
}

// Check Prisma
console.log("\n🗄️  Checking database setup...");
try {
  execSync("npx prisma generate", { stdio: "pipe" });
  console.log("✅ Prisma client generated");
} catch (error) {
  console.error("❌ Failed to generate Prisma client");
  console.log("   Run: npx prisma generate");
}

// Clean .next directory if it exists (to prevent cache issues)
const nextDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextDir)) {
  console.log("\n🧹 Cleaning .next directory...");
  try {
    execSync("rm -rf .next", { stdio: "pipe" });
    console.log("✅ Cleaned .next directory");
  } catch (error) {
    console.log("⚠️  Could not clean .next directory");
  }
}

// Provide helpful next steps
console.log("\n✨ Setup complete!\n");
console.log("Next steps:");
console.log(
  "1. Update DATABASE_URL in .env.local with your PostgreSQL connection"
);
console.log("2. Run database migrations: npx prisma db push");
console.log("3. (Optional) Seed the database: npm run seed");
console.log("4. Start the development server: npm run dev");
console.log("\nIf you encounter issues:");
console.log("- Check that PostgreSQL is running");
console.log("- Verify your DATABASE_URL is correct");
console.log("- Run: npm run dev:clean (to clean and restart)");
console.log("\n�� Happy coding!");
