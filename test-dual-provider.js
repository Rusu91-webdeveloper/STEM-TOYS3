#!/usr/bin/env node

/**
 * Test Dual-Provider Configuration
 * Shows how the system detects both API keys for dual-provider mode
 */

console.log("🔍 Testing Dual-Provider Configuration...\n");

// Check environment variables directly
const config = {
  openaiKey: process.env.OPENAI_API_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  provider: process.env.AI_PROVIDER || "gemini",
  enhancementEnabled: process.env.AI_ENHANCEMENT_ENABLED === "true",
};

console.log("🤖 Current Configuration:");
console.log(`  Primary Provider: ${config.provider}`);
console.log(
  `  Enhancement Enabled: ${config.enhancementEnabled ? "✅" : "❌"}\n`
);

console.log("🔑 API Keys Status:");
console.log(
  `  OpenAI Key: ${config.openaiKey ? "✅ Configured" : "❌ Missing"}`
);
console.log(
  `  Gemini Key: ${config.geminiKey ? "✅ Configured" : "❌ Missing"}\n`
);

// Check dual-provider readiness
const isDualProviderReady = !!(
  config.openaiKey &&
  config.geminiKey &&
  config.enhancementEnabled
);

console.log("🚀 Dual-Provider Mode:");
if (isDualProviderReady) {
  console.log("✅ READY FOR DUAL-PROVIDER MODE!");
  console.log("  ✅ Both API keys are configured");
  console.log("  ✅ Enhancement is enabled");
  console.log("\n🎯 How it works:");
  console.log("  1. Gemini generates initial content (cheap, fast)");
  console.log("  2. OpenAI refines and validates (quality control)");
  console.log("  3. Best of both worlds!");

  console.log("\n📡 API Endpoint to use:");
  console.log("  POST /api/admin/products/dual-enhance");
  console.log("  (Instead of /api/admin/products/ai-enhance)");
} else {
  console.log("❌ NOT READY FOR DUAL-PROVIDER MODE");
  if (!config.openaiKey) console.log("  ❌ OpenAI API key missing");
  if (!config.geminiKey) console.log("  ❌ Gemini API key missing");
  if (!config.enhancementEnabled) console.log("  ❌ Enhancement disabled");
}

console.log("\n📋 Vercel Environment Variables Needed:");
console.log("OPENAI_API_KEY=sk-proj-your-openai-key-here");
console.log("GEMINI_API_KEY=AIzaSy-your-gemini-key-here");
console.log("AI_PROVIDER=gemini");
console.log("AI_ENHANCEMENT_ENABLED=true");
console.log("AI_MODEL=gemini-1.5-pro");
console.log("AI_MAX_TOKENS=2000");
console.log("AI_TEMPERATURE=0.7");
