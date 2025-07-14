import * as fs from "fs";
import * as path from "path";

import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import * as dotenv from "dotenv";

// Load environment variables from .env.local file
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log("Loaded environment variables from .env.local");
} else {
  dotenv.config(); // Fallback to .env if .env.local doesn't exist
  console.log("Loaded environment variables from .env (fallback)");
}

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Create an admin user using environment variables if available
  const adminEmail = process.env.ADMIN_EMAIL || "admin@stemtoys.com";
  const adminName = process.env.ADMIN_NAME || "Admin User";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: await hash(adminPassword, 12),
        role: "ADMIN",
        isActive: true,
        emailVerified: new Date(),
      },
    });
    console.log(`Created admin user: ${adminUser.email}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Create STEM categories
  const categories = [
    {
      name: "Science",
      slug: "science",
      description:
        "Educational toys that teach scientific principles and encourage exploration",
      image: "https://placehold.co/800x600/10B981/FFFFFF.png?text=Science",
    },
    {
      name: "Technology",
      slug: "technology",
      description:
        "Toys that introduce children to coding, robotics, and digital literacy",
      image: "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Technology",
    },
    {
      name: "Engineering",
      slug: "engineering",
      description:
        "Building kits and construction toys that develop problem-solving skills",
      image: "https://placehold.co/800x600/F59E0B/FFFFFF.png?text=Engineering",
    },
    {
      name: "Mathematics",
      slug: "mathematics",
      description:
        "Games and puzzles that make learning math concepts fun and engaging",
      image: "https://placehold.co/800x600/3B82F6/FFFFFF.png?text=Mathematics",
    },
    {
      name: "Educational Books",
      slug: "educational-books",
      description:
        "Digital and physical books that educate and inspire young minds",
      image: "https://placehold.co/800x600/8B5CF6/FFFFFF.png?text=Books",
    },
  ];

  console.log("Seeding categories...");

  const categoryMap = new Map();

  for (const category of categories) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (!existingCategory) {
      const createdCategory = await prisma.category.create({
        data: category,
      });
      console.log(`Created category: ${createdCategory.name}`);
      categoryMap.set(category.slug, createdCategory.id);
    } else {
      console.log(`Category ${category.name} already exists`);
      categoryMap.set(category.slug, existingCategory.id);
    }
  }

  // Create basic languages for digital files
  console.log("Seeding basic languages...");

  const basicLanguages = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      isAvailable: true,
    },
    {
      code: "ro",
      name: "Romanian",
      nativeName: "Română",
      isAvailable: true,
    },
  ];

  for (const language of basicLanguages) {
    const existingLanguage = await prisma.language.findUnique({
      where: { code: language.code },
    });

    if (!existingLanguage) {
      const createdLanguage = await prisma.language.create({
        data: language,
      });
      console.log(
        `Created language: ${createdLanguage.name} (${createdLanguage.code})`
      );
    } else {
      console.log(`Language ${language.name} already exists`);
      // Update to ensure it's available
      await prisma.language.update({
        where: { code: language.code },
        data: { isAvailable: true },
      });
    }
  }

  // Products data with metadata
  const products = [
    {
      name: "Chemistry Lab Kit",
      slug: "chemistry-lab-kit",
      description:
        "A comprehensive chemistry set for young scientists to conduct safe and exciting experiments at home. Includes 30+ experiments with detailed instructions.",
      price: 49.99,
      compareAtPrice: 59.99,
      images: [
        "https://placehold.co/800x600/10B981/FFFFFF.png?text=Chemistry+Kit+1",
        "https://placehold.co/800x600/10B981/FFFFFF.png?text=Chemistry+Kit+2",
      ],
      categorySlug: "science",
      tags: ["chemistry", "experiments", "educational", "8-12 years"],
      attributes: {
        age: "8-12 years",
        pieces: 45,
        difficulty: "Intermediate",
        safetyRating: "Non-toxic materials",
      },
      metadata: {
        title: "Chemistry Lab Kit for Kids - STEM Educational Science Set",
        description:
          "Introduce your child to the wonders of chemistry with our safe, educational lab kit designed for ages 8-12. Perfect for home and school science projects.",
        keywords: [
          "chemistry set",
          "science kit",
          "educational toys",
          "STEM toys",
          "experiments for kids",
        ],
        ogImage:
          "https://placehold.co/1200x630/10B981/FFFFFF.png?text=Chemistry+Kit",
        schema: {
          "@type": "Product",
          brand: "STEM Toys",
          category: "Science/Chemistry",
          sku: "CH-LAB-001",
        },
      },
      stockQuantity: 75,
      weight: 1.2,
      dimensions: {
        width: 35,
        height: 15,
        depth: 25,
      },
      sku: "CH-LAB-001",
      barcode: "7891234567890",
      isActive: true,
    },
    {
      name: "Coding Robot for Beginners",
      slug: "coding-robot-beginners",
      description:
        "An interactive robot that teaches coding fundamentals through play. Perfect for beginners with no prior coding experience. Control movements, lights, and sounds.",
      price: 89.99,
      compareAtPrice: 99.99,
      images: [
        "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Coding+Robot+1",
        "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Coding+Robot+2",
      ],
      categorySlug: "technology",
      tags: ["coding", "robotics", "programming", "tech", "6+ years"],
      attributes: {
        age: "6+ years",
        programmingMethod: "Block-based and remote control",
        batteryLife: "4 hours",
        connectivity: "Bluetooth",
      },
      metadata: {
        title:
          "Kids Coding Robot for Beginners - Learn Programming Through Play",
        description:
          "Introduce your child to coding with our beginner-friendly robot. No prior experience needed. Perfect for ages 6+ to learn programming basics through fun activities.",
        keywords: [
          "coding for kids",
          "learn programming",
          "robotics for beginners",
          "STEM toys",
          "educational robots",
        ],
        ogImage:
          "https://placehold.co/1200x630/4F46E5/FFFFFF.png?text=Coding+Robot",
        schema: {
          "@type": "Product",
          brand: "STEM Toys",
          category: "Technology/Robotics",
          sku: "CR-BEG-001",
        },
      },
      stockQuantity: 50,
      weight: 0.8,
      dimensions: {
        width: 15,
        height: 20,
        depth: 15,
      },
      sku: "CR-BEG-001",
      barcode: "7891234567891",
      isActive: true,
    },
    {
      name: "Bridge Builder Engineering Kit",
      slug: "bridge-builder-kit",
      description:
        "Build and test different bridge designs with this comprehensive engineering kit. Learn about structural principles, load distribution, and engineering design.",
      price: 34.99,
      compareAtPrice: 44.99,
      images: [
        "https://placehold.co/800x600/F59E0B/FFFFFF.png?text=Bridge+Kit+1",
        "https://placehold.co/800x600/F59E0B/FFFFFF.png?text=Bridge+Kit+2",
      ],
      categorySlug: "engineering",
      tags: ["engineering", "construction", "bridges", "physics", "9+ years"],
      attributes: {
        age: "9+ years",
        pieces: 120,
        difficulty: "Intermediate",
        materialType: "High-quality plastic and wood",
      },
      metadata: {
        title: "Bridge Builder Engineering Kit - STEM Construction Toy Set",
        description:
          "Learn civil engineering concepts by building various bridge designs. This hands-on kit teaches structural principles and problem-solving for ages 9 and up.",
        keywords: [
          "engineering kit",
          "bridge building set",
          "structural engineering",
          "STEM toys",
          "educational construction",
        ],
        ogImage:
          "https://placehold.co/1200x630/F59E0B/FFFFFF.png?text=Bridge+Kit",
        schema: {
          "@type": "Product",
          brand: "STEM Toys",
          category: "Engineering/Construction",
          sku: "BB-ENG-001",
        },
      },
      stockQuantity: 60,
      weight: 1.5,
      dimensions: {
        width: 40,
        height: 10,
        depth: 30,
      },
      sku: "BB-ENG-001",
      barcode: "7891234567892",
      isActive: true,
    },
    {
      name: "Mathematical Puzzle Cube Set",
      slug: "math-puzzle-cube-set",
      description:
        "A collection of 5 mathematical puzzle cubes with varying difficulty levels. Develops spatial reasoning, problem-solving skills, and mathematical thinking.",
      price: 29.99,
      compareAtPrice: 39.99,
      images: [
        "https://placehold.co/800x600/3B82F6/FFFFFF.png?text=Math+Puzzles+1",
        "https://placehold.co/800x600/3B82F6/FFFFFF.png?text=Math+Puzzles+2",
      ],
      categorySlug: "mathematics",
      tags: [
        "mathematics",
        "puzzles",
        "logical thinking",
        "spatial reasoning",
        "7+ years",
      ],
      attributes: {
        age: "7+ years",
        puzzleCount: 5,
        difficulty: "Multiple levels",
        materialType: "High-quality ABS plastic",
      },
      metadata: {
        title:
          "Mathematical Puzzle Cube Set - Brain Teasers for Kids and Adults",
        description:
          "Challenge your mind with our set of 5 mathematical puzzle cubes. Ranging from beginner to expert levels, these puzzles develop spatial reasoning and problem-solving skills.",
        keywords: [
          "math puzzles",
          "brain teasers",
          "educational games",
          "STEM toys",
          "logical thinking",
        ],
        ogImage:
          "https://placehold.co/1200x630/3B82F6/FFFFFF.png?text=Math+Puzzles",
        schema: {
          "@type": "Product",
          brand: "STEM Toys",
          category: "Mathematics/Puzzles",
          sku: "MP-SET-001",
        },
      },
      stockQuantity: 100,
      weight: 0.6,
      dimensions: {
        width: 20,
        height: 20,
        depth: 20,
      },
      sku: "MP-SET-001",
      barcode: "7891234567893",
      isActive: true,
    },
    {
      name: "Solar System Planetarium",
      slug: "solar-system-planetarium",
      description:
        "An interactive model of our solar system with light-up planets. Learn about planetary motion, relative sizes, and astronomical facts.",
      price: 59.99,
      compareAtPrice: 69.99,
      images: [
        "https://placehold.co/800x600/10B981/FFFFFF.png?text=Planetarium+1",
        "https://placehold.co/800x600/10B981/FFFFFF.png?text=Planetarium+2",
      ],
      categorySlug: "science",
      tags: ["astronomy", "solar system", "space", "planets", "8+ years"],
      attributes: {
        age: "8+ years",
        pieces: 10,
        features: "Motorized rotation, LED lights",
        batteries: "3 AA (included)",
      },
      metadata: {
        title:
          "Solar System Planetarium Model - Astronomical Science Kit for Kids",
        description:
          "Explore our solar system with this interactive planetarium model featuring light-up planets. Learn astronomy through hands-on exploration of planetary motion and space.",
        keywords: [
          "planetarium",
          "solar system model",
          "astronomy kit",
          "STEM toys",
          "space education",
        ],
        ogImage:
          "https://placehold.co/1200x630/10B981/FFFFFF.png?text=Planetarium",
        schema: {
          "@type": "Product",
          brand: "STEM Toys",
          category: "Science/Astronomy",
          sku: "SS-PLN-001",
        },
      },
      stockQuantity: 40,
      weight: 1.8,
      dimensions: {
        width: 45,
        height: 30,
        depth: 45,
      },
      sku: "SS-PLN-001",
      barcode: "7891234567894",
      isActive: true,
    },
    {
      name: "Renewable Energy Science Kit",
      slug: "renewable-energy-kit",
      description:
        "Learn about renewable energy with this hands-on kit. Build working models of solar panels, wind turbines, and hydroelectric generators.",
      price: 79.99,
      compareAtPrice: 89.99,
      images: [
        "https://placehold.co/800x600/10B981/FFFFFF.png?text=Energy+Kit+1",
        "https://placehold.co/800x600/10B981/FFFFFF.png?text=Energy+Kit+2",
      ],
      categorySlug: "science",
      tags: [
        "renewable energy",
        "sustainability",
        "environmental science",
        "10+ years",
      ],
      attributes: {
        age: "10+ years",
        experiments: 12,
        components: "Solar panels, wind turbine, water wheel",
        difficulty: "Intermediate to Advanced",
      },
      metadata: {
        title:
          "Renewable Energy Science Kit - Learn About Sustainable Power Sources",
        description:
          "Discover how renewable energy works by building working models of solar panels, wind turbines, and hydroelectric generators. Perfect for science projects and environmental education.",
        keywords: [
          "renewable energy kit",
          "solar energy for kids",
          "wind power kit",
          "STEM toys",
          "environmental science",
        ],
        ogImage:
          "https://placehold.co/1200x630/10B981/FFFFFF.png?text=Energy+Kit",
        schema: {
          "@type": "Product",
          brand: "STEM Toys",
          category: "Science/Environmental",
          sku: "RE-SCI-001",
        },
      },
      stockQuantity: 35,
      weight: 2.1,
      dimensions: {
        width: 50,
        height: 15,
        depth: 40,
      },
      sku: "RE-SCI-001",
      barcode: "7891234567895",
      isActive: true,
    },
  ];

  console.log("Seeding products...");

  for (const product of products) {
    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    // Extract categorySlug and build the relation connect object
    const { categorySlug, ...productData } = product;
    const categoryId = categoryMap.get(categorySlug);
    const dataWithCategory = {
      ...productData,
      category: { connect: { id: categoryId } },
    };

    if (!existingProduct) {
      const createdProduct = await prisma.product.create({
        data: dataWithCategory,
      });
      console.log(`Created product: ${createdProduct.name}`);
    } else {
      console.log(`Product ${product.name} already exists, updating...`);
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: dataWithCategory,
      });
    }
  }

  // Blog posts data
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  const blogs = [
    {
      title: "The Importance of STEM Education for Early Childhood Development",
      slug: "importance-stem-education-early-childhood",
      excerpt:
        "Discover why introducing STEM concepts at an early age can have profound effects on a child's cognitive development and future success.",
      content: `
# The Importance of STEM Education for Early Childhood Development

Early childhood education has evolved significantly over the past decade, with increasing emphasis on Science, Technology, Engineering, and Mathematics (STEM) learning. But why is STEM so crucial for young learners?

## Building Foundational Skills

Research shows that children as young as 3-4 years old can grasp basic STEM concepts when presented in age-appropriate ways. These early experiences build neural pathways that support:

- Logical thinking
- Problem-solving abilities
- Spatial reasoning
- Mathematical understanding
- Scientific curiosity

## STEM Through Play

The most effective STEM education for young children happens through play. When children build towers with blocks, they're learning about:

1. Engineering principles (stability, balance)
2. Physics concepts (gravity, momentum)
3. Mathematical thinking (size, shape, number)

## Recommendations for Parents

Start simple with these activities:
- Classification games (sorting by color, size, shape)
- Building challenges with blocks or recycled materials
- Simple science experiments with household items
- Counting games and basic pattern recognition

Remember, the goal isn't mastery but exposure and enjoyment. When children associate STEM with fun, they develop positive attitudes that last a lifetime.
      `,
      coverImage:
        "https://placehold.co/1200x630/10B981/FFFFFF.png?text=STEM+Education",
      categoryId: categoryMap.get("science"),
      authorId: adminUser.id,
      tags: [
        "early childhood",
        "education",
        "child development",
        "learning through play",
      ],
      metadata: {
        title:
          "The Importance of STEM Education for Early Childhood Development",
        description:
          "Learn why introducing STEM concepts in early childhood is crucial for cognitive development and future academic success.",
        keywords: [
          "STEM education",
          "early childhood development",
          "educational play",
          "cognitive development",
        ],
        ogImage:
          "https://placehold.co/1200x630/10B981/FFFFFF.png?text=STEM+Education",
        schema: {
          "@type": "Article",
          category: "Education",
          author: "STEM Toys Team",
        },
      },
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title:
        "Coding for Kids: Why Programming Skills Matter in the Digital Age",
      slug: "coding-for-kids-programming-skills-digital-age",
      excerpt:
        "Programming isn't just for computer scientists anymore. Find out why coding literacy is becoming as important as reading and math for today's children.",
      content: `
# Coding for Kids: Why Programming Skills Matter in the Digital Age

In today's increasingly digital world, coding has emerged as a fundamental literacy alongside reading, writing, and arithmetic. But why should children learn to code, and how early should they start?

## The New Literacy

Coding is no longer just for those pursuing careers in technology. It's becoming a basic skill that influences how we interact with the world around us. Learning to code helps children:

- Understand the digital environment they live in
- Express themselves in new ways
- Develop computational thinking skills
- Prepare for future careers in any field

## Beyond the Screen

Contrary to popular belief, learning to code doesn't necessarily mean more screen time. Many coding concepts can be taught through:

- Unplugged activities (no computers required)
- Robotics and physical computing
- Collaborative projects and storytelling

## Age-Appropriate Coding

Different ages call for different approaches:

- Ages 4-7: Visual block-based programming, sequencing activities
- Ages 8-12: More complex block programming, simple text-based coding
- Ages 13+: Text-based languages, project-based learning

## Getting Started

The best coding tools for beginners include:
1. Scratch Jr. (ages 5-7)
2. Scratch (ages 8+)
3. Beginner-friendly robotics kits
4. Coding card games and board games

Remember that the goal is to foster computational thinking and problem-solving skills, not necessarily to create professional programmers.
      `,
      coverImage:
        "https://placehold.co/1200x630/4F46E5/FFFFFF.png?text=Coding+for+Kids",
      categoryId: categoryMap.get("technology"),
      authorId: adminUser.id,
      tags: [
        "coding",
        "programming",
        "digital literacy",
        "computational thinking",
      ],
      metadata: {
        title:
          "Coding for Kids: Why Programming Skills Matter in the Digital Age",
        description:
          "Discover why coding literacy is becoming essential for children and how programming skills support learning across all subjects.",
        keywords: [
          "coding for kids",
          "learn programming",
          "computational thinking",
          "digital literacy",
        ],
        ogImage:
          "https://placehold.co/1200x630/4F46E5/FFFFFF.png?text=Coding+for+Kids",
        schema: {
          "@type": "Article",
          category: "Technology Education",
          author: "STEM Toys Team",
        },
      },
      isPublished: true,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      title:
        "Engineering Challenges for Elementary Students: Building Problem-Solving Skills",
      slug: "engineering-challenges-elementary-students",
      excerpt:
        "Simple engineering activities that develop critical thinking and hands-on problem solving for young learners.",
      content: `
# Engineering Challenges for Elementary Students: Building Problem-Solving Skills

Engineering might seem like a complex field reserved for adults, but its fundamental principles can be introduced to children in elementary school through engaging, hands-on activities. These experiences not only make learning fun but also develop crucial problem-solving skills.

## Why Engineering for Young Students?

The engineering design process teaches children to:

- Identify problems and constraints
- Brainstorm multiple solutions
- Test and iterate on their designs
- Learn from failure (a critical life skill)
- Collaborate with others

## Simple Classroom and Home Engineering Challenges

Here are five easy-to-implement engineering challenges that require minimal materials:

### 1. Spaghetti Tower Challenge
**Materials:** Dry spaghetti, marshmallows
**Challenge:** Build the tallest free-standing structure that can support a marshmallow on top.

### 2. Paper Bridge
**Materials:** Paper, tape, small toys
**Challenge:** Design a paper bridge that spans 8 inches and holds the most weight.

### 3. Egg Drop Protection
**Materials:** Raw egg, recyclable materials
**Challenge:** Create protection for an egg that will prevent it from breaking when dropped from a height.

### 4. Wind-Powered Car
**Materials:** Recycled materials, straws, paper
**Challenge:** Design a vehicle that can be propelled by blowing through a straw.

### 5. Water Filtration System
**Materials:** Dirty water, containers, filter materials (cotton, sand, gravel)
**Challenge:** Create a system that cleans dirty water.

## Facilitating the Process

When guiding children through these challenges:

1. Present the problem clearly
2. Establish constraints (materials, time)
3. Allow for independent brainstorming
4. Encourage testing and redesigning
5. Facilitate reflection on what worked and why

## Beyond the Challenge

The most valuable part often comes after the activity through guided reflection:
- What worked? What didn't?
- How could your design be improved?
- What surprised you during the process?
- How might this solution help in the real world?

Engineering challenges help children see themselves as capable problem-solvers who can make a difference in their world through creative thinking and persistence.
      `,
      coverImage:
        "https://placehold.co/1200x630/F59E0B/FFFFFF.png?text=Engineering+Challenges",
      categoryId: categoryMap.get("engineering"),
      authorId: adminUser.id,
      tags: [
        "engineering",
        "problem-solving",
        "hands-on learning",
        "design challenges",
      ],
      metadata: {
        title:
          "Engineering Challenges for Elementary Students: Building Problem-Solving Skills",
        description:
          "Discover simple engineering activities that develop critical thinking and hands-on problem solving skills for elementary school students.",
        keywords: [
          "engineering for kids",
          "STEM challenges",
          "problem-solving activities",
          "design thinking",
        ],
        ogImage:
          "https://placehold.co/1200x630/F59E0B/FFFFFF.png?text=Engineering+Challenges",
        schema: {
          "@type": "Article",
          category: "Engineering Education",
          author: "STEM Toys Team",
        },
      },
      isPublished: true,
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    },
  ];

  console.log("Seeding blog posts...");

  for (const blog of blogs) {
    const existingBlog = await (prisma as any).blog.findUnique({
      where: { slug: blog.slug },
    });

    if (!existingBlog) {
      const createdBlog = await (prisma as any).blog.create({
        data: blog,
      });
      console.log(`Created blog post: ${createdBlog.title}`);
    } else {
      console.log(`Blog post ${blog.title} already exists, updating...`);
      await (prisma as any).blog.update({
        where: { id: existingBlog.id },
        data: blog,
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
