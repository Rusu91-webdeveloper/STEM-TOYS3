import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const db = new PrismaClient();

async function analyzeSEOQuality() {
  try {
    const productId = 'cmgjacepg0003jnuy5gt1qeqq'; // VEX Robotics
    
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });
    
    if (!product) {
      console.log('Product not found');
      return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SEO QUALITY ANALYSIS');
    console.log('='.repeat(80));
    console.log(`\nProduct: ${product.name}`);
    console.log(`ID: ${product.id}`);
    console.log(`Category: ${product.category?.name}\n`);
    
    // Description Analysis
    console.log('📝 DESCRIPTION ANALYSIS:');
    console.log('─'.repeat(80));
    const descLength = product.description?.length || 0;
    const descWordCount = product.description?.split(/\s+/).length || 0;
    console.log(`Length: ${descLength} characters`);
    console.log(`Word Count: ${descWordCount} words`);
    console.log(`Quality: ${descWordCount >= 300 ? '✅ GOOD' : descWordCount >= 150 ? '⚠️  OK' : '❌ TOO SHORT'}`);
    console.log(`Preview:\n${product.description?.substring(0, 300)}...\n`);
    
    // Tags Analysis
    console.log('🏷️  TAGS ANALYSIS:');
    console.log('─'.repeat(80));
    console.log(`Count: ${product.tags.length} tags`);
    console.log(`Quality: ${product.tags.length >= 15 ? '✅ EXCELLENT' : product.tags.length >= 10 ? '⚠️  GOOD' : '❌ NEEDS MORE'}`);
    console.log(`Tags: ${product.tags.join(', ')}\n`);
    
    // Age Group & STEM
    console.log('🎯 CATEGORIZATION:');
    console.log('─'.repeat(80));
    console.log(`Age Group: ${product.ageGroup || '❌ MISSING'}`);
    console.log(`STEM Discipline: ${product.stemDiscipline || '❌ MISSING'}\n`);
    
    // Metadata Analysis
    if (product.metadata) {
      const meta = typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata;
      
      console.log('🔍 SEO METADATA ANALYSIS:');
      console.log('─'.repeat(80));
      
      if (meta.seo) {
        const titleLength = meta.seo.metaTitle?.length || 0;
        const descLength = meta.seo.metaDescription?.length || 0;
        const keywordsCount = meta.seo.metaKeywords?.length || 0;
        
        console.log(`\nMeta Title:`);
        console.log(`  Length: ${titleLength} chars`);
        console.log(`  Quality: ${titleLength >= 50 && titleLength <= 60 ? '✅ PERFECT' : titleLength >= 40 ? '⚠️  OK' : '❌ TOO SHORT'}`);
        console.log(`  Content: "${meta.seo.metaTitle}"`);
        
        console.log(`\nMeta Description:`);
        console.log(`  Length: ${descLength} chars`);
        console.log(`  Quality: ${descLength >= 150 && descLength <= 160 ? '✅ PERFECT' : descLength >= 120 ? '⚠️  OK' : '❌ TOO SHORT'}`);
        console.log(`  Content: "${meta.seo.metaDescription}"`);
        
        console.log(`\nMeta Keywords:`);
        console.log(`  Count: ${keywordsCount} keywords`);
        console.log(`  Quality: ${keywordsCount >= 20 ? '✅ EXCELLENT' : keywordsCount >= 10 ? '⚠️  GOOD' : '❌ NEEDS MORE'}`);
        console.log(`  Keywords: ${meta.seo.metaKeywords?.slice(0, 10).join(', ')}...`);
      } else {
        console.log('❌ NO SEO METADATA FOUND!');
      }
      
      console.log('\n📚 EDUCATIONAL METADATA:');
      console.log('─'.repeat(80));
      console.log(`Product Type: ${meta.productType || '❌ MISSING'}`);
      console.log(`Learning Outcomes: ${meta.learningOutcomes?.length || 0} items → ${meta.learningOutcomes?.join(', ') || 'None'}`);
      console.log(`Romanian Competencies: ${meta.romanianCompetencies?.length || 0} items`);
      if (meta.romanianCompetencies?.length > 0) {
        meta.romanianCompetencies.slice(0, 3).forEach((comp: string, i: number) => {
          console.log(`  ${i + 1}. ${comp}`);
        });
      }
      console.log(`Curriculum Alignment: ${meta.romanianCurriculumAlignment?.length || 0} items`);
      if (meta.romanianCurriculumAlignment?.length > 0) {
        meta.romanianCurriculumAlignment.slice(0, 3).forEach((curr: string, i: number) => {
          console.log(`  ${i + 1}. ${curr}`);
        });
      }
      console.log(`Subject Areas: ${meta.romanianSubjectAreas?.length || 0} items → ${meta.romanianSubjectAreas?.join(', ') || 'None'}`);
      console.log(`Educational Level: ${meta.romanianEducationalLevel || '❌ MISSING'}`);
    }
    
    // Attributes Analysis
    if (product.attributes) {
      const attrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      
      console.log('\n⚙️  PRODUCT SPECIFICATIONS:');
      console.log('─'.repeat(80));
      if (attrs.specs) {
        const specsCount = Object.keys(attrs.specs).length;
        console.log(`Count: ${specsCount} specifications`);
        console.log(`Quality: ${specsCount >= 10 ? '✅ EXCELLENT' : specsCount >= 5 ? '⚠️  GOOD' : '❌ NEEDS MORE'}`);
        console.log(`Specs:`);
        Object.entries(attrs.specs).slice(0, 10).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      } else {
        console.log('❌ NO SPECS FOUND!');
      }
    }
    
    // Overall Score
    console.log('\n' + '='.repeat(80));
    console.log('📊 OVERALL SEO SCORE');
    console.log('='.repeat(80));
    
    let score = 0;
    let maxScore = 100;
    
    // Description (20 points)
    const descWordCount = product.description?.split(/\s+/).length || 0;
    if (descWordCount >= 300) score += 20;
    else if (descWordCount >= 150) score += 10;
    
    // Tags (15 points)
    if (product.tags.length >= 15) score += 15;
    else if (product.tags.length >= 10) score += 10;
    else if (product.tags.length >= 5) score += 5;
    
    // Categorization (10 points)
    if (product.ageGroup) score += 5;
    if (product.stemDiscipline) score += 5;
    
    const meta = product.metadata ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata) : null;
    
    // SEO Metadata (30 points)
    if (meta?.seo) {
      const titleLen = meta.seo.metaTitle?.length || 0;
      const descLen = meta.seo.metaDescription?.length || 0;
      const keyCount = meta.seo.metaKeywords?.length || 0;
      
      if (titleLen >= 50 && titleLen <= 60) score += 10;
      else if (titleLen >= 40) score += 5;
      
      if (descLen >= 150 && descLen <= 160) score += 10;
      else if (descLen >= 120) score += 5;
      
      if (keyCount >= 20) score += 10;
      else if (keyCount >= 10) score += 5;
    }
    
    // Educational Metadata (15 points)
    if (meta?.learningOutcomes?.length >= 3) score += 5;
    if (meta?.romanianCompetencies?.length >= 3) score += 5;
    if (meta?.romanianCurriculumAlignment?.length >= 3) score += 5;
    
    // Product Specs (10 points)
    const attrs = product.attributes ? (typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes) : null;
    if (attrs?.specs) {
      const specsCount = Object.keys(attrs.specs).length;
      if (specsCount >= 10) score += 10;
      else if (specsCount >= 5) score += 5;
    }
    
    console.log(`\nFinal Score: ${score}/${maxScore}`);
    console.log(`Grade: ${score >= 90 ? '🏆 A+' : score >= 80 ? '✅ A' : score >= 70 ? '⚠️  B' : score >= 60 ? '⚠️  C' : '❌ D'}`);
    console.log(`\nRanking Potential: ${score >= 85 ? '🚀 Top 3 Rankings Expected' : score >= 70 ? '📈 Top 10 Possible' : score >= 50 ? '📊 Will Rank But Low' : '❌ Needs Improvement'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80));
    
    const recommendations = [];
    
    if (descWordCount < 300) recommendations.push('❌ Increase description to 400-600 words');
    if (product.tags.length < 15) recommendations.push('❌ Add more tags (target: 15-20 bilingual)');
    if (!meta?.seo?.metaTitle || meta.seo.metaTitle.length < 50) recommendations.push('❌ Improve meta title (50-60 chars)');
    if (!meta?.seo?.metaDescription || meta.seo.metaDescription.length < 150) recommendations.push('❌ Improve meta description (150-160 chars)');
    if (!meta?.seo?.metaKeywords || meta.seo.metaKeywords.length < 20) recommendations.push('❌ Add more keywords (target: 25-35)');
    if (!meta?.learningOutcomes || meta.learningOutcomes.length < 3) recommendations.push('❌ Add learning outcomes (target: 3-5)');
    if (!meta?.romanianCompetencies || meta.romanianCompetencies.length < 3) recommendations.push('❌ Add Romanian competencies (target: 3-5)');
    if (!attrs?.specs || Object.keys(attrs.specs).length < 10) recommendations.push('❌ Add more product specs (target: 12-15)');
    
    if (recommendations.length === 0) {
      console.log('\n🎉 PERFECT! No improvements needed!');
    } else {
      console.log('');
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    await db.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await db.$disconnect();
    process.exit(1);
  }
}

analyzeSEOQuality();
