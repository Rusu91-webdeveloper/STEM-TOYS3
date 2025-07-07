#!/usr/bin/env node

// Load environment variables using dotenv
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const fs = require("fs");
const path = require("path");

function checkEnvironmentVariables() {
  console.log("🔍 Environment Variable Checker\n");

  // Check NODE_ENV
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);

  // Check if .env files exist
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ];
  console.log("\n📁 Environment Files:");

  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    console.log(`  ${file}: ${exists ? "✅ exists" : "❌ not found"}`);
  });

  // Check DATABASE_URL specifically
  console.log("\n🗄️  Database Configuration:");
  console.log(
    `DATABASE_URL: ${process.env.DATABASE_URL ? "✅ set" : "❌ not set"}`
  );

  if (!process.env.DATABASE_URL) {
    // Try to read from .env.local
    const envLocalPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      try {
        const content = fs.readFileSync(envLocalPath, "utf8");
        const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
        if (dbUrlMatch) {
          console.log("  DATABASE_URL found in .env.local: ✅");
          console.log(`  Value preview: ${dbUrlMatch[1].substring(0, 30)}...`);
        } else {
          console.log("  DATABASE_URL not found in .env.local: ❌");
        }
      } catch (error) {
        console.log(`  Error reading .env.local: ${error.message}`);
      }
    }
  } else {
    console.log(
      `  Value preview: ${process.env.DATABASE_URL.substring(0, 30)}...`
    );
  }

  // Check other important variables
  console.log("\n🔐 Authentication Configuration:");
  console.log(
    `NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "✅ set" : "❌ not set"}`
  );
  console.log(
    `GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "✅ set" : "❌ not set"}`
  );
  console.log(
    `GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? "✅ set" : "❌ not set"}`
  );

  console.log("\n🚀 Quick Fix Suggestions:");

  if (!process.env.DATABASE_URL) {
    console.log("❌ DATABASE_URL not accessible to Node.js process");
    console.log("   Try: npm run dev or restart your development server");
    console.log("   Ensure .env.local is in the project root");
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.log("❌ NEXTAUTH_SECRET missing - this can cause auth issues");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("❌ Google OAuth credentials missing");
  }

  console.log("\n✅ Environment check complete!");
}

checkEnvironmentVariables();
