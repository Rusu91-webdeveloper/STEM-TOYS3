const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const products = await db.product.findMany({
      where: {
        id: {
          in: ['cmgj8dx98000qjns8f1d75ylt', 'cmgj8dxoz000rjns82xxznm20']
        }
      },
      include: {
        category: { select: { name: true } }
      }
    });
    
    console.log('\n📦 Found', products.length, 'products:\n');
    
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   - ID: ${p.id}`);
      console.log(`   - SKU: ${p.sku}`);
      console.log(`   - Category: ${p.category?.name}`);
      console.log(`   - Status: ${p.status}`);
      console.log(`   - Price: ${p.price} RON`);
      console.log(`   - Tags: ${p.tags.length} tags`);
      console.log(`   - Age Group: ${p.ageGroup || 'Not set'}`);
      console.log(`   - STEM: ${p.stemDiscipline || 'Not set'}`);
      
      if (p.metadata) {
        const meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
        console.log(`   - Product Type: ${meta.productType || 'Not set'}`);
        console.log(`   - Learning Outcomes: ${meta.learningOutcomes?.length || 0}`);
        console.log(`   - SEO Keywords: ${meta.seo?.metaKeywords?.length || 0}`);
        console.log(`   - Special Categories: ${meta.specialCategories?.length || 0}`);
      }
      console.log('');
    });
    
    await db.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
