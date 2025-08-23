#!/usr/bin/env node

/**
 * Check production environment variables for authentication
 */

console.log("🔍 Checking Production Environment Variables...\n");

// Check critical environment variables
const criticalVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL',
  'VERCEL_URL',
  'NODE_ENV'
];

console.log("📋 Critical Environment Variables:");
criticalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? "✅" : "❌";
  const displayValue = value ? 
    (varName.includes('SECRET') || varName.includes('CLIENT_SECRET') ? 
      value.substring(0, 10) + "..." : value) : 
    "NOT SET";
  console.log(`  ${status} ${varName}: ${displayValue}`);
});

// Check NextAuth configuration
console.log("\n🔧 NextAuth Configuration:");
const nextAuthUrl = process.env.NEXTAUTH_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
console.log(`  NextAuth URL: ${nextAuthUrl}`);

const hasGoogleCredentials = !!(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) && 
  !!(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET);
console.log(`  Google OAuth: ${hasGoogleCredentials ? "✅ Configured" : "❌ Not Configured"}`);

const hasSecret = !!process.env.NEXTAUTH_SECRET;
console.log(`  NextAuth Secret: ${hasSecret ? "✅ Set" : "❌ Not Set"}`);

// Recommendations
console.log("\n🎯 Recommendations:");
if (!hasGoogleCredentials) {
  console.log("  ❌ Add Google OAuth credentials to Vercel environment variables:");
  console.log("     - AUTH_GOOGLE_ID or GOOGLE_CLIENT_ID");
  console.log("     - AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET");
}

if (!hasSecret) {
  console.log("  ❌ Add NEXTAUTH_SECRET to Vercel environment variables");
}

if (!process.env.DATABASE_URL) {
  console.log("  ❌ Add DATABASE_URL to Vercel environment variables");
}

console.log("\n🚀 To fix the configuration error:");
console.log("1. Go to your Vercel dashboard");
console.log("2. Navigate to your project settings");
console.log("3. Go to Environment Variables");
console.log("4. Add the missing variables listed above");
console.log("5. Redeploy your application");

console.log("\n✅ Environment check completed!");
