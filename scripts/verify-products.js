const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifyProducts() {
  try {
    console.log("🔍 Verifying products and supplier relationships...");

    // Get all products with supplier information
    const products = await prisma.product.findMany({
      include: {
        supplier: true,
        category: true,
      },
      where: {
        isActive: true,
      },
    });

    console.log(`📊 Found ${products.length} active products`);

    // Check supplier relationships
    const productsWithSupplier = products.filter(p => p.supplierId);
    const productsWithoutSupplier = products.filter(p => !p.supplierId);

    console.log(
      `✅ ${productsWithSupplier.length} products have supplier relationships`
    );
    if (productsWithoutSupplier.length > 0) {
      console.log(
        `❌ ${productsWithoutSupplier.length} products missing supplier relationships`
      );
      productsWithoutSupplier.forEach(p => {
        console.log(`   - ${p.name} (${p.slug})`);
      });
    }

    // Check required fields
    const issues = [];
    products.forEach(product => {
      const fieldChecks = [
        { field: "name", value: product.name, required: true },
        { field: "slug", value: product.slug, required: true },
        { field: "description", value: product.description, required: true },
        { field: "price", value: product.price, required: true },
        { field: "sku", value: product.sku, required: true },
        { field: "images", value: product.images, required: true },
        { field: "categoryId", value: product.categoryId, required: true },
        { field: "tags", value: product.tags, required: true },
        { field: "attributes", value: product.attributes, required: true },
        {
          field: "stockQuantity",
          value: product.stockQuantity,
          required: true,
        },
        { field: "ageGroup", value: product.ageGroup, required: true },
        {
          field: "learningOutcomes",
          value: product.learningOutcomes,
          required: true,
        },
        { field: "productType", value: product.productType, required: true },
        {
          field: "specialCategories",
          value: product.specialCategories,
          required: true,
        },
        {
          field: "stemDiscipline",
          value: product.stemDiscipline,
          required: true,
        },
        { field: "supplierId", value: product.supplierId, required: true },
      ];

      fieldChecks.forEach(check => {
        if (
          check.required &&
          (!check.value ||
            (Array.isArray(check.value) && check.value.length === 0))
        ) {
          issues.push(`${product.name}: Missing ${check.field}`);
        }
      });
    });

    if (issues.length > 0) {
      console.log("❌ Found issues with required fields:");
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log("✅ All required fields are properly filled");
    }

    // Show supplier information
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    console.log("\n📋 Supplier Information:");
    suppliers.forEach(supplier => {
      console.log(
        `   - ${supplier.companyName} (${supplier.status}): ${supplier._count.products} products`
      );
    });

    // Show featured products
    const featuredProducts = products.filter(p => p.featured);
    console.log(`\n⭐ Featured Products: ${featuredProducts.length}`);
    featuredProducts.forEach(p => {
      console.log(
        `   - ${p.name} (${p.supplier?.companyName || "No supplier"})`
      );
    });

    // Show category distribution
    const categoryCounts = {};
    products.forEach(p => {
      const categoryName = p.category?.name || "No category";
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

    console.log("\n📂 Category Distribution:");
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} products`);
    });

    console.log("\n🎉 Product verification completed!");
  } catch (error) {
    console.error("❌ Error verifying products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProducts();
