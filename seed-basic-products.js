require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const basicProducts = [
  {
    name: "Microscop Digital pentru Copii",
    slug: "microscop-digital-copii",
    description:
      "Microscop digital avansat pentru copii, perfect pentru explorarea lumii microscopice.",
    price: 299.99,
    sku: "MICRO-DIG-001",
    images: [
      "https://placehold.co/800x600/10B981/FFFFFF.png?text=Microscop+Digital",
    ],
    tags: ["microscop", "stiinta", "digital"],
    isActive: true,
    stockQuantity: 50,
    categoryId: null, // Will be set after categories are available
  },
  {
    name: "Kit Chimie pentru Copii",
    slug: "kit-chimie-copii",
    description: "Experimente chimice sigure și educative pentru copii.",
    price: 149.99,
    sku: "CHEM-KIT-001",
    images: ["https://placehold.co/800x600/059669/FFFFFF.png?text=Kit+Chimie"],
    tags: ["chimie", "experimente", "stiinta"],
    isActive: true,
    stockQuantity: 30,
    categoryId: null,
  },
  {
    name: "Constructor LEGO STEM",
    slug: "constructor-lego-stem",
    description:
      "Set de construcție LEGO special pentru învățarea conceptelor STEM.",
    price: 199.99,
    sku: "LEGO-STEM-001",
    images: ["https://placehold.co/800x600/047857/FFFFFF.png?text=LEGO+STEM"],
    tags: ["lego", "constructie", "stem"],
    isActive: true,
    stockQuantity: 25,
    categoryId: null,
  },
];

async function seedBasicProducts() {
  console.log("🌱 Starting basic products seeding...");

  try {
    // Get category IDs
    const categories = await prisma.category.findMany();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });

    // Assign categories to products
    basicProducts[0].categoryId = categoryMap["science"];
    basicProducts[1].categoryId = categoryMap["science"];
    basicProducts[2].categoryId = categoryMap["engineering"];

    console.log("📦 Creating basic products...");

    for (const productData of basicProducts) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug: productData.slug },
      });

      if (existingProduct) {
        console.log(`⏭️  Skipping existing product: ${productData.name}`);
        continue;
      }

      await prisma.product.create({
        data: productData,
      });

      console.log(`✅ Created product: ${productData.name}`);
    }

    console.log(
      `🎉 Successfully seeded ${basicProducts.length} basic products!`
    );
  } catch (error) {
    console.error("❌ Error seeding basic products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicProducts();
