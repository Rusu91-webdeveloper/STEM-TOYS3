const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Starting Romanian compliance migration...");

    // Add Romanian compliance columns to User table
    console.log("Adding Romanian compliance fields to User table...");

    // Check if columns exist and add them if not
    const userColumnsToAdd = [
      { name: "cui", type: "TEXT" },
      { name: "cnp", type: "TEXT" },
      { name: "serieCi", type: "TEXT" },
      { name: "numarCi", type: "TEXT" },
      { name: "eliberatDe", type: "TEXT" },
      { name: "eliberatLa", type: "TIMESTAMP(3)" },
      { name: "valabilPanaLa", type: "TIMESTAMP(3)" },
      { name: "adresaDomiciliu", type: "JSONB" },
      { name: "codPostal", type: "TEXT" },
      { name: "judet", type: "TEXT" },
      { name: "localitate", type: "TEXT" },
      { name: "isRomanianResident", type: "BOOLEAN DEFAULT false" },
    ];

    for (const column of userColumnsToAdd) {
      try {
        await prisma.$executeRaw`SELECT ${column.name} FROM "User" LIMIT 1;`;
        console.log(`Column ${column.name} already exists`);
      } catch (error) {
        console.log(`Adding column ${column.name} to User table...`);
        await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "${column.name}" ${column.type};`;
      }
    }

    // Add Romanian compliance columns to Address table
    console.log("Adding Romanian compliance fields to Address table...");

    const addressColumnsToAdd = [
      { name: "judet", type: "TEXT" },
      { name: "localitate", type: "TEXT" },
      { name: "codPostal", type: "TEXT" },
      { name: "sector", type: "TEXT" },
      { name: "isBillingAddress", type: "BOOLEAN DEFAULT false" },
    ];

    for (const column of addressColumnsToAdd) {
      try {
        await prisma.$executeRaw`SELECT ${column.name} FROM "Address" LIMIT 1;`;
        console.log(`Column ${column.name} already exists in Address table`);
      } catch (error) {
        console.log(`Adding column ${column.name} to Address table...`);
        await prisma.$executeRaw`ALTER TABLE "Address" ADD COLUMN "${column.name}" ${column.type};`;
      }
    }

    // Set Romanian residency flag for users with Romanian addresses
    console.log("Setting Romanian residency flags...");

    await prisma.user.updateMany({
      where: {
        addresses: {
          some: {
            country: {
              in: ["Romania", "România", "ROU"],
            },
          },
        },
      },
      data: {
        isRomanianResident: true,
      },
    });

    // Update existing Romanian addresses with county information
    console.log("Updating existing Romanian addresses...");

    // For Bucharest addresses
    await prisma.address.updateMany({
      where: {
        country: { in: ["Romania", "România", "ROU"] },
        city: { contains: "București", mode: "insensitive" },
      },
      data: {
        judet: "BUCUREȘTI",
        localitate: "BUCUREȘTI",
      },
    });

    // For other major cities (simplified mapping)
    const cityCountyMapping = {
      Cluj: "CLUJ",
      Timișoara: "TIMIȘ",
      Iași: "IAȘI",
      Constanța: "CONSTANȚA",
      Brașov: "BRAȘOV",
      Galați: "GALAȚI",
      Ploiești: "PRAHOVA",
    };

    for (const [city, county] of Object.entries(cityCountyMapping)) {
      await prisma.address.updateMany({
        where: {
          country: { in: ["Romania", "România", "ROU"] },
          city: { contains: city, mode: "insensitive" },
        },
        data: {
          judet: county,
          localitate: city.toUpperCase(),
        },
      });
    }

    console.log("Romanian compliance migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
