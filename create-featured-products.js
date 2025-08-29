const { PrismaClient } = require("@prisma/client");

async function createFeaturedProducts() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Creating featured products...");

    // Get some active products to mark as featured
    const activeProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`📊 Found ${activeProducts.length} active products`);

    if (activeProducts.length === 0) {
      console.log("❌ No active products found to mark as featured");
      return;
    }

    // Mark products as featured
    for (const product of activeProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: { featured: true },
      });
      console.log(`✅ Marked "${product.name}" as featured`);
    }

    // Verify featured products
    const featuredProducts = await prisma.product.findMany({
      where: {
        featured: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        featured: true,
      },
    });

    console.log(`⭐ Featured products count: ${featuredProducts.length}`);
    console.log("Featured products:", featuredProducts);
  } catch (error) {
    console.error("❌ Error creating featured products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createFeaturedProducts();
