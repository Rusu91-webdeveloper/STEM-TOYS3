require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const product = await db.product.findUnique({
      where: { id: 'cmgj8dx98000qjns8f1d75ylt' },
      select: {
        name: true,
        tags: true,
        ageGroup: true,
        stemDiscipline: true,
        metadata: true,
        attributes: true
      }
    });
    
    console.log('\n📊 COMPLETE METADATA for:', product.name);
    console.log('\n=== DIRECT FIELDS ===');
    console.log('Tags:', product.tags);
    console.log('Age Group:', product.ageGroup);
    console.log('STEM Discipline:', product.stemDiscipline);
    
    console.log('\n=== METADATA JSON ===');
    console.log(JSON.stringify(product.metadata, null, 2));
    
    console.log('\n=== ATTRIBUTES JSON ===');
    console.log(JSON.stringify(product.attributes, null, 2));
    
    await db.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
