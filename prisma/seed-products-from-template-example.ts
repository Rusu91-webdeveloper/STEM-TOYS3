import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const csvFilePath = path.join(
    __dirname,
    '../supplier-product-template-example.csv',
  );

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at: ${csvFilePath}`);
    console.log(
      'Please ensure supplier-product-template-example.csv is in the project root.',
    );
    process.exit(1);
  }

  console.log('📦 Reading products from supplier template CSV...');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

  // Reuse the simple CSV parser logic from the other seed script
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    const headers = lines[0].split(',').map((h) => h.trim());

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
          row[headers[colIndex]] = currentVal
            .trim()
            .replace(/^"|"$/g, '')
            .replace(/""/g, '"');
          currentVal = '';
          colIndex++;
        } else {
          currentVal += char;
        }
      }
      // Last column
      row[headers[colIndex]] = currentVal
        .trim()
        .replace(/^"|"$/g, '')
        .replace(/""/g, '"');
      result.push(row);
    }
    return result;
  };

  const products = parseCSV(fileContent);
  console.log(`🔍 Found ${products.length} products to import from template.`);

  // Ensure default supplier exists (reuse Boribon from other seed)
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

  for (const p of products) {
    // Derive category slug from category name
    let categoryId: string | null = null;
    if (p.category) {
      const catName = String(p.category).trim();
      const catSlug =
        'stem-' +
        catName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const category = await prisma.category.upsert({
        where: { slug: catSlug },
        update: {},
        create: {
          name: catName,
          slug: catSlug,
          description: `Best ${catName} toys`,
          isActive: true,
        },
      });
      categoryId = category.id;
    }

    const price = parseFloat(p.price) || 0;
    const compareAtPrice = p.compareAtPrice
      ? parseFloat(p.compareAtPrice)
      : undefined;
    const stockQuantity = parseInt(p.stockQuantity || p.stock || '0', 10) || 0;
    const images = p.images ? [String(p.images).trim()] : [];
    const tags =
      p.tags && typeof p.tags === 'string'
        ? p.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];

    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        price,
        compareAtPrice,
        stockQuantity,
        images,
        ageGroup: p.ageGroup,
        stemDiscipline: p.stemDiscipline,
        weight: p.weight ? parseFloat(p.weight) : undefined,
        tags,
        categoryId: categoryId ?? undefined,
        supplierId: boribon.id,
        isActive: true,
      },
      create: {
        name: p.name,
        slug: String(p.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        sku: p.sku,
        description: p.description,
        price,
        compareAtPrice,
        stockQuantity,
        images,
        ageGroup: p.ageGroup,
        stemDiscipline: p.stemDiscipline,
        weight: p.weight ? parseFloat(p.weight) : undefined,
        tags,
        categoryId: categoryId ?? undefined,
        supplierId: boribon.id,
        isActive: true,
        status: 'PUBLISHED',
      },
    });

    console.log(`   ➔ Imported from template: ${p.name}`);
  }

  console.log('🎉 Template CSV seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

