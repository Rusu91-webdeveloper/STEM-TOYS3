import * as fs from "fs";
import * as path from "path";

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const prisma = new PrismaClient();

async function main() {
  console.log("Updating supplier status to APPROVED...");

  try {
    const supplier = await prisma.supplier.update({
      where: { email: "supplier@demo.com" },
      data: { status: "APPROVED" },
    });

    console.log(`✅ Supplier status updated to: ${supplier.status}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
