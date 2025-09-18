import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

async function updateFeaturedProductsCount() {
  try {
    console.log("Checking featured products count in database...");

    // Get current featured products
    const currentFeaturedProducts = await prisma.product.findMany({
      where: {
        featured: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(
      `Currently ${currentFeaturedProducts.length} featured products:`
    );
    currentFeaturedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
    });

    // Make sure we have at least 6 featured products
    if (currentFeaturedProducts.length < 6) {
      console.log("\nNeed to add more featured products.");

      // Find non-featured products
      const nonFeaturedProducts = await prisma.product.findMany({
        where: {
          featured: false,
          isActive: true,
        },
        take: 6 - currentFeaturedProducts.length,
        select: {
          id: true,
          name: true,
        },
      });

      console.log(
        `Found ${nonFeaturedProducts.length} non-featured products to add.`
      );

      // Update each product
      for (const product of nonFeaturedProducts) {
        console.log(`Marking "${product.name}" as featured...`);
        await prisma.product.update({
          where: { id: product.id },
          data: { featured: true },
        });
      }
    } else {
      console.log(
        `\nAlready have ${currentFeaturedProducts.length} featured products, no need to add more.`
      );
    }

    // Double-check the count after updates
    const updatedCount = await prisma.product.count({
      where: {
        featured: true,
        isActive: true,
      },
    });

    console.log(`\nFinal count of featured products: ${updatedCount}`);
  } catch (error) {
    console.error("Error updating featured products count:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
updateFeaturedProductsCount().catch(console.error);
