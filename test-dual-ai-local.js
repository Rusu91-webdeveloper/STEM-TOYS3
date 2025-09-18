#!/usr/bin/env node

/**
 * Test Dual-Provider AI Enhancement Locally
 * Simulates the dual-provider flow to test both Gemini and OpenAI
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 Testing Dual-Provider AI Enhancement Locally...\n");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

// Test configuration
const testProduct = {
  name: "Arduino Starter Kit",
  price: 89.99,
  category: "Electronics",
  description: "Basic Arduino kit for beginners",
  images: [],
  sku: "ARD-001",
  stockQuantity: 50,
};

const options = {
  includeRomanianOptimization: true,
  includeSEOMetadata: true,
  includeLearningOutcomes: true,
  includeAgeGroup: true,
  includeStemDiscipline: true,
  includeProductType: true,
};

const config = {
  primaryProvider: "gemini",
  primaryModel: "gemini-1.5-pro",
  secondaryProvider: "openai",
  secondaryModel: "gpt-3.5-turbo",
  refinementOptions: {
    validateContent: true,
    improveSEO: true,
    fixGrammar: true,
    ensureDbCompatibility: true,
  },
};

// Check environment
console.log("🔍 Environment Check:");
console.log(
  `  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ Set" : "❌ Missing"}`
);
console.log(
  `  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing"}`
);
console.log(`  AI_ENHANCEMENT_ENABLED: ${process.env.AI_ENHANCEMENT_ENABLED}`);
console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER}\n`);

// Test payload
const payload = {
  products: [testProduct],
  options: options,
  config: config,
};

console.log("📦 Test Payload:");
console.log(`  Input size: ${JSON.stringify(payload).length} bytes`);
console.log(`  Product: ${testProduct.name}`);
console.log(
  `  Options: ${Object.keys(options).filter(k => options[k]).length} enabled features`
);
console.log(
  `  Config: ${config.primaryProvider} → ${config.secondaryProvider}\n`
);

// Create curl command
const curlCommand = `curl -X POST "http://localhost:3001/api/admin/products/dual-enhance" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '${JSON.stringify(payload).replace(/'/g, "'\\''")}' \\
  --max-time 60 \\
  -w "\\nHTTP Status: %{http_code}\\nResponse Size: %{size_download} bytes\\nTotal Time: %{time_total}s\\n"`;

console.log("🧪 Test Command:");
console.log("To test manually, run:");
console.log(curlCommand);
console.log("\n" + "=".repeat(80));

console.log("\n💡 What to expect:");
console.log("✅ Status: 200 (or 403 if not authenticated)");
console.log("✅ Size: 5000-15000 bytes (enhanced content)");
console.log("✅ Time: 10-30 seconds (AI processing)");
console.log("✅ Response should include:");
console.log("   - Enhanced descriptions");
console.log("   - SEO metadata");
console.log("   - Learning outcomes");
console.log("   - Romanian optimization");
console.log("   - Age groups and STEM disciplines");

console.log("\n❌ If you get 514 bytes:");
console.log("   - AI keys not loaded properly");
console.log("   - Enhancement failing silently");
console.log("   - Check server logs for errors");

console.log("\n🔧 Next Steps:");
console.log("1. Make sure you're logged in as admin at localhost:3001");
console.log("2. Try the upload via the web interface");
console.log("3. Check browser network tab for actual request/response");
console.log("4. Look for any console errors in browser/server");
