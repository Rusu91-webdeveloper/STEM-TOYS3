const { PrismaClient } = require("../app/generated/prisma");
const prisma = new PrismaClient();

async function seedCategories() {
  try {
    console.log("===== SEEDING CATEGORIES =====");

    // Define the categories
    const categories = [
      {
        name: "Science",
        slug: "science",
        description:
          "Discover the wonders of science with hands-on experiments and educational kits",
        image: "https://placehold.co/800x600/10B981/FFFFFF.png?text=Science",
        metadata: {
          title: "Science STEM Toys and Kits for Kids",
          description:
            "Explore our collection of science toys and kits designed to make learning fun and engaging for children of all ages.",
          keywords: [
            "science toys",
            "stem kits",
            "educational science",
            "experiments for kids",
          ],
        },
      },
      {
        name: "Technology",
        slug: "technology",
        description:
          "Explore coding, robotics, and digital innovation with our technology toys",
        image: "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Technology",
        metadata: {
          title: "Technology and Coding Toys for Kids",
          description:
            "Introduce your child to the world of technology with our engaging coding toys, robots, and digital learning tools.",
          keywords: [
            "coding toys",
            "robotics for kids",
            "tech toys",
            "digital learning",
          ],
        },
      },
      {
        name: "Engineering",
        slug: "engineering",
        description:
          "Build, design, and problem-solve with our engineering construction sets",
        image:
          "https://placehold.co/800x600/F59E0B/FFFFFF.png?text=Engineering",
        metadata: {
          title: "Engineering Construction Sets and Building Toys",
          description:
            "Help your child develop critical thinking and problem-solving skills with our engineering toys and construction sets.",
          keywords: [
            "engineering toys",
            "construction sets",
            "building toys",
            "stem engineering",
          ],
        },
      },
      {
        name: "Mathematics",
        slug: "mathematics",
        description:
          "Games and puzzles that make learning math concepts fun and engaging",
        image:
          "https://placehold.co/800x600/3B82F6/FFFFFF.png?text=Mathematics",
        metadata: {
          title: "Math Games and Learning Toys for Kids",
          description:
            "Make mathematics fun with our collection of math games, puzzles, and learning toys designed to build number skills.",
          keywords: [
            "math games",
            "number puzzles",
            "educational math toys",
            "stem math",
          ],
        },
      },
    ];

    // Keep track of created/existing categories
    let created = 0;
    let existing = 0;

    // Process each category
    for (const category of categories) {
      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.slug },
      });

      if (!existingCategory) {
        // Create the category
        const createdCategory = await prisma.category.create({
          data: category,
        });
        console.log(`Created category: ${createdCategory.name}`);
        created++;
      } else {
        console.log(`Category ${category.name} already exists`);
        existing++;
      }
    }

    console.log(
      `\nSummary: Created ${created} new categories, ${existing} already existed.`
    );
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedCategories();
