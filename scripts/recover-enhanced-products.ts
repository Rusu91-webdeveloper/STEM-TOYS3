/**
 * Recovery Script: Save Enhanced Products from AiJob to Product Table
 *
 * This script extracts enhanced products from a completed AiJob
 * and saves them to the Product database table.
 *
 * Usage:
 *   npx tsx scripts/recover-enhanced-products.ts [jobId]
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";

// Load .env.local file (Next.js default)
config({ path: path.resolve(process.cwd(), ".env.local") });

const db = new PrismaClient();

// Helper function to generate unique slug
async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let counter = 1;
  let uniqueSlug = slug;

  while (await db.product.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

// Helper function to find or create category
async function findOrCreateCategory(categoryName: string) {
  let category = await db.category.findFirst({
    where: {
      OR: [
        { name: { equals: categoryName, mode: "insensitive" } },
        { slug: categoryName.toLowerCase().replace(/\s+/g, "-") },
      ],
    },
  });

  if (!category) {
    const slug = categoryName.toLowerCase().replace(/\s+/g, "-");
    category = await db.category.create({
      data: {
        name: categoryName,
        slug: slug,
        description: `${categoryName} - produse educaționale`,
        isActive: true,
      },
    });
    console.log(`✅ Created new category: ${categoryName}`);
  }

  return category;
}

async function recoverProducts(jobId: string) {
  try {
    console.log(`\n🔍 Looking for AiJob: ${jobId}...\n`);

    // Find the AiJob
    const job = await db.aiJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      console.error(`❌ Job not found: ${jobId}`);
      process.exit(1);
    }

    console.log(`✅ Found job:`);
    console.log(`   - Type: ${job.type}`);
    console.log(`   - Status: ${job.status}`);
    console.log(`   - Created: ${job.createdAt}`);
    console.log(`   - Completed: ${job.completedAt || "N/A"}\n`);

    if (!job.result) {
      console.error(`❌ Job has no result data`);
      process.exit(1);
    }

    // Parse the result
    const result = JSON.parse(job.result);

    if (!result.enhancedProducts || !Array.isArray(result.enhancedProducts)) {
      console.error(`❌ No enhanced products found in result`);
      process.exit(1);
    }

    console.log(
      `📦 Found ${result.enhancedProducts.length} enhanced products\n`
    );
    console.log(`🚀 Starting recovery process...\n`);

    const saved: any[] = [];
    const errors: any[] = [];

    for (const enhancementResult of result.enhancedProducts) {
      if (!enhancementResult.success || !enhancementResult.enhancedProduct) {
        console.log(
          `⚠️  Skipping failed enhancement: ${enhancementResult.error || "Unknown error"}`
        );
        errors.push({
          product: "Unknown",
          error: enhancementResult.error || "Enhancement failed",
        });
        continue;
      }

      const enhancedProduct = enhancementResult.enhancedProduct;

      try {
        // Check if product already exists by SKU
        if (enhancedProduct.sku) {
          const existingProduct = await db.product.findFirst({
            where: { sku: enhancedProduct.sku },
          });
          if (existingProduct) {
            console.log(
              `⚠️  Product already exists: ${enhancedProduct.name} (SKU: ${enhancedProduct.sku})`
            );
            errors.push({
              product: enhancedProduct.name,
              error: `SKU ${enhancedProduct.sku} already exists`,
            });
            continue;
          }
        }

        // Find or create category
        const category = await findOrCreateCategory(enhancedProduct.category);

        // Generate unique slug
        const slug = await generateUniqueSlug(enhancedProduct.name);

        // Determine status (default to IN_PENDING for review)
        const status = "IN_PENDING";

        // Build metadata
        const metadata: any = {
          ai: {
            aiEnhanced: true,
            enhancedBy: "dual-provider",
            fallbackUsed: Boolean(enhancementResult.fallbackUsed),
            enhancementTimestamp: new Date().toISOString(),
            recoveredFromJob: jobId,
          },
          ingestion: {
            createdViaRecovery: true,
            originalJobId: jobId,
            recoveryTimestamp: new Date().toISOString(),
          },
        };

        // Create product in database
        const savedProduct = await db.product.create({
          data: {
            // Core fields (matching Prisma schema)
            name: enhancedProduct.name,
            slug: slug,
            description: enhancedProduct.description,
            price: enhancedProduct.price,
            compareAtPrice: enhancedProduct.compareAtPrice || null,
            sku: enhancedProduct.sku,
            images: enhancedProduct.images || [],
            category: {
              connect: { id: category.id },
            },
            tags: enhancedProduct.tags || [],
            stockQuantity: enhancedProduct.stockQuantity || 0,
            weight: enhancedProduct.weight || 0.8,
            isActive: true,
            featured: false,
            status: status,

            // Only fields that exist in schema
            ageGroup: enhancedProduct.ageGroup || null,
            stemDiscipline: enhancedProduct.stemDiscipline || "GENERAL",

            // Store all other data in metadata JSON field
            attributes: enhancedProduct.attributes || {},
            metadata: {
              ...metadata,
              // Store educational fields in metadata
              learningOutcomes: enhancedProduct.learningOutcomes || [],
              productType: enhancedProduct.productType || null,
              specialCategories: ["NEW_ARRIVALS"],
              romanianCompetencies: enhancedProduct.romanianCompetencies || [],
              romanianCurriculumAlignment:
                enhancedProduct.romanianCurriculumAlignment || [],
              romanianEducationalLevel:
                enhancedProduct.romanianEducationalLevel || null,
              romanianSubjectAreas: enhancedProduct.romanianSubjectAreas || [],
              romanianMinistryApproval: true,
              priceCurrency: "RON",
              compareAtPriceCurrency: "RON",
            },
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        saved.push(savedProduct);
        console.log(
          `✅ Saved: ${savedProduct.name} (${savedProduct.id}) - SKU: ${savedProduct.sku}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to save: ${enhancedProduct.name} - ${error instanceof Error ? error.message : "Unknown error"}`
        );
        errors.push({
          product: enhancedProduct.name,
          error:
            error instanceof Error ? error.message : "Database save failed",
        });
      }
    }

    // Summary
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 Recovery Summary:`);
    console.log(`   ✅ Successfully saved: ${saved.length}`);
    console.log(`   ❌ Failed: ${errors.length}`);
    console.log(`${"=".repeat(60)}\n`);

    if (saved.length > 0) {
      console.log(`✨ Saved Products:`);
      saved.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      - ID: ${p.id}`);
        console.log(`      - SKU: ${p.sku}`);
        console.log(`      - Category: ${p.category.name}`);
        console.log(`      - Status: ${p.status}`);
        console.log(`      - Price: ${p.price} ${p.priceCurrency}`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors:`);
      errors.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.product}: ${e.error}`);
      });
    }

    console.log(
      `\n✅ Recovery complete! You can now view these products in /admin/products\n`
    );
  } catch (error) {
    console.error(`\n❌ Recovery failed:`, error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Main execution
const jobId = process.argv[2] || "cmgj67suc0003jx04bmq0zcto";

console.log(`\n${"=".repeat(60)}`);
console.log(`🔄 Enhanced Products Recovery Script`);
console.log(`${"=".repeat(60)}`);

recoverProducts(jobId);
