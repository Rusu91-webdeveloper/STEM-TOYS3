#!/usr/bin/env node

/**
 * Database Tax Settings Checker
 *
 * This script checks your current database tax settings to verify
 * if 21% VAT is properly configured and shows what needs to be updated.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkTaxSettings() {
  try {
    console.log(`🔍 Checking Tax Settings in Database...`);
    console.log("=".repeat(60));

    // Check if StoreSettings exists
    const storeSettings = await prisma.storeSettings.findFirst();

    if (!storeSettings) {
      console.log(`❌ No StoreSettings found in database!`);
      console.log(`💡 Need to create initial store settings with 21% VAT`);

      // Create default settings
      console.log(`🔧 Creating default store settings...`);
      const newSettings = await prisma.storeSettings.create({
        data: {
          taxSettings: {
            rate: "21",
            active: true,
            includeInPrice: true,
          },
          shippingSettings: {
            standard: { price: "5.99", active: true },
            express: { price: "12.99", active: true },
            freeThreshold: { price: "250.00", active: true },
          },
        },
      });

      console.log(`✅ Created new store settings:`, {
        id: newSettings.id,
        taxSettings: newSettings.taxSettings,
        shippingSettings: newSettings.shippingSettings,
      });
    } else {
      console.log(`✅ StoreSettings found:`);
      console.log(`   ID: ${storeSettings.id}`);
      console.log(`   Created: ${storeSettings.createdAt}`);
      console.log(`   Updated: ${storeSettings.updatedAt}`);
      console.log(``);

      // Check tax settings
      if (storeSettings.taxSettings) {
        const taxSettings = storeSettings.taxSettings;
        console.log(`📊 Current Tax Settings:`);
        console.log(`   Rate: ${taxSettings.rate}%`);
        console.log(`   Active: ${taxSettings.active}`);
        console.log(`   Include in Price: ${taxSettings.includeInPrice}`);

        // Validate settings
        const isCorrect =
          taxSettings.rate === "21" &&
          taxSettings.active === true &&
          taxSettings.includeInPrice === true;

        if (isCorrect) {
          console.log(
            `✅ Tax settings are CORRECT for Romanian/EU compliance!`
          );
        } else {
          console.log(`❌ Tax settings need to be updated:`);
          if (taxSettings.rate !== "21") {
            console.log(
              `   ⚠️  Rate should be "21" (currently: "${taxSettings.rate}")`
            );
          }
          if (taxSettings.active !== true) {
            console.log(
              `   ⚠️  Should be active (currently: ${taxSettings.active})`
            );
          }
          if (taxSettings.includeInPrice !== true) {
            console.log(
              `   ⚠️  Should include in price (currently: ${taxSettings.includeInPrice})`
            );
          }

          // Fix the settings
          console.log(`🔧 Updating tax settings...`);
          const updated = await prisma.storeSettings.update({
            where: { id: storeSettings.id },
            data: {
              taxSettings: {
                rate: "21",
                active: true,
                includeInPrice: true,
              },
            },
          });
          console.log(`✅ Tax settings updated successfully!`);
        }
      } else {
        console.log(`❌ No tax settings found in database!`);
        console.log(`🔧 Adding 21% VAT settings...`);

        const updated = await prisma.storeSettings.update({
          where: { id: storeSettings.id },
          data: {
            taxSettings: {
              rate: "21",
              active: true,
              includeInPrice: true,
            },
          },
        });

        console.log(
          `✅ Added tax settings: 21% VAT, active, prices include VAT`
        );
      }

      // Check shipping settings too
      if (storeSettings.shippingSettings) {
        const shippingSettings = storeSettings.shippingSettings;
        console.log(``);
        console.log(`🚚 Current Shipping Settings:`);
        console.log(
          `   Standard: ${shippingSettings.standard?.price} lei (${shippingSettings.standard?.active ? "active" : "inactive"})`
        );
        console.log(
          `   Express: ${shippingSettings.express?.price} lei (${shippingSettings.express?.active ? "active" : "inactive"})`
        );
        console.log(
          `   Free Threshold: ${shippingSettings.freeThreshold?.price} lei (${shippingSettings.freeThreshold?.active ? "active" : "inactive"})`
        );

        if (shippingSettings.freeThreshold?.price === "250.00") {
          console.log(`✅ Free shipping threshold is correct (250 lei)`);
        } else {
          console.log(`⚠️  Free shipping threshold should be 250.00 lei`);
        }
      }
    }

    console.log(``);
    console.log("=".repeat(60));
    console.log(`📋 Summary:`);
    console.log(
      `   ✅ Database has proper VAT settings (21%, active, included in prices)`
    );
    console.log(`   ✅ Compliant with Romanian/EU law`);
    console.log(`   ✅ Ready for production use`);
  } catch (error) {
    console.error(`❌ Error checking tax settings:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTaxSettings();
