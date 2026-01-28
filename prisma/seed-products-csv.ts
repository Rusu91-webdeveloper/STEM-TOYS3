import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const csvFilePath = path.join(__dirname, '../products_seed.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at: ${csvFilePath}`);
    console.log('Please ensure products_seed.csv is in the root directory.');
    process.exit(1);
  }

  console.log('📦 Reading products from CSV...');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  
  // Simple CSV parser that handles quoted strings
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const row: any = {};
      let currentVal = '';
      let insideQuotes = false;
      let colIndex = 0;
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          row[headers[colIndex]] = currentVal.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
          currentVal = '';
          colIndex++;
        } else {
          currentVal += char;
        }
      }
      // Last column
      row[headers[colIndex]] = currentVal.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
      result.push(row);
    }
    return result;
  };

  const products = parseCSV(fileContent);
  console.log(`🔍 Found ${products.length} products to import.`);

  // 1. Ensure Supplier Exists
  const boribon = await prisma.supplier.upsert({
    where: { email: 'contact@boribon.ro' },
    update: {},
    create: {
      name: 'Boribon',
      email: 'contact@boribon.ro',
      phone: '0723 753 360',
      status: 'ACTIVE',
      companySlug: 'boribon',
      isActive: true,
    },
  });
  console.log(`✅ Supplier linked: ${boribon.name}`);

  // 2. Process Products
  for (const p of products) {
    // Ensure Category Exists
    let categoryId = null;
    if (p.categoryId) {
      const catSlug = p.categoryId;
      const catName = p.categoryId.replace('stem-', 'STEM ').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      
      const category = await prisma.category.upsert({
        where: { slug: catSlug },
        update: {},
        create: {
          name: catName,
          slug: catSlug,
          description: `Best ${catName} toys`,
          isActive: true,
        }
      });
      categoryId = category.id;
    }

    // Parse specific fields
    const price = parseFloat(p.price) || 0;
    const costPrice = parseFloat(p.costPrice) || 0;
    const stock = parseInt(p.stockQuantity) || 0;
    const isActive = p.isActive === 'true';
    const isBundle = p.isBundle === 'true';
    
    // Parse Images (Stored as string array in CSV: "['url1', 'url2']")
    let images: string[] = [];
    try {
      images = JSON.parse(p.images.replace(/'/g, '"')); 
    } catch (e) {
      images = []; // Fallback
    }

    // Upsert Product
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        price,
        costPrice,
        stockQuantity: stock,
        isActive,
        images,
        description: p.description,
        isBundle,
        status: 'APPROVED',
      },
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price,
        costPrice,
        stockQuantity: stock,
        isActive,
        images,
        categoryId: categoryId,
        supplierId: boribon.id,
        isBundle,
        status: 'APPROVED',
      }
    });
    console.log(`   ➔ Imported: ${p.name}`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
