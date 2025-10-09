require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const job = await db.aiJob.findUnique({
      where: { id: 'cmgjaawv10001jnuydujmabe4' },
      select: { result: true, status: true }
    });
    
    if (!job) {
      console.log('Job not found');
      return;
    }
    
    console.log('\n📋 Job Status:', job.status);
    
    const result = JSON.parse(job.result);
    console.log('\n📊 AI Response for VEX Robotics (Product 2):');
    console.log('='.repeat(80));
    
    const product2 = result.enhancedProducts[1];
    
    console.log('\n✅ Success:', product2.success);
    console.log('🔧 Fallback Used:', product2.fallbackUsed);
    
    console.log('\n📦 Enhanced Product Data:');
    console.log(JSON.stringify(product2.enhancedProduct, null, 2));
    
    await db.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
