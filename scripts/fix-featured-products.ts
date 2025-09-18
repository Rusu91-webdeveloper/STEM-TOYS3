import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

async function fixFeaturedProducts() {
  try {
    // First, reset all featured products
    console.log("Resetting all featured products...");
    await prisma.product.updateMany({
      where: { featured: true },
      data: { featured: false },
    });

    console.log("Finding 6 products to mark as featured...");

    // Get 6 active products
    const productsToMakeFeatured = await prisma.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
      },
      select: {
        id: true,
        name: true,
      },
      take: 6,
    });

    console.log(`Found ${productsToMakeFeatured.length} products.`);

    if (productsToMakeFeatured.length < 6) {
      console.log("WARNING: Not enough products to mark as featured!");
    }

    // Mark each product as featured
    for (const product of productsToMakeFeatured) {
      console.log(`Making "${product.name}" featured`);
      await prisma.product.update({
        where: { id: product.id },
        data: { featured: true },
      });
    }

    // Verify
    const featuredCount = await prisma.product.count({
      where: { featured: true },
    });

    console.log(`\nNow have exactly ${featuredCount} featured products.`);

    // List them
    const featuredProducts = await prisma.product.findMany({
      where: { featured: true },
      select: {
        id: true,
        name: true,
      },
    });

    console.log("\nFeatured products:");
    featuredProducts.forEach((product, i) => {
      console.log(`${i + 1}. ${product.name} (${product.id})`);
    });
  } catch (error) {
    console.error("Error fixing featured products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixFeaturedProducts().catch(console.error);
