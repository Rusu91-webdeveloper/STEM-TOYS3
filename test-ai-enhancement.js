#!/usr/bin/env node

/**
 * AI Enhancement Test Script
 *
 * This script tests the dual-provider AI enhancement system with 5 real STEM products
 * to evaluate efficiency, accuracy, and comprehensiveness of generated content.
 */

const fs = require("fs");
const path = require("path");

// Parse CSV data
function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      // Parse CSV line with proper quote handling
      const values = [];
      let currentValue = "";
      let insideQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];

        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Add the last value

      const product = {};
      headers.forEach((header, index) => {
        const value = values[index] || "";

        if (header === "price") {
          product[header] = parseFloat(value) || 0;
        } else if (header === "stock") {
          product[header] = parseInt(value) || 0;
        } else {
          product[header] = value;
        }
      });

      // Convert to API format
      products.push({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        sku: product.sku,
        stockQuantity: product.stock,
        tags: [],
      });
    }
  }

  return products;
}

// Test the AI enhancement API
async function testAIEnhancement() {
  console.log("🧪 AI Enhancement Test Suite");
  console.log("=".repeat(50));

  try {
    // Read CSV file
    const csvPath = path.join(__dirname, "test-products-ai.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const products = parseCSV(csvContent);

    console.log(`📊 Loaded ${products.length} products for testing:`);
    products.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.name} - $${product.price} (${product.category})`
      );
    });
    console.log();

    // Prepare test request
    const testRequest = {
      products: products,
      options: {
        includeRomanianOptimization: true,
        includeSEOMetadata: true,
        includeLearningOutcomes: true,
        includeAgeGroup: true,
        includeStemDiscipline: true,
        includeProductType: true,
      },
      config: {
        primaryProvider: "gemini",
        primaryModel: "gemini-1.5-pro",
        secondaryProvider: "openai",
        secondaryModel: "gpt-4o-mini",
        refinementOptions: {
          validateContent: true,
          improveSEO: true,
          fixGrammar: true,
          ensureDbCompatibility: true,
        },
      },
    };

    console.log("🚀 Starting AI Enhancement Test...");
    console.log(
      `Primary Provider: ${testRequest.config.primaryProvider} (${testRequest.config.primaryModel})`
    );
    console.log(
      `Secondary Provider: ${testRequest.config.secondaryProvider} (${testRequest.config.secondaryModel})`
    );
    console.log();

    const startTime = Date.now();

    // Read admin session cookie from file
    let adminSessionCookie = "";
    try {
      const cookiesContent = fs.readFileSync(
        path.join(__dirname, "admin-cookies.txt"),
        "utf-8"
      );
      const cookieLine = cookiesContent
        .split("\n")
        .find(line => line.includes("admin-session"));
      if (cookieLine) {
        const cookieValue = cookieLine.split("\t").pop();
        adminSessionCookie = `admin-session=${cookieValue}`;
        console.log("🍪 Using admin session cookie for authentication");
      }
    } catch (error) {
      console.log(
        "⚠️  Could not read admin cookies, test may fail due to authentication"
      );
    }

    // Make API request
    const response = await fetch(
      "http://localhost:3000/api/admin/products/dual-enhance",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminSessionCookie,
        },
        body: JSON.stringify(testRequest),
      }
    );

    // Debug the response
    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );
    console.log(
      `📊 Response Headers:`,
      Object.fromEntries(response.headers.entries())
    );

    const responseText = await response.text();
    console.log(`📊 Response Preview: ${responseText.substring(0, 200)}...`);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse response as JSON:", parseError.message);
      console.log("📄 Full Response:", responseText.substring(0, 1000));
      throw new Error(
        `API returned non-JSON response: ${response.status} ${response.statusText}`
      );
    }

    const totalTime = Date.now() - startTime;

    console.log("📈 ENHANCEMENT RESULTS");
    console.log("=".repeat(50));

    if (result.success) {
      console.log(`✅ Success Rate: ${result.summary.successRate}`);
      console.log(
        `⏱️  Total Processing Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`
      );
      console.log(
        `🔄 Fallback Usage: ${result.summary.fallbackUsed || 0} products`
      );
      console.log(
        `📊 Products Enhanced: ${result.summary.successful}/${result.summary.total}`
      );
      console.log();

      if (result.dualProviderInfo) {
        console.log("🔧 DUAL PROVIDER ANALYSIS");
        console.log("=".repeat(30));
        console.log(`Primary: ${result.dualProviderInfo.primaryProvider}`);
        console.log(`Secondary: ${result.dualProviderInfo.secondaryProvider}`);
        console.log(
          `Refinement Applied: ${result.dualProviderInfo.refinementApplied ? "✅" : "❌"}`
        );
        console.log(
          `Fallback Used: ${result.dualProviderInfo.fallbackToSecondary ? "⚠️  Yes" : "✅ No"}`
        );
        console.log();
      }

      // Analyze each enhanced product
      console.log("🔍 DETAILED PRODUCT ANALYSIS");
      console.log("=".repeat(50));

      result.enhancedProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   💰 Price: $${product.price}`);
        console.log(`   📂 Category: ${product.category}`);

        // Analyze enhanced description
        const descLength = product.enhancedDescription?.length || 0;
        console.log(`   📝 Enhanced Description: ${descLength} characters`);

        // Analyze SEO metadata
        console.log(`   🔍 SEO Metadata:`);
        console.log(
          `      Title: "${product.metaTitle}" (${product.metaTitle?.length || 0} chars)`
        );
        console.log(
          `      Description: "${product.metaDescription?.substring(0, 100)}..." (${product.metaDescription?.length || 0} chars)`
        );
        console.log(
          `      Keywords: ${product.metaKeywords?.length || 0} keywords`
        );

        // Analyze categorization
        console.log(`   🏷️  Categorization:`);
        console.log(`      Age Group: ${product.ageGroup || "Not specified"}`);
        console.log(
          `      STEM Discipline: ${product.stemDiscipline || "Not specified"}`
        );
        console.log(
          `      Product Type: ${product.productType || "Not specified"}`
        );
        console.log(`      Tags: ${product.tags?.length || 0} tags`);

        // Analyze learning outcomes
        console.log(
          `   🎯 Learning Outcomes: ${product.learningOutcomes?.length || 0} outcomes`
        );
        if (product.learningOutcomes?.length > 0) {
          console.log(
            `      ${product.learningOutcomes.slice(0, 3).join(", ")}${product.learningOutcomes.length > 3 ? "..." : ""}`
          );
        }

        // Analyze Romanian optimization
        if (
          product.romanianCompetencies ||
          product.romanianCurriculumAlignment
        ) {
          console.log(`   🇷🇴 Romanian Optimization:`);
          console.log(
            `      Competencies: ${product.romanianCompetencies?.length || 0}`
          );
          console.log(
            `      Curriculum Alignment: ${product.romanianCurriculumAlignment?.length || 0}`
          );
          console.log(
            `      Educational Level: ${product.romanianEducationalLevel || "Not specified"}`
          );
          console.log(
            `      Subject Areas: ${product.romanianSubjectAreas?.length || 0}`
          );
        }

        // Check for fallback usage
        if (product.fallbackUsed || product.generatedByFallback) {
          console.log(
            `   ⚠️  Used Fallback: ${product.fallbackReason || "Secondary provider used"}`
          );
        }

        // Check for dual provider enhancement
        if (product.dualProviderEnhancement) {
          console.log(`   ✨ Dual Provider Enhancement: Applied`);
          if (product.refinements?.length > 0) {
            console.log(
              `   🔧 Refinements Applied: ${product.refinements.length}`
            );
          }
        }
      });

      // Efficiency Analysis
      console.log("\n📊 EFFICIENCY ANALYSIS");
      console.log("=".repeat(50));

      const avgTimePerProduct = totalTime / products.length;
      console.log(
        `⏱️  Average Time per Product: ${avgTimePerProduct.toFixed(0)}ms`
      );

      const totalWords = result.enhancedProducts.reduce((sum, p) => {
        return sum + (p.enhancedDescription?.split(" ").length || 0);
      }, 0);
      console.log(`📝 Total Words Generated: ${totalWords}`);
      console.log(
        `📝 Average Words per Product: ${Math.round(totalWords / result.enhancedProducts.length)}`
      );

      const totalKeywords = result.enhancedProducts.reduce((sum, p) => {
        return sum + (p.metaKeywords?.length || 0);
      }, 0);
      console.log(`🔍 Total Keywords Generated: ${totalKeywords}`);

      const totalTags = result.enhancedProducts.reduce((sum, p) => {
        return sum + (p.tags?.length || 0);
      }, 0);
      console.log(`🏷️  Total Tags Generated: ${totalTags}`);

      const totalLearningOutcomes = result.enhancedProducts.reduce((sum, p) => {
        return sum + (p.learningOutcomes?.length || 0);
      }, 0);
      console.log(`🎯 Total Learning Outcomes: ${totalLearningOutcomes}`);

      // Romanian optimization stats
      const romanianOptimizedCount = result.enhancedProducts.filter(
        p =>
          p.romanianCompetencies?.length > 0 ||
          p.romanianCurriculumAlignment?.length > 0
      ).length;
      console.log(
        `🇷🇴 Romanian Optimized Products: ${romanianOptimizedCount}/${result.enhancedProducts.length}`
      );

      console.log("\n✅ Test completed successfully!");

      // Save detailed results
      const detailedResults = {
        testTimestamp: new Date().toISOString(),
        testDuration: totalTime,
        originalProducts: products,
        enhancedProducts: result.enhancedProducts,
        summary: result.summary,
        dualProviderInfo: result.dualProviderInfo,
        errors: result.errors,
        efficiency: {
          avgTimePerProduct,
          totalWords,
          avgWordsPerProduct: Math.round(
            totalWords / result.enhancedProducts.length
          ),
          totalKeywords,
          totalTags,
          totalLearningOutcomes,
          romanianOptimizedCount,
        },
      };

      fs.writeFileSync(
        path.join(__dirname, "ai-enhancement-test-results.json"),
        JSON.stringify(detailedResults, null, 2)
      );
      console.log(
        "💾 Detailed results saved to ai-enhancement-test-results.json"
      );
    } else {
      console.error("❌ Enhancement failed:", result.error);
      console.error("Details:", result.details);
      if (result.errors?.length > 0) {
        console.error("Errors:");
        result.errors.forEach(error => {
          console.error(`  - ${error.product}: ${error.error}`);
        });
      }
    }
  } catch (error) {
    console.error("💥 Test failed with error:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Run the test
if (require.main === module) {
  testAIEnhancement().catch(console.error);
}

module.exports = { testAIEnhancement, parseCSV };
