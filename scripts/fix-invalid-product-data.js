/**
 * Script to fix invalid enum values in existing products
 * This script identifies and fixes products with invalid enum values that may have been created by AI enhancement
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Valid enum values from the schema
const VALID_ENUMS = {
  ageGroup: [
    "TODDLERS_1_3",
    "PRESCHOOL_3_5",
    "ELEMENTARY_6_8",
    "MIDDLE_SCHOOL_9_12",
    "TEENS_13_PLUS",
  ],
  stemDiscipline: [
    "SCIENCE",
    "TECHNOLOGY",
    "ENGINEERING",
    "MATHEMATICS",
    "GENERAL",
  ],
  productType: [
    "ROBOTICS",
    "PUZZLES",
    "CONSTRUCTION_SETS",
    "EXPERIMENT_KITS",
    "BOARD_GAMES",
  ],
  learningOutcomes: [
    "PROBLEM_SOLVING",
    "CREATIVITY",
    "CRITICAL_THINKING",
    "MOTOR_SKILLS",
    "LOGIC",
  ],
  status: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
  romanianEducationalLevel: [
    "GRADINITA",
    "PRIMAR",
    "GIMNAZIU",
    "LICEU",
    "UNIVERSITATE",
  ],
};

async function fixInvalidProductData() {
  console.log("🔍 Starting invalid product data fix...\n");

  const issues = {
    totalChecked: 0,
    fixed: 0,
    errors: [],
  };

  try {
    // Get all products
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        ageGroup: true,
        stemDiscipline: true,
        productType: true,
        learningOutcomes: true,
        status: true,
        romanianEducationalLevel: true,
        isActive: true,
        createdAt: true,
      },
    });

    issues.totalChecked = allProducts.length;
    console.log(`📊 Found ${allProducts.length} products to check\n`);

    const fixes = [];

    for (const product of allProducts) {
      const productFixes = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        fixes: [],
      };

      // Check and fix ageGroup
      if (
        product.ageGroup &&
        !VALID_ENUMS.ageGroup.includes(product.ageGroup)
      ) {
        productFixes.fixes.push({
          field: "ageGroup",
          oldValue: product.ageGroup,
          newValue: null,
          reason: "Invalid age group enum value",
        });
      }

      // Check and fix stemDiscipline
      if (
        product.stemDiscipline &&
        !VALID_ENUMS.stemDiscipline.includes(product.stemDiscipline)
      ) {
        productFixes.fixes.push({
          field: "stemDiscipline",
          oldValue: product.stemDiscipline,
          newValue: "GENERAL",
          reason: "Invalid stem discipline enum value",
        });
      }

      // Check and fix productType
      if (
        product.productType &&
        !VALID_ENUMS.productType.includes(product.productType)
      ) {
        productFixes.fixes.push({
          field: "productType",
          oldValue: product.productType,
          newValue: null,
          reason: "Invalid product type enum value",
        });
      }

      // Check and fix learningOutcomes
      if (product.learningOutcomes && Array.isArray(product.learningOutcomes)) {
        const invalidOutcomes = product.learningOutcomes.filter(
          outcome => !VALID_ENUMS.learningOutcomes.includes(outcome)
        );

        if (invalidOutcomes.length > 0) {
          const validOutcomes = product.learningOutcomes.filter(outcome =>
            VALID_ENUMS.learningOutcomes.includes(outcome)
          );

          // Ensure at least one valid outcome
          if (validOutcomes.length === 0) {
            validOutcomes.push("PROBLEM_SOLVING");
          }

          productFixes.fixes.push({
            field: "learningOutcomes",
            oldValue: product.learningOutcomes,
            newValue: validOutcomes,
            reason: `Invalid learning outcomes: ${invalidOutcomes.join(", ")}`,
          });
        }
      }

      // Check and fix status
      if (product.status && !VALID_ENUMS.status.includes(product.status)) {
        productFixes.fixes.push({
          field: "status",
          oldValue: product.status,
          newValue: "APPROVED",
          reason: "Invalid status enum value",
        });
      }

      // Check and fix romanianEducationalLevel
      if (
        product.romanianEducationalLevel &&
        !VALID_ENUMS.romanianEducationalLevel.includes(
          product.romanianEducationalLevel
        )
      ) {
        productFixes.fixes.push({
          field: "romanianEducationalLevel",
          oldValue: product.romanianEducationalLevel,
          newValue: null,
          reason: "Invalid Romanian educational level enum value",
        });
      }

      // Check isActive status
      if (!product.isActive) {
        productFixes.fixes.push({
          field: "isActive",
          oldValue: product.isActive,
          newValue: true,
          reason: "Product should be active",
        });
      }

      if (productFixes.fixes.length > 0) {
        fixes.push(productFixes);
      }
    }

    console.log(`🔧 Found ${fixes.length} products that need fixes\n`);

    // Apply fixes
    for (const productFix of fixes) {
      try {
        console.log(
          `🔧 Fixing product: ${productFix.name} (${productFix.sku})`
        );

        const updateData = {};

        for (const fix of productFix.fixes) {
          updateData[fix.field] = fix.newValue;
          console.log(
            `  - ${fix.field}: ${fix.oldValue} → ${fix.newValue} (${fix.reason})`
          );
        }

        // Update metadata to track the fix
        updateData.metadata = {
          fixedByScript: true,
          fixTimestamp: new Date().toISOString(),
          fixesApplied: productFix.fixes.map(f => f.field),
        };

        await prisma.product.update({
          where: { id: productFix.id },
          data: updateData,
        });

        issues.fixed++;
        console.log(`  ✅ Fixed successfully\n`);
      } catch (error) {
        console.error(
          `  ❌ Failed to fix product ${productFix.name}:`,
          error.message
        );
        issues.errors.push({
          product: productFix.name,
          sku: productFix.sku,
          error: error.message,
        });
      }
    }

    // Summary
    console.log("📋 SUMMARY:");
    console.log(`  - Total products checked: ${issues.totalChecked}`);
    console.log(`  - Products fixed: ${issues.fixed}`);
    console.log(`  - Errors: ${issues.errors.length}`);

    if (issues.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      issues.errors.forEach(error => {
        console.log(`  - ${error.product} (${error.sku}): ${error.error}`);
      });
    }
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixInvalidProductData()
  .then(() => {
    console.log("\n🏁 Fix script completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
