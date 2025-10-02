require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("🔍 Checking database data...\n");

  try {
    // Check categories
    const categories = await prisma.category.findMany();
    console.log(`📁 Categories: ${categories.length}`);
    if (categories.length > 0) {
      console.log(
        "  Sample categories:",
        categories.slice(0, 3).map(c => c.name)
      );
    }

    // Check books
    const books = await prisma.book.findMany();
    console.log(`📚 Books: ${books.length}`);
    if (books.length > 0) {
      console.log(
        "  Sample books:",
        books.slice(0, 3).map(b => b.name)
      );
    }

    // Check email templates
    const emailTemplates = await prisma.emailTemplate.findMany();
    console.log(`📧 Email Templates: ${emailTemplates.length}`);
    if (emailTemplates.length > 0) {
      console.log(
        "  Sample templates:",
        emailTemplates.slice(0, 3).map(t => t.name)
      );
    }

    // Check products
    const products = await prisma.product.findMany();
    console.log(`🛍️  Products: ${products.length}`);

    // Check blogs
    const blogs = await prisma.blog.findMany();
    console.log(`📝 Blogs: ${blogs.length}`);

    // Check users
    const users = await prisma.user.findMany();
    console.log(`👥 Users: ${users.length}`);

    console.log("\n✅ Database check complete");
  } catch (error) {
    console.error("❌ Database check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
