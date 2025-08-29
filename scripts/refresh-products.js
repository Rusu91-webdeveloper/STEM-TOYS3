const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function refreshProducts() {
  try {
    console.log("🔄 Starting product refresh...");

    // First, let's check if we have any suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { status: "APPROVED" },
    });

    if (suppliers.length === 0) {
      console.log(
        "❌ No approved suppliers found. Creating a test supplier..."
      );

      // Create a test supplier
      const testSupplier = await prisma.supplier.create({
        data: {
          companyName: "TechTots STEM Supplies",
          companySlug: "techtots-stem-supplies",
          description:
            "Leading supplier of high-quality STEM educational toys and kits",
          website: "https://techtots-supplies.com",
          phone: "+40 123 456 789",
          vatNumber: "RO12345678",
          businessAddress: "Strada Inovatiei 123",
          businessCity: "Bucuresti",
          businessState: "Bucuresti",
          businessCountry: "România",
          businessPostalCode: "010101",
          contactPersonName: "Maria Popescu",
          contactPersonEmail: "maria@techtots-supplies.com",
          contactPersonPhone: "+40 123 456 789",
          yearEstablished: 2020,
          employeeCount: 25,
          annualRevenue: "500000-1000000",
          certifications: ["ISO 9001", "CE Marking"],
          productCategories: [
            "ROBOTICS",
            "EXPERIMENT_KITS",
            "CONSTRUCTION_SETS",
          ],
          status: "APPROVED",
          approvedAt: new Date(),
          commissionRate: 15.0,
          paymentTerms: 30,
          minimumOrderValue: 100.0,
          termsAccepted: true,
          privacyAccepted: true,
        },
      });

      console.log("✅ Created test supplier:", testSupplier.companyName);
      suppliers.push(testSupplier);
    }

    // Get categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
    });

    if (categories.length === 0) {
      console.log("❌ No categories found. Creating basic categories...");

      const basicCategories = [
        {
          name: "Science",
          slug: "science",
          description: "Science experiment kits and tools",
        },
        {
          name: "Technology",
          slug: "technology",
          description: "Coding and technology toys",
        },
        {
          name: "Engineering",
          slug: "engineering",
          description: "Building and construction sets",
        },
        {
          name: "Mathematics",
          slug: "mathematics",
          description: "Math learning games and puzzles",
        },
      ];

      for (const cat of basicCategories) {
        await prisma.category.create({
          data: cat,
        });
      }

      console.log("✅ Created basic categories");
    }

    // Delete all existing products
    console.log("🗑️ Deleting all existing products...");
    await prisma.product.deleteMany({});
    console.log("✅ All products deleted");

    // Create new products with all fields properly filled
    const newProducts = [
      {
        name: "Advanced Chemistry Lab Kit",
        slug: "advanced-chemistry-lab-kit",
        description:
          "Complete chemistry laboratory kit for young scientists. Includes 50+ experiments, safety equipment, and detailed instruction manual. Perfect for ages 10-16.",
        price: 89.99,
        compareAtPrice: 119.99,
        sku: "CHEM-ADV-001",
        images: [
          "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "science")?.id,
        tags: ["chemistry", "science", "experiments", "educational"],
        attributes: {
          material: "Plastic, Glass, Metal",
          dimensions: "30x20x15 cm",
          weight: "2.5 kg",
          safetyLevel: "Adult supervision required",
          experimentCount: 50,
        },
        stockQuantity: 25,
        reservedQuantity: 0,
        reorderPoint: 5,
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        ageGroup: "MIDDLE_SCHOOL_9_12",
        learningOutcomes: ["PROBLEM_SOLVING", "CRITICAL_THINKING"],
        productType: "EXPERIMENT_KITS",
        specialCategories: ["NEW_ARRIVALS"],
        stemDiscipline: "SCIENCE",
        supplierId: suppliers[0].id,
        featured: true,
        isActive: true,
      },
      {
        name: "Coding Robot Pro",
        slug: "coding-robot-pro",
        description:
          "Advanced programmable robot for learning coding and robotics. Features multiple sensors, LED display, and supports block-based and text-based programming.",
        price: 149.99,
        compareAtPrice: 199.99,
        sku: "ROBOT-PRO-001",
        images: [
          "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "technology")?.id,
        tags: ["robotics", "coding", "programming", "technology"],
        attributes: {
          material: "ABS Plastic, Metal",
          dimensions: "15x12x8 cm",
          weight: "0.8 kg",
          batteryLife: "4 hours",
          programmingLanguages: ["Blockly", "Python", "JavaScript"],
          sensors: ["Ultrasonic", "Light", "Sound", "Touch"],
        },
        stockQuantity: 18,
        reservedQuantity: 0,
        reorderPoint: 3,
        weight: 0.8,
        dimensions: { length: 15, width: 12, height: 8 },
        ageGroup: "MIDDLE_SCHOOL_9_12",
        learningOutcomes: ["PROBLEM_SOLVING", "LOGIC", "CRITICAL_THINKING"],
        productType: "ROBOTICS",
        specialCategories: ["BEST_SELLERS"],
        stemDiscipline: "TECHNOLOGY",
        supplierId: suppliers[0].id,
        featured: true,
        isActive: true,
      },
      {
        name: "Engineering Bridge Builder Set",
        slug: "engineering-bridge-builder-set",
        description:
          "Comprehensive bridge building kit with 500+ pieces. Teaches structural engineering principles through hands-on construction projects.",
        price: 79.99,
        compareAtPrice: 99.99,
        sku: "ENG-BRIDGE-001",
        images: [
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "engineering")?.id,
        tags: ["engineering", "construction", "bridges", "structural"],
        attributes: {
          material: "Wood, Plastic, Metal",
          dimensions: "40x30x10 cm",
          weight: "3.2 kg",
          pieceCount: 500,
          difficultyLevel: "Intermediate",
          projectCount: 12,
        },
        stockQuantity: 30,
        reservedQuantity: 0,
        reorderPoint: 5,
        weight: 3.2,
        dimensions: { length: 40, width: 30, height: 10 },
        ageGroup: "ELEMENTARY_6_8",
        learningOutcomes: [
          "PROBLEM_SOLVING",
          "MOTOR_SKILLS",
          "CRITICAL_THINKING",
        ],
        productType: "CONSTRUCTION_SETS",
        specialCategories: ["GIFT_IDEAS"],
        stemDiscipline: "ENGINEERING",
        supplierId: suppliers[0].id,
        featured: false,
        isActive: true,
      },
      {
        name: "Mathematical Logic Puzzle Set",
        slug: "mathematical-logic-puzzle-set",
        description:
          "Collection of 100+ mathematical puzzles and brain teasers. Includes Sudoku, logic grids, pattern recognition, and spatial reasoning challenges.",
        price: 34.99,
        compareAtPrice: 44.99,
        sku: "MATH-PUZZLE-001",
        images: [
          "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "mathematics")?.id,
        tags: ["mathematics", "puzzles", "logic", "brain-teasers"],
        attributes: {
          material: "Cardboard, Plastic",
          dimensions: "25x20x5 cm",
          weight: "0.5 kg",
          puzzleCount: 100,
          difficultyLevels: ["Easy", "Medium", "Hard"],
          ageRange: "8-16 years",
        },
        stockQuantity: 45,
        reservedQuantity: 0,
        reorderPoint: 8,
        weight: 0.5,
        dimensions: { length: 25, width: 20, height: 5 },
        ageGroup: "ELEMENTARY_6_8",
        learningOutcomes: ["LOGIC", "CRITICAL_THINKING", "PROBLEM_SOLVING"],
        productType: "PUZZLES",
        specialCategories: ["SALE_ITEMS"],
        stemDiscipline: "MATHEMATICS",
        supplierId: suppliers[0].id,
        featured: false,
        isActive: true,
      },
      {
        name: "Solar System Planetarium Kit",
        slug: "solar-system-planetarium-kit",
        description:
          "Interactive solar system model with motorized planets, LED lighting, and educational content. Perfect for learning astronomy and space science.",
        price: 129.99,
        compareAtPrice: 159.99,
        sku: "ASTR-PLANET-001",
        images: [
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "science")?.id,
        tags: ["astronomy", "solar-system", "planets", "space"],
        attributes: {
          material: "Plastic, LED lights, Motor",
          dimensions: "50x40x30 cm",
          weight: "2.8 kg",
          planetCount: 8,
          motorized: true,
          ledLights: true,
          scale: "1:1,000,000,000",
        },
        stockQuantity: 15,
        reservedQuantity: 0,
        reorderPoint: 3,
        weight: 2.8,
        dimensions: { length: 50, width: 40, height: 30 },
        ageGroup: "PRESCHOOL_3_5",
        learningOutcomes: ["CRITICAL_THINKING", "CREATIVITY"],
        productType: "EXPERIMENT_KITS",
        specialCategories: ["NEW_ARRIVALS"],
        stemDiscipline: "SCIENCE",
        supplierId: suppliers[0].id,
        featured: true,
        isActive: true,
      },
      {
        name: "Renewable Energy Science Kit",
        slug: "renewable-energy-science-kit",
        description:
          "Complete renewable energy learning kit with solar panels, wind turbine, and hydroelectric components. Build and test different energy sources.",
        price: 94.99,
        compareAtPrice: 124.99,
        sku: "ENERGY-RENEW-001",
        images: [
          "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "science")?.id,
        tags: ["renewable-energy", "solar", "wind", "hydroelectric"],
        attributes: {
          material: "Plastic, Solar panels, Motor",
          dimensions: "35x25x15 cm",
          weight: "1.8 kg",
          energyTypes: ["Solar", "Wind", "Hydroelectric"],
          experimentCount: 20,
          powerOutput: "3V DC",
        },
        stockQuantity: 22,
        reservedQuantity: 0,
        reorderPoint: 4,
        weight: 1.8,
        dimensions: { length: 35, width: 25, height: 15 },
        ageGroup: "MIDDLE_SCHOOL_9_12",
        learningOutcomes: [
          "PROBLEM_SOLVING",
          "CRITICAL_THINKING",
          "CREATIVITY",
        ],
        productType: "EXPERIMENT_KITS",
        specialCategories: ["BEST_SELLERS"],
        stemDiscipline: "SCIENCE",
        supplierId: suppliers[0].id,
        featured: false,
        isActive: true,
      },
      {
        name: "Digital Circuit Board Kit",
        slug: "digital-circuit-board-kit",
        description:
          "Learn electronics with this comprehensive circuit board kit. Includes breadboard, components, and 30+ electronic projects with step-by-step instructions.",
        price: 64.99,
        compareAtPrice: 84.99,
        sku: "ELEC-CIRCUIT-001",
        images: [
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "technology")?.id,
        tags: ["electronics", "circuits", "digital", "technology"],
        attributes: {
          material: "Plastic, Metal, Electronic components",
          dimensions: "20x15x8 cm",
          weight: "0.9 kg",
          componentCount: 200,
          projectCount: 30,
          skillLevel: "Beginner to Intermediate",
        },
        stockQuantity: 35,
        reservedQuantity: 0,
        reorderPoint: 6,
        weight: 0.9,
        dimensions: { length: 20, width: 15, height: 8 },
        ageGroup: "MIDDLE_SCHOOL_9_12",
        learningOutcomes: ["LOGIC", "PROBLEM_SOLVING", "CRITICAL_THINKING"],
        productType: "EXPERIMENT_KITS",
        specialCategories: ["GIFT_IDEAS"],
        stemDiscipline: "TECHNOLOGY",
        supplierId: suppliers[0].id,
        featured: false,
        isActive: true,
      },
      {
        name: "3D Printing Pen Set",
        slug: "3d-printing-pen-set",
        description:
          "Safe and easy-to-use 3D printing pen for kids. Create 3D objects with colorful filaments. Includes 10 colors and safety features.",
        price: 49.99,
        compareAtPrice: 69.99,
        sku: "3D-PEN-001",
        images: [
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "technology")?.id,
        tags: ["3d-printing", "creativity", "art", "technology"],
        attributes: {
          material: "Plastic, Metal",
          dimensions: "15x8x3 cm",
          weight: "0.3 kg",
          filamentColors: 10,
          temperatureControl: true,
          safetyFeatures: ["Auto-shutoff", "Cool-tip design"],
          ageRecommendation: "8+ years",
        },
        stockQuantity: 28,
        reservedQuantity: 0,
        reorderPoint: 5,
        weight: 0.3,
        dimensions: { length: 15, width: 8, height: 3 },
        ageGroup: "ELEMENTARY_6_8",
        learningOutcomes: ["CREATIVITY", "MOTOR_SKILLS", "PROBLEM_SOLVING"],
        productType: "ROBOTICS",
        specialCategories: ["SALE_ITEMS"],
        stemDiscipline: "TECHNOLOGY",
        supplierId: suppliers[0].id,
        featured: false,
        isActive: true,
      },
      {
        name: "Architectural Building Blocks",
        slug: "architectural-building-blocks",
        description:
          "Premium architectural building blocks set with 800+ pieces. Create realistic buildings, bridges, and structures with detailed instructions.",
        price: 119.99,
        compareAtPrice: 149.99,
        sku: "ARCH-BLOCKS-001",
        images: [
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "engineering")?.id,
        tags: ["architecture", "building", "construction", "engineering"],
        attributes: {
          material: "ABS Plastic",
          dimensions: "45x35x12 cm",
          weight: "4.2 kg",
          pieceCount: 800,
          buildingTypes: ["Houses", "Bridges", "Towers", "Skyscrapers"],
          instructionBooklets: 5,
        },
        stockQuantity: 12,
        reservedQuantity: 0,
        reorderPoint: 2,
        weight: 4.2,
        dimensions: { length: 45, width: 35, height: 12 },
        ageGroup: "ELEMENTARY_6_8",
        learningOutcomes: ["MOTOR_SKILLS", "PROBLEM_SOLVING", "CREATIVITY"],
        productType: "CONSTRUCTION_SETS",
        specialCategories: ["NEW_ARRIVALS"],
        stemDiscipline: "ENGINEERING",
        supplierId: suppliers[0].id,
        featured: true,
        isActive: true,
      },
      {
        name: "Math Strategy Board Game",
        slug: "math-strategy-board-game",
        description:
          "Educational board game that combines mathematics with strategy. Players solve math problems to advance and win. Perfect for family game nights.",
        price: 39.99,
        compareAtPrice: 49.99,
        sku: "MATH-GAME-001",
        images: [
          "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop",
        ],
        categoryId: categories.find(c => c.slug === "mathematics")?.id,
        tags: ["mathematics", "board-game", "strategy", "educational"],
        attributes: {
          material: "Cardboard, Plastic",
          dimensions: "30x30x5 cm",
          weight: "0.8 kg",
          playerCount: "2-6 players",
          gameDuration: "30-60 minutes",
          difficultyLevels: ["Easy", "Medium", "Hard"],
          mathTopics: ["Addition", "Subtraction", "Multiplication", "Division"],
        },
        stockQuantity: 40,
        reservedQuantity: 0,
        reorderPoint: 7,
        weight: 0.8,
        dimensions: { length: 30, width: 30, height: 5 },
        ageGroup: "ELEMENTARY_6_8",
        learningOutcomes: ["LOGIC", "PROBLEM_SOLVING", "CRITICAL_THINKING"],
        productType: "BOARD_GAMES",
        specialCategories: ["BEST_SELLERS"],
        stemDiscipline: "MATHEMATICS",
        supplierId: suppliers[0].id,
        featured: false,
        isActive: true,
      },
    ];

    console.log("📦 Creating new products...");

    for (const productData of newProducts) {
      const product = await prisma.product.create({
        data: productData,
      });
      console.log(`✅ Created product: ${product.name}`);
    }

    console.log(`🎉 Successfully created ${newProducts.length} new products!`);
    console.log(
      `📊 Products are now associated with supplier: ${suppliers[0].companyName}`
    );
  } catch (error) {
    console.error("❌ Error refreshing products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

refreshProducts();
