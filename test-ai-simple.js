#!/usr/bin/env node

/**
 * Simple AI Configuration Test
 * Tests AI configuration without TypeScript compilation
 */

console.log("🔍 Checking AI Environment Variables...\n");

// Check environment variables directly
const aiConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  provider: process.env.AI_PROVIDER || "openai",
  model: process.env.AI_MODEL || "gpt-4",
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || "2000"),
  temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  enhancementEnabled: process.env.AI_ENHANCEMENT_ENABLED === "true",
};

// Check if any AI service is configured
const isConfigured = !!(
  aiConfig.openaiApiKey ||
  aiConfig.anthropicApiKey ||
  aiConfig.geminiApiKey
);

console.log("🤖 AI Configuration:");
console.log(`  Provider: ${aiConfig.provider}`);
console.log(`  Model: ${aiConfig.model}`);
console.log(`  Max Tokens: ${aiConfig.maxTokens}`);
console.log(`  Temperature: ${aiConfig.temperature}`);
console.log(
  `  Enhancement Enabled: ${aiConfig.enhancementEnabled ? "✅" : "❌"}`
);
console.log(`  Is Configured: ${isConfigured ? "✅" : "❌"}\n`);

// Display API key status (without exposing keys)
console.log("🔑 API Key Status:");
console.log(
  `  OpenAI: ${aiConfig.openaiApiKey ? "✅ Configured" : "❌ Missing"}`
);
console.log(
  `  Anthropic: ${aiConfig.anthropicApiKey ? "✅ Configured" : "❌ Missing"}`
);
console.log(
  `  Gemini: ${aiConfig.geminiApiKey ? "✅ Configured" : "❌ Missing"}\n`
);

// Check other required environment variables
console.log("🔐 Other Required Variables:");
console.log(
  `  NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing"}`
);
console.log(
  `  NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing"}`
);
console.log(
  `  DATABASE_URL: ${process.env.DATABASE_URL ? "✅ Set" : "❌ Missing"}\n`
);

// Validation results
if (isConfigured && aiConfig.enhancementEnabled) {
  console.log("🎉 AI Bulk Upload system appears to be ready!");
  console.log("✅ At least one AI API key is configured");
  console.log("✅ AI enhancement is enabled");
} else {
  console.log("⚠️  AI Bulk Upload system needs configuration:");
  if (!isConfigured) {
    console.log("   ❌ No AI API keys found");
    console.log(
      "   Please set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY"
    );
  }
  if (!aiConfig.enhancementEnabled) {
    console.log("   ❌ AI enhancement is disabled");
    console.log("   Please set AI_ENHANCEMENT_ENABLED=true");
  }
}

console.log("\n📝 To fix configuration issues:");
console.log("1. Check your .env file");
console.log("2. Ensure environment variables are set correctly");
console.log("3. Restart your development server after making changes");
