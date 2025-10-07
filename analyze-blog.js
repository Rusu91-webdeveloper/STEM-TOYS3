const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function analyzeBlog() {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: "cmggbzrjz0001jn0kynoyfd3h" },
      include: {
        category: true,
        author: true,
      },
    });

    if (!blog) {
      console.log("❌ Blog not found with ID: cmggbzrjz0001jn0kynoyfd3h");
      return;
    }

    console.log("✅ Blog found! Analyzing...\n");
    console.log(JSON.stringify(blog, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeBlog();
