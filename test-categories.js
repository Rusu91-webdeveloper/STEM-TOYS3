require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testCategories() {
  console.log("🧪 Testing Category Configuration\n");

  try {
    // Test 1: Check database categories
    console.log("📂 1. Database Categories:");
    const dbCategories = await prisma.category.findMany({
      select: { name: true, slug: true, isActive: true },
      orderBy: { name: "asc" },
    });

    dbCategories.forEach(cat => {
      console.log(
        `   • ${cat.name} (${cat.slug}) - ${cat.isActive ? "Active" : "Inactive"}`
      );
    });

    // Test 2: Simulate Categories Service
    console.log("\n📋 2. Categories Service would return:");
    const staticData = [
      { nameKey: "Science", slug: "science" },
      { nameKey: "Technology", slug: "technology" },
      { nameKey: "Engineering", slug: "engineering" },
      { nameKey: "Math", slug: "math" },
      { nameKey: "Educational Books", slug: "educational-books" },
    ];

    const categoriesWithCounts = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: { where: { isActive: true } },
          },
        },
      },
    });

    const bookCount = await prisma.book.count({ where: { isActive: true } });

    staticData.forEach(displayCat => {
      const dbCategory = categoriesWithCounts.find(
        dbCat => dbCat.slug.toLowerCase() === displayCat.slug.toLowerCase()
      );
      let productCount = dbCategory?._count.products ?? 0;
      if (displayCat.slug === "educational-books") {
        productCount = bookCount;
      }
      console.log(
        `   • ${displayCat.nameKey} (${displayCat.slug}) - ${productCount} products`
      );
    });

    // Test 3: Check frontend navigation categories
    console.log("\n🧭 3. Frontend Navigation expects:");
    const frontendCategories = [
      "science",
      "technology",
      "engineering",
      "mathematics",
      "educational-books",
    ];
    frontendCategories.forEach(slug => {
      const exists = dbCategories.some(cat => cat.slug === slug);
      console.log(`   • ${slug} - ${exists ? "✅ Exists" : "❌ Missing"}`);
    });

    console.log("\n✅ Category testing complete!");
  } catch (error) {
    console.error("❌ Error testing categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategories();
