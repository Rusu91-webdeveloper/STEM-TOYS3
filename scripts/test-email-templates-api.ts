#!/usr/bin/env tsx

/**
 * Script to test the email templates API directly
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testEmailTemplatesAPI() {
  try {
    console.log("🧪 Testing email templates API logic...");

    // Simulate the API logic
    const page = 1;
    const limit = 10;
    const search = "";
    const category = "all";
    const isActive = "all";

    // Build where clause (same as API)
    const where: Record<string, unknown> = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (isActive !== null && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    console.log("🔍 Where clause:", JSON.stringify(where, null, 2));

    // Get templates with pagination (same as API)
    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          subject: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          variables: true,
          metadata: true,
        },
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    console.log(`📊 Found ${templates.length} templates (total: ${total})`);
    console.log(
      "📝 Templates:",
      templates.map(t => ({ name: t.name, slug: t.slug, category: t.category }))
    );

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    console.log("📄 Pagination:", pagination);

    // Test the response format
    const response = {
      templates,
      pagination,
    };

    console.log("✅ API response would be:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("💥 Error testing API:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailTemplatesAPI().catch(console.error);
