/**
 * Fix Product Metadata and Status Issues
 *
 * This script addresses the following issues:
 * 1. Missing metadata field for AI-enhanced products
 * 2. Set isActive to true for all products
 * 3. Set romanianMinistryApproval to true as default
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProductIssues() {
  console.log('🔧 Starting product metadata and status fixes...\n');

  try {
    // 1. Check current product status
    console.log('📊 Checking current product status...');
    const totalProducts = await prisma.product.count();
    const inactiveProducts = await prisma.product.count({
      where: { isActive: false }
    });
    const productsWithoutMetadata = await prisma.product.count({
      where: {
        metadata: {
          equals: null
        }
      }
    });
    const productsWithoutMinistryApproval = await prisma.product.count({
      where: { romanianMinistryApproval: false }
    });

    console.log(`📈 Database Status:`);
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Inactive products: ${inactiveProducts}`);
    console.log(`   Products without metadata: ${productsWithoutMetadata}`);
    console.log(`   Products without ministry approval: ${productsWithoutMinistryApproval}\n`);

    // 2. Get all products that need fixing
    const productsToFix = await prisma.product.findMany({
      where: {
        OR: [
          { isActive: false },
          {
            metadata: {
              equals: null
            }
          },
          { romanianMinistryApproval: false }
        ]
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        metadata: true,
        romanianMinistryApproval: true,
        attributes: true
      }
    });

    console.log(`🔍 Found ${productsToFix.length} products that need fixing:\n`);

    // 3. Fix each product
    let fixedCount = 0;
    for (const product of productsToFix) {
      console.log(`🔧 Fixing product: ${product.name} (ID: ${product.id})`);

      const updateData = {};

      // Fix isActive
      if (!product.isActive) {
        updateData.isActive = true;
        console.log(`   ✅ Set isActive to true`);
      }

      // Fix metadata
      if (!product.metadata) {
        updateData.metadata = {
          fixedByScript: true,
          fixTimestamp: new Date().toISOString(),
          originalStatus: {
            isActive: product.isActive,
            hasMetadata: !!product.metadata,
            romanianMinistryApproval: product.romanianMinistryApproval
          }
        };
        console.log(`   ✅ Added metadata field`);
      }

      // Fix romanianMinistryApproval
      if (!product.romanianMinistryApproval) {
        updateData.romanianMinistryApproval = true;
        console.log(`   ✅ Set romanianMinistryApproval to true`);
      }

      // Update the product
      if (Object.keys(updateData).length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: updateData
        });
        fixedCount++;
        console.log(`   ✅ Product updated successfully\n`);
      } else {
        console.log(`   ℹ️  No changes needed\n`);
      }
    }

    // 4. Verify fixes
    console.log('🔍 Verifying fixes...');
    const verificationResults = {
      totalProducts: await prisma.product.count(),
      activeProducts: await prisma.product.count({ where: { isActive: true } }),
      productsWithMetadata: await prisma.product.count({
        where: {
          metadata: {
            not: null
          }
        }
      }),
      approvedProducts: await prisma.product.count({ where: { romanianMinistryApproval: true } })
    };

    console.log(`\n📊 Verification Results:`);
    console.log(`   Total products: ${verificationResults.totalProducts}`);
    console.log(`   Active products: ${verificationResults.activeProducts} (${((verificationResults.activeProducts / verificationResults.totalProducts) * 100).toFixed(1)}%)`);
    console.log(`   Products with metadata: ${verificationResults.productsWithMetadata} (${((verificationResults.productsWithMetadata / verificationResults.totalProducts) * 100).toFixed(1)}%)`);
    console.log(`   Ministry approved products: ${verificationResults.approvedProducts} (${((verificationResults.approvedProducts / verificationResults.totalProducts) * 100).toFixed(1)}%)`);

    // 5. Show summary
    console.log(`\n🎉 Fix Summary:`);
    console.log(`   ✅ Products fixed: ${fixedCount}`);
    console.log(`   📊 Total products processed: ${productsToFix.length}`);
    console.log(`   🎯 Success rate: ${((fixedCount / productsToFix.length) * 100).toFixed(1)}%`);

    if (fixedCount > 0) {
      console.log(`\n✨ All products are now:`);
      console.log(`   - Active (isActive: true)`);
      console.log(`   - Have metadata fields`);
      console.log(`   - Romanian Ministry Approved (romanianMinistryApproval: true)`);
    }

  } catch (error) {
    console.error('❌ Error fixing products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixProductIssues()
  .then(() => {
    console.log('\n🎉 Product fixes completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Product fixes failed:', error);
    process.exit(1);
  });
