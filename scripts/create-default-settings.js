const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createDefaultSettings() {
  try {
    console.log("Checking for existing store settings...");

    const existingSettings = await prisma.storeSettings.findFirst();

    if (existingSettings) {
      console.log("Store settings already exist:", existingSettings.id);
      return;
    }

    console.log("Creating default store settings...");

    const defaultSettings = await prisma.storeSettings.create({
      data: {
        taxSettings: {
          active: false,
          rate: "21",
          includeInPrice: true,
        },
        shippingSettings: {
          standard: { price: "15.99", active: true },
          express: { price: "25.99", active: true },
          priority: { price: "39.99", active: true },
          freeThreshold: { active: false, price: "200" },
        },
        paymentSettings: {
          stripeEnabled: true,
          paypalEnabled: false,
        },
      },
    });

    console.log("Default store settings created:", defaultSettings.id);
  } catch (error) {
    console.error("Error creating default settings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultSettings();
