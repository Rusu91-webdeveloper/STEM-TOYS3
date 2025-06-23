#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Checking NextAuth Configuration");
console.log("=====================================\n");

// Check for .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  console.log("✅ .env.local exists");

  const envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");

  // Check for NEXTAUTH_SECRET
  const secretLine = lines.find(line => line.startsWith("NEXTAUTH_SECRET="));
  if (secretLine) {
    const secret = secretLine.split("=")[1].replace(/["']/g, "");
    if (secret && secret.length >= 32) {
      console.log("✅ NEXTAUTH_SECRET is set and valid");
    } else {
      console.log(
        "❌ NEXTAUTH_SECRET is too short (must be at least 32 characters)"
      );
    }
  } else {
    console.log("❌ NEXTAUTH_SECRET is missing");
  }

  // Check for NEXTAUTH_URL
  const urlLine = lines.find(line => line.startsWith("NEXTAUTH_URL="));
  if (urlLine) {
    console.log("✅ NEXTAUTH_URL is set");
  } else {
    console.log(
      "⚠️  NEXTAUTH_URL is missing (will default to http://localhost:3000)"
    );
  }

  // Check DATABASE_URL
  const dbLine = lines.find(line => line.startsWith("DATABASE_URL="));
  if (dbLine) {
    console.log("✅ DATABASE_URL is set");
  } else {
    console.log("❌ DATABASE_URL is missing");
  }
} else {
  console.log("❌ .env.local file not found");
}

// Check process.env
console.log("\n📊 Current Environment Variables:");
console.log("NODE_ENV:", process.env.NODE_ENV || "not set");
console.log(
  "NEXTAUTH_SECRET:",
  process.env.NEXTAUTH_SECRET ? "***set***" : "not set"
);
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "not set");

// Provide recommendations
console.log("\n💡 Recommendations:");
console.log("1. If auth is failing, try running: npm run setup:env");
console.log("2. Clear .next directory: rm -rf .next");
console.log("3. Restart dev server: npm run dev:clean");
console.log("4. Check console for any database connection errors");
console.log("\nIf issues persist, check:");
console.log("- Is PostgreSQL running?");
console.log("- Is your DATABASE_URL correct?");
console.log("- Try running: npx prisma db push");
