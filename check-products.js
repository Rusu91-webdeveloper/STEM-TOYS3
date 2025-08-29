const { PrismaClient } = require("@prisma/client");

async function checkProducts() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Checking products in database...");

    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Check product count
    const productCount = await prisma.product.count();
    console.log(`📊 Products in database: ${productCount}`);

    // Check for featured products
    const featuredProducts = await prisma.product.findMany({
      where: {
        featured: true,
        isActive: true,
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        featured: true,
        isActive: true,
      },
    });

    console.log(`⭐ Featured products found: ${featuredProducts.length}`);
    if (featuredProducts.length > 0) {
      console.log("Featured products:", featuredProducts);
    }

    // Check for any active products
    const activeProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    console.log(`🛍️ Active products found: ${activeProducts.length}`);
    if (activeProducts.length > 0) {
      console.log("Active products:", activeProducts);
    }
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
