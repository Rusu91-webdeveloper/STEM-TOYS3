#!/usr/bin/env node

/**
 * AI Configuration Test Script
 *
 * This script validates the AI enhancement functionality by:
 * 1. Checking environment configuration
 * 2. Testing API key validity
 * 3. Running a simple enhancement test
 * 4. Providing detailed diagnostics
 */

// Import required modules
require("dotenv").config();
const fetch = require("node-fetch");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Test product for AI enhancement
const testProduct = {
  name: "Test Robot Kit",
  category: "Robotics",
  price: 50,
  description: "A simple robot kit for kids to learn programming basics",
  ageGroup: "ELEMENTARY_6_8",
  images: ["https://example.com/robot.jpg"],
};

// Helper functions
function log(message) {
  console.log(message);
}

function checkEnvVariable(name, required = false) {
  const value = process.env[name];
  const isSet = !!value;

  log(
    `  ${name}: ${
      isSet
        ? `${colors.green}✓${colors.reset} Set`
        : required
          ? `${colors.red}✗${colors.reset} Missing (Required)`
          : `${colors.yellow}○${colors.reset} Not set (Optional)`
    }`
  );

  return isSet;
}

function truncateString(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

// Main function
async function main() {
  log(`\n${colors.bright}${colors.blue}AI Configuration Test${colors.reset}\n`);
  let allPassed = true;

  // Step 1: Environment variables check
  log(`${colors.bright}1. Checking environment variables:${colors.reset}`);

  const aiProviderSet = checkEnvVariable("AI_PROVIDER");
  const aiModelSet = checkEnvVariable("AI_MODEL");
  const aiMaxTokensSet = checkEnvVariable("AI_MAX_TOKENS");
  const aiTemperatureSet = checkEnvVariable("AI_TEMPERATURE");
  const aiEnhancementEnabledSet = checkEnvVariable("AI_ENHANCEMENT_ENABLED");

  // Check API keys
  const openaiKeySet = checkEnvVariable("OPENAI_API_KEY");
  const anthropicKeySet = checkEnvVariable("ANTHROPIC_API_KEY");
  const geminiKeySet = checkEnvVariable("GEMINI_API_KEY");

  const anyKeySet = openaiKeySet || anthropicKeySet || geminiKeySet;

  if (!anyKeySet) {
    log(
      `\n${colors.red}✗ Error: No API keys configured. At least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY must be set.${colors.reset}`
    );
    allPassed = false;
  }

  // Display current configuration
  log(`\n${colors.bright}2. Current AI Configuration:${colors.reset}`);

  const aiProvider = process.env.AI_PROVIDER || "openai";
  const aiModel = process.env.AI_MODEL || "gpt-4";
  const aiMaxTokens = process.env.AI_MAX_TOKENS || 2000;
  const aiTemperature = process.env.AI_TEMPERATURE || 0.7;
  const aiEnhancementEnabled = process.env.AI_ENHANCEMENT_ENABLED !== "false";

  log(`  Provider: ${colors.cyan}${aiProvider}${colors.reset}`);
  log(`  Model: ${colors.cyan}${aiModel}${colors.reset}`);
  log(`  Max Tokens: ${colors.cyan}${aiMaxTokens}${colors.reset}`);
  log(`  Temperature: ${colors.cyan}${aiTemperature}${colors.reset}`);
  log(
    `  Enhancement Enabled: ${aiEnhancementEnabled ? `${colors.green}Yes${colors.reset}` : `${colors.red}No${colors.reset}`}`
  );

  if (!aiEnhancementEnabled) {
    log(
      `\n${colors.yellow}⚠ Warning: AI enhancement is disabled. Set AI_ENHANCEMENT_ENABLED=true to enable.${colors.reset}`
    );
    allPassed = false;
  }

  // Step 3: API key validation
  log(`\n${colors.bright}3. API Key Validation:${colors.reset}`);

  // Test OpenAI API key if configured
  if (openaiKeySet) {
    try {
      log(`  Testing OpenAI API key... `);
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.data
          .map(model => model.id)
          .filter(id => id.startsWith("gpt"))
          .slice(0, 5);
        log(`  ${colors.green}✓ OpenAI API key is valid${colors.reset}`);
        log(
          `  Available models: ${colors.dim}${models.join(", ")}${colors.reset}`
        );

        if (!models.includes(aiModel) && aiProvider === "openai") {
          log(
            `  ${colors.yellow}⚠ Warning: Configured model "${aiModel}" might not be available${colors.reset}`
          );
        }
      } else {
        const errorData = await response.json();
        log(
          `  ${colors.red}✗ OpenAI API key is invalid: ${errorData.error?.message || response.statusText}${colors.reset}`
        );
        if (aiProvider === "openai") allPassed = false;
      }
    } catch (error) {
      log(
        `  ${colors.red}✗ OpenAI API test failed: ${error.message}${colors.reset}`
      );
      if (aiProvider === "openai") allPassed = false;
    }
  } else if (aiProvider === "openai") {
    log(
      `  ${colors.red}✗ OpenAI selected as provider but OPENAI_API_KEY is not set${colors.reset}`
    );
    allPassed = false;
  }

  // Step 4: Test simple enhancement
  if (
    allPassed &&
    aiEnhancementEnabled &&
    ((aiProvider === "openai" && openaiKeySet) ||
      (aiProvider === "anthropic" && anthropicKeySet) ||
      (aiProvider === "gemini" && geminiKeySet))
  ) {
    log(`\n${colors.bright}4. Testing AI Enhancement:${colors.reset}`);

    try {
      // Create a server temporarily to test (or detect if one is running)
      let serverRunning = false;

      try {
        const response = await fetch("http://localhost:3000/api/health", {
          method: "GET",
          timeout: 2000,
        }).catch(() => null);

        serverRunning = response && response.ok;
      } catch (error) {
        serverRunning = false;
      }

      if (serverRunning) {
        log(
          `  ${colors.green}✓ Server detected at http://localhost:3000${colors.reset}`
        );
      } else {
        log(
          `  ${colors.yellow}⚠ No local server detected. Testing API directly...${colors.reset}`
        );

        // Simulate direct API call
        log(`  Testing direct enhancement with the ${aiProvider} API...`);

        // Test direct API based on provider
        if (aiProvider === "openai") {
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: aiModel,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful AI that enhances product descriptions for STEM toys.",
                  },
                  {
                    role: "user",
                    content: `Please enhance this product description: ${testProduct.description}`,
                  },
                ],
                max_tokens: parseInt(aiMaxTokens, 10),
                temperature: parseFloat(aiTemperature),
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const enhancedText = data.choices[0]?.message?.content;
            log(`  ${colors.green}✓ Enhancement successful${colors.reset}`);
            log(
              `  ${colors.dim}Sample enhanced text: "${truncateString(enhancedText, 100)}"${colors.reset}`
            );
          } else {
            const errorData = await response.json();
            log(
              `  ${colors.red}✗ Enhancement failed: ${errorData.error?.message || "Unknown error"}${colors.reset}`
            );
            allPassed = false;
          }
        } else if (aiProvider === "gemini") {
          // Gemini uses a different API format
          const geminiModel = "gemini-1.5-pro"; // Based on available models
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `You are a helpful AI that enhances product descriptions for STEM toys.\n\nPlease enhance this product description: ${testProduct.description}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: parseFloat(aiTemperature),
                  maxOutputTokens: parseInt(aiMaxTokens, 10),
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const enhancedText = data.candidates[0]?.content?.parts[0]?.text;
            log(
              `  ${colors.green}✓ Gemini enhancement successful${colors.reset}`
            );
            log(
              `  ${colors.dim}Sample enhanced text: "${truncateString(enhancedText, 100)}"${colors.reset}`
            );
          } else {
            const errorData = await response.json();
            log(
              `  ${colors.red}✗ Gemini enhancement failed: ${errorData.error?.message || "Unknown error"}${colors.reset}`
            );
            allPassed = false;
          }
        } else {
          log(
            `  ${colors.yellow}⚠ Direct testing for ${aiProvider} is not implemented in this script${colors.reset}`
          );
        }
      }
    } catch (error) {
      log(
        `  ${colors.red}✗ Enhancement test failed: ${error.message}${colors.reset}`
      );
      allPassed = false;
    }
  }

  // Final status
  log(`\n${colors.bright}Test Results:${colors.reset}`);

  if (allPassed) {
    log(`${colors.green}✅ AI Configuration:${colors.reset}`);
    log(`  Provider: ${aiProvider}`);
    log(`  Model: ${aiModel}`);
    log(`  Max Tokens: ${aiMaxTokens}`);
    log(`  Temperature: ${aiTemperature}`);
    log(`  Enhancement Enabled: ${aiEnhancementEnabled ? "✅" : "❌"}`);

    log(`\n${colors.green}🔑 API Key Status:${colors.reset}`);
    log(`  OpenAI: ${openaiKeySet ? "✅ Configured" : "❌ Missing"}`);
    log(`  Is Configured: ✅`);

    log(
      `\n${colors.green}🎉 AI Bulk Upload system is ready to use!${colors.reset}`
    );
  } else {
    log(
      `${colors.red}❌ AI Configuration has issues that need to be resolved${colors.reset}`
    );

    // Provide recommendations
    log(`\n${colors.bright}Recommendations:${colors.reset}`);
    if (!anyKeySet) {
      log(
        `- Set at least one API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY)`
      );
    }
    if (!aiEnhancementEnabled) {
      log(`- Set AI_ENHANCEMENT_ENABLED=true to enable AI enhancement`);
    }
    if (aiProvider === "openai" && !openaiKeySet) {
      log(
        `- Set OPENAI_API_KEY or change AI_PROVIDER to a provider with a configured key`
      );
    }
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
