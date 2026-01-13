/**
 * Import Script for 40 Curated STEM Products
 * 
 * This script imports STEM products from a CSV/JSON file and links them to suppliers.
 * 
 * Usage:
 *   pnpm tsx scripts/import-stem-products.ts <input-file.csv|input-file.json>
 * 
 * Input format (CSV):
 *   name,description,price,costPrice,supplierSku,stockQuantity,category,images,stemDiscipline,ageGroup
 * 
 * Input format (JSON):
 *   [
 *     {
 *       "name": "Product Name",
 *       "description": "Product description",
 *       "price": 199.99,
 *       "costPrice": 150.00,
 *       "supplierSku": "BOR-12345",
 *       "stockQuantity": 10,
 *       "category": "Magnetic Building",
 *       "images": ["url1", "url2"],
 *       "stemDiscipline": "ENGINEERING",
 *       "ageGroup": "6-10"
 *     }
 *   ]
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ProductImportData {
  name: string;
  description: string;
  price: number;
  costPrice: number;
  supplierSku: string;
  stockQuantity: number;
  category: string;
  images: string[];
  stemDiscipline: "SCIENCE" | "TECHNOLOGY" | "ENGINEERING" | "MATHEMATICS" | "GENERAL";
  ageGroup?: string;
  supplierId?: string;
  supplierName?: string; // Will look up supplier by name
}

async function importProducts(filePath: string) {
  console.log(`📦 Starting product import from ${filePath}...`);

  // Read and parse input file
  const fileContent = fs.readFileSync(filePath, "utf-8");
  let products: ProductImportData[];

  if (filePath.endsWith(".json")) {
    products = JSON.parse(fileContent);
  } else if (filePath.endsWith(".csv")) {
    // Simple CSV parser (use a library like csv-parse for production)
    const lines = fileContent.split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    products = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(",").map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        // Parse numeric fields
        obj.price = parseFloat(obj.price);
        obj.costPrice = parseFloat(obj.costPrice);
        obj.stockQuantity = parseInt(obj.stockQuantity);
        obj.images = obj.images ? JSON.parse(obj.images) : [];
        return obj;
      });
  } else {
    throw new Error("Unsupported file format. Use .csv or .json");
  }

  console.log(`Found ${products.length} products to import`);

  const results = {
    imported: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const productData of products) {
    try {
      // Find or get supplier
      let supplierId: string | null = null;
      
      if (productData.supplierId) {
        supplierId = productData.supplierId;
      } else if (productData.supplierName) {
        const supplier = await prisma.supplier.findFirst({
          where: {
            OR: [
              { name: { contains: productData.supplierName, mode: "insensitive" } },
              { companyName: { contains: productData.supplierName, mode: "insensitive" } },
            ],
          },
        });
        if (supplier) {
          supplierId = supplier.id;
        } else {
          throw new Error(`Supplier not found: ${productData.supplierName}`);
        }
      }

      // Find or create category
      let category = await prisma.category.findFirst({
        where: {
          name: { equals: productData.category, mode: "insensitive" },
        },
      });

      if (!category) {
        const slug = productData.category
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        
        category = await prisma.category.create({
          data: {
            name: productData.category,
            slug,
            description: `Category for ${productData.category}`,
            isActive: true,
          },
        });
      }

      // Generate slug
      const slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { slug },
            { name: productData.name, supplierId: supplierId || undefined },
          ],
        },
      });

      if (existing) {
        console.log(`⚠️  Product already exists: ${productData.name}`);
        results.failed++;
        results.errors.push(`Product already exists: ${productData.name}`);
        continue;
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug,
          description: productData.description,
          price: productData.price,
          costPrice: productData.costPrice,
          stockQuantity: productData.stockQuantity,
          images: productData.images,
          categoryId: category.id,
          supplierId,
          stemDiscipline: productData.stemDiscipline,
          ageGroup: productData.ageGroup,
          isActive: true,
          featured: false,
          tags: [productData.category, productData.stemDiscipline],
        },
      });

      // If supplier SKU provided, create SupplierProduct link
      if (supplierId && productData.supplierSku) {
        await prisma.supplierProduct.upsert({
          where: {
            supplierId_supplierSku: {
              supplierId,
              supplierSku: productData.supplierSku,
            },
          },
          create: {
            supplierId,
            supplierSku: productData.supplierSku,
            name: productData.name,
            price: productData.costPrice,
            stock: productData.stockQuantity,
            productId: product.id,
            status: "SYNCED",
            lastSyncAt: new Date(),
          },
          update: {
            productId: product.id,
            price: productData.costPrice,
            stock: productData.stockQuantity,
            lastSyncAt: new Date(),
          },
        });
      }

      console.log(`✅ Imported: ${productData.name}`);
      results.imported++;
    } catch (error) {
      console.error(`❌ Failed to import ${productData.name}:`, error);
      results.failed++;
      results.errors.push(`${productData.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  console.log("\n📊 Import Summary:");
  console.log(`  ✅ Imported: ${results.imported}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  await prisma.$disconnect();
}

// Run if called directly
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: pnpm tsx scripts/import-stem-products.ts <input-file.csv|input-file.json>");
    process.exit(1);
  }

  importProducts(filePath)
    .then(() => {
      console.log("✅ Import completed");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Import failed:", error);
      process.exit(1);
    });
}

export { importProducts };
