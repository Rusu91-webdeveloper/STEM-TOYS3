const { PrismaClient } = require("@prisma/client");

async function testFeaturedQuery() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Testing featured products query...");

    // Test the exact query that the API should be using
    const featuredProducts = await prisma.product.findMany({
      where: {
        featured: true,
        isActive: true,
      },
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        featured: true,
        isActive: true,
      },
    });

    console.log(`⭐ Featured products found: ${featuredProducts.length}`);
    console.log("Featured products:", featuredProducts);

    // Test with string comparison like the API does
    const featuredProductsString = await prisma.product.findMany({
      where: {
        featured: true,
        isActive: true,
      },
      take: 3,
    });

    console.log(
      `⭐ Featured products (string test): ${featuredProductsString.length}`
    );

    // Check all products to see their featured status
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        featured: true,
        isActive: true,
      },
    });

    console.log("All products featured status:");
    allProducts.forEach(product => {
      console.log(
        `- ${product.name}: featured=${product.featured}, active=${product.isActive}`
      );
    });
  } catch (error) {
    console.error("❌ Error testing featured query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeaturedQuery();
