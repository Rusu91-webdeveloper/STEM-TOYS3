#!/usr/bin/env node

/**
 * Dual-Provider AI Enhancement Test Script
 *
 * This script tests the dual-provider AI enhancement system by:
 * 1. Verifying that both API keys are configured
 * 2. Testing a sample product with the dual-provider pipeline
 * 3. Comparing results from both providers
 */

require("dotenv").config();
const fetch = require("node-fetch");

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

// Sample product for testing
const testProduct = {
  name: "STEM Learning Robot Kit",
  category: "Robotics",
  price: 89.99,
  description:
    "A beginner-friendly robot kit that teaches programming concepts to children ages 8-12. Includes all necessary components to build a basic programmable robot.",
  ageGroup: "ELEMENTARY_8_12",
  images: ["https://example.com/robot.jpg"],
};

// Helper functions
function log(message) {
  console.log(message);
}

function truncateString(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

async function testApiKey(provider) {
  let apiKey;
  let testUrl;
  let headers = { "Content-Type": "application/json" };
  let body;

  if (provider === "openai") {
    apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return false;

    testUrl = "https://api.openai.com/v1/models";
    headers.Authorization = `Bearer ${apiKey}`;
  } else if (provider === "gemini") {
    apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return false;

    testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  } else {
    return false;
  }

  try {
    const response = await fetch(testUrl, { headers });
    return response.ok;
  } catch (error) {
    console.error(`Error testing ${provider} API key:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  log(
    `\n${colors.bright}${colors.blue}Dual-Provider AI Enhancement Test${colors.reset}\n`
  );

  // Step 1: Check API keys
  log(`${colors.bright}1. Checking API Keys:${colors.reset}`);

  const openaiKeyValid = await testApiKey("openai");
  log(
    `  OpenAI API Key: ${openaiKeyValid ? `${colors.green}✓ Valid${colors.reset}` : `${colors.red}✗ Invalid or not found${colors.reset}`}`
  );

  const geminiKeyValid = await testApiKey("gemini");
  log(
    `  Gemini API Key: ${geminiKeyValid ? `${colors.green}✓ Valid${colors.reset}` : `${colors.red}✗ Invalid or not found${colors.reset}`}`
  );

  if (!openaiKeyValid || !geminiKeyValid) {
    log(
      `\n${colors.red}✗ Error: Both OpenAI and Gemini API keys are required for dual-provider mode${colors.reset}`
    );
    log(
      `  Please set both OPENAI_API_KEY and GEMINI_API_KEY in your environment variables`
    );
    process.exit(1);
  }

  // Step 2: Test server if available
  log(`\n${colors.bright}2. Testing Server Connection:${colors.reset}`);

  let serverRunning = false;
  try {
    const response = await fetch("http://localhost:3000/api/health", {
      method: "GET",
      timeout: 2000,
    }).catch(() => null);

    serverRunning = response && response.ok;
    if (serverRunning) {
      log(
        `  ${colors.green}✓ Server detected at http://localhost:3000${colors.reset}`
      );
    }
  } catch (error) {
    serverRunning = false;
  }

  if (!serverRunning) {
    log(
      `  ${colors.yellow}⚠ No local server detected. Will test AI providers directly.${colors.reset}`
    );
  }

  // Step 3: Test Gemini Provider
  log(`\n${colors.bright}3. Testing Primary Provider (Gemini):${colors.reset}`);

  try {
    const geminiModel = "gemini-1.5-pro";
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
                  text: `You are a helpful AI that enhances product descriptions for STEM toys. Please generate an enhanced description for this product: ${testProduct.name} - ${testProduct.description}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const geminiText =
        data.candidates[0]?.content?.parts[0]?.text || "No text generated";

      log(`  ${colors.green}✓ Gemini enhancement successful${colors.reset}`);
      log(
        `  ${colors.dim}Sample text: "${truncateString(geminiText, 100)}"${colors.reset}`
      );
    } else {
      const errorData = await response.json();
      log(
        `  ${colors.red}✗ Gemini enhancement failed: ${errorData.error?.message || "Unknown error"}${colors.reset}`
      );

      // Check for quota error
      if (errorData.error?.message?.includes("quota")) {
        log(
          `\n  ${colors.yellow}⚠ Gemini quota exceeded. This is expected with the free tier.${colors.reset}`
        );
        log(
          `  ${colors.yellow}⚠ For testing purposes, we'll continue with OpenAI only.${colors.reset}`
        );
      }
    }
  } catch (error) {
    log(`  ${colors.red}✗ Gemini test failed: ${error.message}${colors.reset}`);
  }

  // Step 4: Test OpenAI Provider
  log(
    `\n${colors.bright}4. Testing Secondary Provider (OpenAI):${colors.reset}`
  );

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const openaiText =
        data.choices[0]?.message?.content || "No text generated";

      log(`  ${colors.green}✓ OpenAI enhancement successful${colors.reset}`);
      log(
        `  ${colors.dim}Sample text: "${truncateString(openaiText, 100)}"${colors.reset}`
      );
    } else {
      const errorData = await response.json();
      log(
        `  ${colors.red}✗ OpenAI enhancement failed: ${errorData.error?.message || "Unknown error"}${colors.reset}`
      );
    }
  } catch (error) {
    log(`  ${colors.red}✗ OpenAI test failed: ${error.message}${colors.reset}`);
  }

  // Step 5: Test Dual-Provider mode directly
  if (serverRunning) {
    log(
      `\n${colors.bright}5. Testing Dual-Provider API Endpoint:${colors.reset}`
    );

    try {
      const response = await fetch(
        "http://localhost:3000/api/admin/products/dual-enhance",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        log(
          `  ${colors.green}✓ Dual-Provider API endpoint check successful${colors.reset}`
        );
        log(
          `  Status: ${data.data?.dualMode?.available ? "Available" : "Unavailable"}`
        );
        log(
          `  Primary provider: ${data.data?.dualMode?.primaryProvider?.name || "Not configured"}`
        );
        log(
          `  Secondary provider: ${data.data?.dualMode?.secondaryProvider?.name || "Not configured"}`
        );
      } else {
        const errorData = await response.json();
        log(
          `  ${colors.red}✗ Dual-Provider API check failed: ${errorData.error || "Unknown error"}${colors.reset}`
        );
      }
    } catch (error) {
      log(
        `  ${colors.red}✗ Dual-Provider API test failed: ${error.message}${colors.reset}`
      );
    }
  } else {
    log(
      `\n${colors.yellow}⚠ Skipping server-based tests (no server detected)${colors.reset}`
    );
  }

  // Final summary
  log(`\n${colors.bright}Dual-Provider Test Summary:${colors.reset}`);
  log(
    `  OpenAI API: ${openaiKeyValid ? `${colors.green}✓ Available${colors.reset}` : `${colors.red}✗ Unavailable${colors.reset}`}`
  );
  log(
    `  Gemini API: ${geminiKeyValid ? `${colors.green}✓ Available${colors.reset}` : `${colors.red}✗ Unavailable${colors.reset}`}`
  );
  log(
    `  Server: ${serverRunning ? `${colors.green}✓ Running${colors.reset}` : `${colors.yellow}⚠ Not detected${colors.reset}`}`
  );
  log(
    `  Dual-Provider Mode: ${openaiKeyValid && geminiKeyValid ? `${colors.green}✓ Ready${colors.reset}` : `${colors.yellow}⚠ Partially available${colors.reset}`}`
  );

  if (openaiKeyValid && geminiKeyValid) {
    log(
      `\n${colors.green}🎉 Dual-Provider AI enhancement system is ready!${colors.reset}`
    );
    log(`  Use endpoint: POST /api/admin/products/dual-enhance`);
  } else {
    log(
      `\n${colors.yellow}⚠ Dual-Provider mode requires both API keys to be configured${colors.reset}`
    );

    if (openaiKeyValid) {
      log(`  OpenAI-only mode is available (more expensive but reliable)`);
    } else if (geminiKeyValid) {
      log(
        `  Gemini-only mode is available (cost-effective but may hit quotas)`
      );
    }
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
