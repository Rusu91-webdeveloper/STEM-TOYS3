#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Generate a secure random secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString("base64");
};

// Template for .env.local
const envTemplate = `# Application
NODE_ENV=development

# Database - Replace with your actual database URL
DATABASE_URL="postgresql://username:password@localhost:5432/nextcommerce"

# NextAuth - REQUIRED
NEXTAUTH_URL=http://localhost:3000
# This secret was auto-generated. Keep it secure!
NEXTAUTH_SECRET="${generateSecret()}"

# Admin User (for development)
ADMIN_EMAIL=admin@example.com
ADMIN_NAME="Admin User"
ADMIN_PASSWORD="securepassword123"
USE_ENV_ADMIN=true

# OAuth Providers (optional - uncomment and fill if using)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (optional - uncomment and fill if using)
# STRIPE_SECRET_KEY=your-stripe-secret-key
# STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key  
# STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Email Services (optional - uncomment and fill if using)
# RESEND_API_KEY=your-resend-api-key

# File Upload (optional - uncomment and fill if using)
# UPLOADTHING_SECRET=your-uploadthing-secret
# UPLOADTHING_APP_ID=your-uploadthing-app-id

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
`;

const envPath = path.join(process.cwd(), ".env.local");

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log("⚠️  .env.local already exists!");
  console.log("📋 Here's a secure NEXTAUTH_SECRET you can use:");
  console.log(`\nNEXTAUTH_SECRET="${generateSecret()}"\n`);
  console.log("Add this to your .env.local file if needed.");
} else {
  // Create .env.local
  fs.writeFileSync(envPath, envTemplate);
  console.log("✅ Created .env.local with secure defaults");
  console.log(
    "📝 Please update the DATABASE_URL and any other services you're using"
  );
}

// Also create .env.example if it doesn't exist
const examplePath = path.join(process.cwd(), ".env.example");
if (!fs.existsSync(examplePath)) {
  const exampleTemplate = envTemplate.replace(
    generateSecret(),
    "your-secret-key-here-at-least-32-characters"
  );
  fs.writeFileSync(examplePath, exampleTemplate);
  console.log("✅ Created .env.example for reference");
}
