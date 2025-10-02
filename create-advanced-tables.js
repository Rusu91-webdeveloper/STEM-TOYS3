require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function createAdvancedTables() {
  console.log("🔧 Creating all missing advanced tables...\n");

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync("create-all-missing-tables.sql", "utf8");

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(
            `⚡ Executing statement ${i + 1}/${statements.length}...`
          );
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          // Log error but continue with other statements
          console.log(
            `⚠️  Statement ${i + 1} failed (might already exist):`,
            error.message
          );
        }
      }
    }

    console.log("\n✅ All advanced tables creation attempted!");
    console.log("🔄 Regenerating Prisma client...");
  } catch (error) {
    console.error("❌ Error creating advanced tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdvancedTables();
