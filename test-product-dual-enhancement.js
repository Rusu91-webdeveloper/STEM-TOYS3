// Test the dual provider product enhancement with GPT-5-mini + GPT-4o fallback
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function testProductDualEnhancement() {
  console.log("🧪 Testing Dual Provider Product Enhancement...\n");

  try {
    const {
      DualProviderEnhancementService,
    } = require("./lib/ai/dual-provider-enhancement-service.ts");

    const service = new DualProviderEnhancementService();

    // Test product data
    const testProduct = {
      name: "STEM Building Blocks Set",
      price: 49.99,
      category: "STEM Toys",
      description:
        "Educational building blocks for children aged 6-12 years old",
      sku: "STEM-BLK-001",
      stockQuantity: 100,
      tags: ["STEM", "building", "educational"],
      images: ["https://example.com/image1.jpg"],
    };

    console.log("📦 Test Product:", testProduct);
    console.log("\n🤖 Starting dual provider enhancement...\n");

    const startTime = Date.now();
    const enhancedProduct = await service.enhanceProduct(testProduct, {
      includeRomanianOptimization: true,
    });
    const duration = Date.now() - startTime;

    console.log("\n✅ Enhancement completed in", duration + "ms");
    console.log("\n📊 Enhancement Results:");
    console.log(
      "- Enhanced Description Length:",
      enhancedProduct.enhancedDescription?.length || 0
    );
    console.log("- Meta Title:", enhancedProduct.metaTitle);
    console.log("- Age Group:", enhancedProduct.ageGroup);
    console.log("- Product Type:", enhancedProduct.productType);
    console.log(
      "- Romanian Educational Level:",
      enhancedProduct.romanianEducationalLevel
    );
    console.log(
      "- Learning Outcomes:",
      enhancedProduct.learningOutcomes?.length || 0
    );
    console.log(
      "- Fallback Used:",
      enhancedProduct.fallbackUsed ? "YES" : "NO"
    );
    console.log(
      "- Refinement Fallback Used:",
      enhancedProduct.refinementFallbackUsed ? "YES" : "NO"
    );

    if (enhancedProduct.fallbackUsed) {
      console.log("- Fallback Reason:", enhancedProduct.fallbackReason);
    }

    if (enhancedProduct.refinementFallbackUsed) {
      console.log(
        "- Refinement Fallback Reason:",
        enhancedProduct.refinementFallbackReason
      );
    }

    console.log("\n🎯 Validation Results:");
    console.log(
      "- Age Group Valid:",
      [
        "TODDLERS_1_3",
        "PRESCHOOL_3_5",
        "ELEMENTARY_6_8",
        "MIDDLE_SCHOOL_9_12",
        "TEENS_13_PLUS",
      ].includes(enhancedProduct.ageGroup)
    );
    console.log(
      "- Product Type Valid:",
      [
        "ROBOTICS",
        "PUZZLES",
        "CONSTRUCTION_SETS",
        "EXPERIMENT_KITS",
        "BOARD_GAMES",
      ].includes(enhancedProduct.productType)
    );
    console.log(
      "- Romanian Level Valid:",
      ["GRADINITA", "PRIMAR", "GIMNAZIU", "LICEU", "UNIVERSITATE"].includes(
        enhancedProduct.romanianEducationalLevel
      )
    );

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

testProductDualEnhancement();
