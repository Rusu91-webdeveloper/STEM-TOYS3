import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

async function checkFeaturedProducts() {
  try {
    // Query all featured products
    const featuredProducts = await prisma.product.findMany({
      where: {
        featured: true,
        isActive: true,
        status: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        featured: true,
      },
    });

    console.log(
      `\nTotal featured products in database: ${featuredProducts.length}`
    );
    console.log("---------------------------------------");

    // Log each featured product
    featuredProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.id})`);
    });

    console.log(
      "\nIf you need more featured products, you'll need to mark more products as 'featured' in the database."
    );
  } catch (error) {
    console.error("Error checking featured products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
checkFeaturedProducts().catch(console.error);
