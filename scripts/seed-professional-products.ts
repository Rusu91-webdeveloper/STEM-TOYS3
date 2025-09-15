import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import { additionalProducts } from "./complete-professional-products";
import { mathAndBooksProducts } from "./math-books-products";

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (require("fs").existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

interface ProfessionalProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  images: string[];
  categorySlug: string;
  tags: string[];
  ageGroup:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  stemDiscipline:
    | "SCIENCE"
    | "TECHNOLOGY"
    | "ENGINEERING"
    | "MATHEMATICS"
    | "GENERAL";
  productType:
    | "ROBOTICS"
    | "PUZZLES"
    | "CONSTRUCTION_SETS"
    | "EXPERIMENT_KITS"
    | "BOARD_GAMES";
  learningOutcomes: string[];
  romanianCompetencies: string[];
  romanianCurriculumAlignment: string[];
  romanianEducationalLevel:
    | "GRADINITA"
    | "PRIMAR"
    | "GIMNAZIU"
    | "LICEU"
    | "UNIVERSITATE";
  romanianSubjectAreas: string[];
  romanianMinistryApproval: boolean;
  romanianEducationalCertification?: string;
  romanianParentGuides: string[];
  romanianTeacherResources: string[];
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  stockQuantity: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

const professionalProducts: ProfessionalProduct[] = [
  // SCIENCE PRODUCTS
  {
    name: "Microscop Digital pentru Copii - Exploratorul Științei",
    slug: "microscop-digital-copii-exploratorul-stiintei",
    description:
      "Microscop digital avansat pentru copii, perfect pentru explorarea lumii microscopice. Include cameră HD integrată, iluminare LED reglabilă și software educațional în limba română. Ideal pentru dezvoltarea curiozității științifice și înțelegerea conceptelor de biologie, chimie și fizică. Compatibil cu curriculumul românesc pentru școala primară și gimnaziu.",
    price: 299.99,
    compareAtPrice: 399.99,
    sku: "MICRO-DIG-001",
    images: [
      "https://placehold.co/800x600/10B981/FFFFFF.png?text=Microscop+Digital",
      "https://placehold.co/800x600/059669/FFFFFF.png?text=Microscop+HD",
      "https://placehold.co/800x600/047857/FFFFFF.png?text=Explorare+Științifică",
    ],
    categorySlug: "science",
    tags: [
      "microscop digital",
      "digital microscope",
      "știință pentru copii",
      "science for kids",
      "microscopie",
      "microscopy",
      "biologie",
      "biology",
      "educație științifică",
      "scientific education",
      "curriculum românesc",
      "Romanian curriculum",
      "școala primară",
      "elementary school",
      "explorare",
      "exploration",
      "cameră HD",
      "HD camera",
      "LED",
      "iluminare",
    ],
    ageGroup: "ELEMENTARY_6_8",
    stemDiscipline: "SCIENCE",
    productType: "EXPERIMENT_KITS",
    learningOutcomes: ["PROBLEM_SOLVING", "CRITICAL_THINKING", "LOGIC"],
    romanianCompetencies: [
      "Competența de comunicare în limba maternă",
      "Competența matematică și competențele de bază în științe și tehnologie",
      "Competența de a învăța să înveți",
    ],
    romanianCurriculumAlignment: [
      "Biologie - Clasa a V-a: Structura celulei",
      "Fizică - Clasa a VI-a: Proprietățile materiei",
      "Chimie - Clasa a VII-a: Observații și măsurători",
    ],
    romanianEducationalLevel: "PRIMAR",
    romanianSubjectAreas: ["Biologie", "Fizică", "Chimie", "Științe Naturale"],
    romanianMinistryApproval: true,
    romanianEducationalCertification:
      "Conformitate MECTS - Aprobare pentru utilizare educațională",
    romanianParentGuides: [
      "Ghid pentru părinți: Cum să folosești microscopul cu copilul",
      "Activități științifice pentru acasă",
      "Siguranța în laboratorul de acasă",
    ],
    romanianTeacherResources: [
      "Planuri de lecție pentru microscopie",
      "Activități pentru laboratorul de științe",
      "Evaluare competențe științifice",
    ],
    featured: true,
    metaTitle:
      "Microscop Digital pentru Copii - Exploratorul Științei | TechTots",
    metaDescription:
      "Microscop digital avansat pentru copii cu cameră HD și software educațional român. Perfect pentru explorarea lumii microscopice și dezvoltarea competențelor științifice. Aprobat MECTS.",
    metaKeywords:
      "microscop digital, digital microscope, știință copii, science kids, biologie, biology, curriculum românesc, Romanian curriculum, educație științifică, scientific education, MECTS, aprobare minister",
    stockQuantity: 25,
    weight: 1.2,
    dimensions: { length: 25, width: 20, height: 15 },
  },
  {
    name: "Set Experimente Chimie pentru Copii - Laboratorul Tânărului Chimist",
    slug: "set-experimente-chimie-copii-laboratorul-tanarului-chimist",
    description:
      "Set complet de experimente de chimie pentru copii, cu toate instrumentele și substanțele necesare pentru 50+ experimente sigure. Include ghidul experimentelor în limba română, echipament de protecție și instrucțiuni detaliate. Dezvoltă înțelegerea conceptelor de chimie de bază și promovează gândirea științifică. Perfect pentru acasă sau școală.",
    price: 189.99,
    compareAtPrice: 249.99,
    sku: "CHIM-EXP-002",
    images: [
      "https://placehold.co/800x600/DC2626/FFFFFF.png?text=Set+Chimie",
      "https://placehold.co/800x600/B91C1C/FFFFFF.png?text=Experimente+Sigure",
      "https://placehold.co/800x600/991B1B/FFFFFF.png?text=Laborator+Chimie",
    ],
    categorySlug: "science",
    tags: [
      "chimie pentru copii",
      "chemistry for kids",
      "experimente chimie",
      "chemistry experiments",
      "laborator chimie",
      "chemistry lab",
      "știință",
      "science",
      "experimente sigure",
      "safe experiments",
      "curriculum românesc",
      "Romanian curriculum",
      "gimnaziu",
      "middle school",
      "educație științifică",
      "scientific education",
      "chimie de bază",
      "basic chemistry",
      "gândire științifică",
      "scientific thinking",
    ],
    ageGroup: "MIDDLE_SCHOOL_9_12",
    stemDiscipline: "SCIENCE",
    productType: "EXPERIMENT_KITS",
    learningOutcomes: ["PROBLEM_SOLVING", "CRITICAL_THINKING", "LOGIC"],
    romanianCompetencies: [
      "Competența matematică și competențele de bază în științe și tehnologie",
      "Competența de a învăța să înveți",
      "Competența de inițiativă și antreprenoriat",
    ],
    romanianCurriculumAlignment: [
      "Chimie - Clasa a VII-a: Proprietățile substanțelor",
      "Chimie - Clasa a VIII-a: Reacții chimice",
      "Științe Naturale - Clasa a VI-a: Materia și proprietățile ei",
    ],
    romanianEducationalLevel: "GIMNAZIU",
    romanianSubjectAreas: ["Chimie", "Științe Naturale", "Fizică"],
    romanianMinistryApproval: true,
    romanianEducationalCertification:
      "Conformitate MECTS - Aprobare pentru utilizare educațională",
    romanianParentGuides: [
      "Ghid de siguranță pentru experimente chimice",
      "Cum să supraveghezi experimentele copilului",
      "Activități chimice pentru acasă",
    ],
    romanianTeacherResources: [
      "Planuri de lecție pentru chimie practică",
      "Activități pentru laboratorul de chimie",
      "Evaluare competențe chimice",
    ],
    featured: false,
    metaTitle:
      "Set Experimente Chimie pentru Copii - Laboratorul Tânărului Chimist | TechTots",
    metaDescription:
      "Set complet de experimente de chimie pentru copii cu 50+ experimente sigure. Include ghidul în română și echipament de protecție. Perfect pentru gimnaziu și acasă. Aprobat MECTS.",
    metaKeywords:
      "chimie copii, chemistry kids, experimente chimie, chemistry experiments, laborator chimie, chemistry lab, curriculum românesc, Romanian curriculum, gimnaziu, middle school, MECTS, aprobare minister",
    stockQuantity: 30,
    weight: 2.5,
    dimensions: { length: 35, width: 25, height: 20 },
  },
];

async function main() {
  console.log("🚀 Starting professional products seeding...");

  try {
    // Get categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
    });

    if (categories.length === 0) {
      console.log(
        "❌ No categories found. Please run the main seed script first."
      );
      return;
    }

    // Create category mapping
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.slug, cat.id);
    });

    // Delete existing products
    console.log("🗑️ Deleting existing products...");
    await prisma.product.deleteMany({});
    console.log("✅ Existing products deleted");

    // Combine all products
    const allProducts = [
      ...professionalProducts,
      ...additionalProducts,
      ...mathAndBooksProducts,
    ];

    // Create products
    console.log("📦 Creating professional products...");

    for (const productData of allProducts) {
      const categoryId = categoryMap.get(productData.categorySlug);

      if (!categoryId) {
        console.log(`⚠️ Category not found: ${productData.categorySlug}`);
        continue;
      }

      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          compareAtPrice: productData.compareAtPrice,
          sku: productData.sku,
          images: productData.images,
          categoryId: categoryId,
          tags: productData.tags,
          ageGroup: productData.ageGroup,
          stemDiscipline: productData.stemDiscipline,
          productType: productData.productType,
          learningOutcomes: productData.learningOutcomes,
          romanianCompetencies: productData.romanianCompetencies,
          romanianCurriculumAlignment: productData.romanianCurriculumAlignment,
          romanianEducationalLevel: productData.romanianEducationalLevel,
          romanianSubjectAreas: productData.romanianSubjectAreas,
          romanianMinistryApproval: productData.romanianMinistryApproval,
          romanianEducationalCertification:
            productData.romanianEducationalCertification,
          romanianParentGuides: productData.romanianParentGuides,
          romanianTeacherResources: productData.romanianTeacherResources,
          featured: productData.featured,
          stockQuantity: productData.stockQuantity,
          weight: productData.weight,
          dimensions: productData.dimensions,
          metadata: {
            metaTitle: productData.metaTitle,
            metaDescription: productData.metaDescription,
            metaKeywords: productData.metaKeywords,
          },
          status: "APPROVED",
          isActive: true,
          priceCurrency: "RON",
          compareAtPriceCurrency: "RON",
        },
      });

      console.log(`✅ Created product: ${product.name}`);
    }

    console.log("🎉 Professional products seeding completed successfully!");

    // Display summary
    const productCount = await prisma.product.count();
    const featuredCount = await prisma.product.count({
      where: { featured: true },
    });

    console.log(`📊 Summary:`);
    console.log(`   Total products: ${productCount}`);
    console.log(`   Featured products: ${featuredCount}`);
    console.log(`   Categories: ${categories.length}`);
  } catch (error) {
    console.error("❌ Error seeding professional products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
