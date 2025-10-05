#!/usr/bin/env tsx

/**
 * Basic Category Seeding Script for TechTots STEM Store
 *
 * Creates the 5 basic STEM categories used throughout the application
 */

import { PrismaClient, StemCategory } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

// Basic STEM Categories - matching the blog page structure
const basicCategories = [
  {
    name: "Science",
    slug: "science",
    description:
      "Science toys and educational materials for hands-on learning and discovery",
    stemCategory: StemCategory.SCIENCE,
    color: "from-blue-600 to-blue-700",
    icon: "Science",
  },
  {
    name: "Technology",
    slug: "technology",
    description:
      "Technology toys including coding, electronics, and digital design kits",
    stemCategory: StemCategory.TECHNOLOGY,
    color: "from-green-600 to-green-700",
    icon: "Technology",
  },
  {
    name: "Engineering",
    slug: "engineering",
    description:
      "Engineering toys for building, construction, and problem-solving activities",
    stemCategory: StemCategory.ENGINEERING,
    color: "from-yellow-600 to-yellow-700",
    icon: "Engineering",
  },
  {
    name: "Mathematics",
    slug: "mathematics",
    description:
      "Mathematics toys and games for developing logical thinking and numerical skills",
    stemCategory: StemCategory.MATHEMATICS,
    color: "from-red-600 to-red-700",
    icon: "Math",
  },
  {
    name: "General STEM",
    slug: "general-stem",
    description:
      "Multi-disciplinary STEM toys that combine multiple areas of science, technology, engineering, and mathematics",
    stemCategory: StemCategory.GENERAL,
    color: "from-indigo-600 via-indigo-700 to-purple-700",
    icon: "Logic",
  },
];

async function seedBasicCategories() {
  console.log("🌱 Starting basic category seeding...");

  try {
    // Check existing categories
    const existingCount = await prisma.category.count();
    console.log(`📊 Found ${existingCount} existing categories`);

    if (existingCount > 0) {
      console.log("⚠️  Categories already exist. Skipping seeding.");
      return;
    }

    // Create the 5 basic STEM categories
    console.log("📂 Creating basic STEM categories...");

    for (const category of basicCategories) {
      await prisma.category.create({
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          metadata: {
            stemCategory: category.stemCategory,
            color: category.color,
            icon: category.icon,
          },
          isActive: true,
        },
      });
      console.log(`✅ Created category: ${category.name}`);
    }

    // Verify the seeding
    const totalCategories = await prisma.category.count();
    console.log(
      `\n🎉 Successfully seeded ${totalCategories} basic STEM categories!`
    );

    // List the created categories
    const categories = await prisma.category.findMany({
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    });

    console.log("\n📋 Created Categories:");
    categories.forEach(cat => {
      console.log(`  • ${cat.name} (${cat.slug})`);
    });
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedBasicCategories();
