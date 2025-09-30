/**
 * Test script for dual AI product enhancement
 * Tests the new GPT-5-mini → GPT-4o fallback approach for bulk product uploads
 */

const {
  DualProviderProductEnhancementService,
} = require("./lib/ai/dual-provider-product-enhancement-service.ts");

// Sample product data that would fail validation without AI enhancement
const sampleProducts = [
  {
    name: "LEGO Mindstorms Robot Inventor Kit",
    description:
      "Advanced robotics kit for building and programming robots with LEGO bricks and sensors",
    price: 349.99,
    category: "Robotics",
    tags: ["robotics", "programming", "lego", "sensors"],
  },
  {
    name: "Science Experiment Chemistry Set",
    description:
      "Complete chemistry experiment kit for young scientists to learn about chemical reactions",
    price: 89.99,
    category: "Science Kits",
    tags: ["chemistry", "experiments", "science", "education"],
  },
];

async function testDualAIEnhancement() {
  console.log(
    "🧪 Testing Dual AI Product Enhancement (GPT-5-mini → GPT-4o fallback)"
  );
  console.log("=".repeat(70));

  try {
    const enhancementService = new DualProviderProductEnhancementService();

    console.log(`Testing with ${sampleProducts.length} sample products...\n`);

    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      console.log(`🔍 Testing Product ${i + 1}: "${product.name}"`);
      console.log(
        `   Original data: ageGroup=${product.ageGroup || "undefined"}, productType=${product.productType || "undefined"}, romanianEducationalLevel=${product.romanianEducationalLevel || "undefined"}`
      );

      // Test enhancement
      const result = await enhancementService.enhanceProduct(product, {
        includeCategorization: true,
        includeRomanianOptimization: true,
        includeLearningOutcomes: true,
        includeStemDiscipline: true,
        includeAgeGroup: true,
        includeProductType: true,
      });

      if (result.success && result.enhancedProduct) {
        const enhanced = result.enhancedProduct;
        console.log(
          `   ✅ Enhancement successful (${result.processingTime}ms)`
        );
        console.log(
          `   Enhanced data: ageGroup=${enhanced.ageGroup}, productType=${enhanced.productType}, romanianEducationalLevel=${enhanced.romanianEducationalLevel}`
        );
        console.log(
          `   Fallback used: ${result.fallbackUsed ? "Yes (GPT-4o)" : "No (GPT-5-mini worked)"}`
        );
      } else {
        console.log(`   ❌ Enhancement failed: ${result.error}`);
      }

      console.log("");
    }

    console.log("🎉 Dual AI enhancement test completed!");
  } catch (error) {
    console.error("💥 Test failed with error:", error);
  }
}

// Run the test
testDualAIEnhancement();
