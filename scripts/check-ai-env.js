#!/usr/bin/env node

/**
 * AI Environment Configuration Checker
 * Validates that all required AI environment variables are properly configured
 */

const { envConfig } = require("../lib/config/environment.ts");

console.log("🔍 Checking AI Environment Configuration...\n");

try {
  // Validate environment configuration
  envConfig.validate();

  // Get AI configuration
  const aiConfig = envConfig.ai;
  const serviceHealth = envConfig.getServiceHealth();

  console.log("✅ Environment configuration is valid\n");

  // Display AI configuration
  console.log("🤖 AI Configuration:");
  console.log(`  Provider: ${aiConfig.provider}`);
  console.log(`  Model: ${aiConfig.model}`);
  console.log(`  Max Tokens: ${aiConfig.maxTokens}`);
  console.log(`  Temperature: ${aiConfig.temperature}`);
  console.log(
    `  Enhancement Enabled: ${aiConfig.enhancementEnabled ? "✅" : "❌"}`
  );
  console.log(`  Is Configured: ${aiConfig.isConfigured ? "✅" : "❌"}\n`);

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

  // Display service health
  console.log("🏥 Service Health:");
  console.log(`  Database: ${serviceHealth.database ? "✅" : "❌"}`);
  console.log(`  Redis: ${serviceHealth.redis ? "✅" : "❌"}`);
  console.log(`  AI: ${serviceHealth.ai ? "✅" : "❌"}\n`);

  // Validation results
  if (aiConfig.isConfigured) {
    console.log("🎉 AI Bulk Upload system is ready to use!");
  } else {
    console.log("⚠️  AI Bulk Upload system requires API key configuration");
    console.log(
      "   Please set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY"
    );
  }
} catch (error) {
  console.error("❌ Environment configuration validation failed:");
  console.error(error.message);
  process.exit(1);
}
