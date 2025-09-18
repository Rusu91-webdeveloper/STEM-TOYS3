import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

async function addFeaturedProducts() {
  try {
    // First, get all non-featured products that are active and approved
    const nonFeaturedProducts = await prisma.product.findMany({
      where: {
        featured: false,
        isActive: true,
        status: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 10, // Get a few options to choose from
    });

    console.log(`Found ${nonFeaturedProducts.length} non-featured products.`);

    // Check if we have any products to mark as featured
    if (nonFeaturedProducts.length === 0) {
      console.log("No non-featured products found to mark as featured.");
      return;
    }

    // Mark the first 2 as featured (or fewer if there aren't enough)
    const productsToUpdate = nonFeaturedProducts.slice(0, 2);

    console.log("\nUpdating the following products to featured:");
    productsToUpdate.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.id})`);
    });

    // Update each product to be featured
    for (const product of productsToUpdate) {
      await prisma.product.update({
        where: { id: product.id },
        data: { featured: true },
      });
    }

    console.log("\nSuccessfully marked products as featured!");

    // Verify the update by checking featured products count
    const featuredProductsCount = await prisma.product.count({
      where: {
        featured: true,
        isActive: true,
        status: "APPROVED",
      },
    });

    console.log(`\nTotal featured products now: ${featuredProductsCount}`);
  } catch (error) {
    console.error("Error updating featured products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
addFeaturedProducts().catch(console.error);
