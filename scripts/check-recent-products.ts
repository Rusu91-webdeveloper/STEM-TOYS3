import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";

// Load .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const db = new PrismaClient();

async function checkProducts() {
  try {
    // Get the most recent products
    const products = await db.product.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    console.log(`\n📦 Found ${products.length} products from last 24 hours:\n`);

    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   - ID: ${p.id}`);
      console.log(`   - SKU: ${p.sku || "No SKU"}`);
      console.log(`   - Category: ${p.category?.name || "No category"}`);
      console.log(`   - Status: ${p.status}`);
      console.log(`   - Price: ${p.price} RON`);
      console.log(
        `   - Tags: ${p.tags.length} tags → ${p.tags.slice(0, 5).join(", ")}${p.tags.length > 5 ? "..." : ""}`
      );
      console.log(`   - Age Group: ${p.ageGroup || "Not set"}`);
      console.log(`   - STEM: ${p.stemDiscipline || "Not set"}`);

      if (p.metadata) {
        const meta =
          typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata;
        console.log(`   - Product Type: ${meta.productType || "Not set"}`);
        console.log(
          `   - Learning Outcomes: ${meta.learningOutcomes?.length || 0} → ${meta.learningOutcomes?.join(", ") || "None"}`
        );
        console.log(
          `   - SEO Keywords: ${meta.seo?.metaKeywords?.length || 0} → ${meta.seo?.metaKeywords?.slice(0, 3).join(", ") || "None"}`
        );
        console.log(
          `   - Special Categories: ${meta.specialCategories?.length || 0} → ${meta.specialCategories?.join(", ") || "None"}`
        );
        console.log(
          `   - Enhancement: ${meta.ai?.enhancedBy || "Unknown"} (Smart fallback: ${meta.ai?.smartFallbackUsed || false})`
        );
      }
      console.log(`   - Created: ${p.createdAt.toLocaleString()}`);
      console.log("");
    });

    if (products.length === 0) {
      console.log("❌ No products found in the last 24 hours");
      console.log("\nTry checking all products:");
      const allCount = await db.product.count();
      console.log(`Total products in database: ${allCount}`);
    }

    await db.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await db.$disconnect();
    process.exit(1);
  }
}

checkProducts();
