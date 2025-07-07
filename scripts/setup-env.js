#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Setup script to create a basic .env file for development
 */

const ENV_TEMPLATE = `# Application
NODE_ENV=development

# Database - REQUIRED for authentication features
# Replace with your actual database URL
DATABASE_URL="postgresql://username:password@localhost:5432/nextcommerce"

# NextAuth - REQUIRED for authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-secure-random-secret-here"

# Optional: Admin User (for development)
ADMIN_EMAIL=admin@example.com
ADMIN_NAME="Admin User"
# Use this approach for security:
ADMIN_PASSWORD_HASH="generate-this-using-admin-auth-utils"
# Or for development only:
# ADMIN_PASSWORD="your-secure-password"
USE_ENV_ADMIN=false

# Optional: OAuth Providers
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Security
# ENCRYPTION_KEY="32-character-encryption-key-for-data"
# CSRF_SECRET_KEY="strong-csrf-secret-key-for-tokens"

# Optional: Payment Processing
# STRIPE_SECRET_KEY=your-stripe-secret-key
# STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
# STRIPE_PUBLIC_KEY=your-stripe-public-key

# Optional: Email Services
# RESEND_API_KEY=your-resend-api-key
# BREVO_API_KEY=your-brevo-api-key

# Optional: File Upload
# UPLOADTHING_SECRET=your-uploadthing-secret
# UPLOADTHING_APP_ID=your-uploadthing-app-id

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
`;

function generateSecretKey() {
  return crypto.randomBytes(32).toString("hex");
}

function setupEnvironment() {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, ".env");
  const envExamplePath = path.join(projectRoot, ".env.example");

  console.log("🔧 Setting up environment configuration...\n");

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log("❌ .env file already exists!");
    console.log(
      "   To avoid overwriting your configuration, this script will not continue."
    );
    console.log(
      "   If you want to reset your environment, delete .env and run this script again.\n"
    );
    return;
  }

  try {
    // Generate a secure secret
    const nextAuthSecret = generateSecretKey();

    // Create the .env content with generated secret
    const envContent = ENV_TEMPLATE.replace(
      'NEXTAUTH_SECRET="your-secure-random-secret-here"',
      `NEXTAUTH_SECRET="${nextAuthSecret}"`
    );

    // Write the .env file
    fs.writeFileSync(envPath, envContent, "utf8");

    console.log("✅ Created .env file with basic configuration");
    console.log("✅ Generated secure NEXTAUTH_SECRET");
    console.log("\n🔍 Next steps:");
    console.log(
      "   1. Update DATABASE_URL with your actual database connection string"
    );
    console.log("   2. Configure any optional services you want to use");
    console.log("   3. Run `npm run dev` to start development");
    console.log("\n💡 Tips:");
    console.log("   - The current DATABASE_URL is just a placeholder");
    console.log(
      "   - You can set USE_ENV_ADMIN=true for development admin access"
    );
    console.log("   - Check env.example for all available options");
    console.log("\n🚨 Security reminder:");
    console.log("   - Never commit .env to version control");
    console.log("   - Use strong passwords for production databases");
    console.log("   - Keep your secrets secure");
  } catch (error) {
    console.error("❌ Error creating .env file:", error.message);
    process.exit(1);
  }
}

// Run the setup
setupEnvironment();
