/**
 * Database Optimization Script
 * Creates optimized indexes and analyzes query performance
 */

const { Client } = require("pg");
require("dotenv").config();

class DatabaseOptimizer {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async connect() {
    await this.client.connect();
    console.log("✅ Connected to database");
  }

  async disconnect() {
    await this.client.end();
    console.log("✅ Disconnected from database");
  }

  async createOptimizedIndexes() {
    console.log("🔧 Creating optimized indexes...\n");

    const indexes = [
      {
        name: "idx_homepage_featured_products",
        table: "Product",
        columns: ["isActive", "status", "featured", "createdAt", "categoryId"],
        order: "DESC",
        description: "Ultra-fast homepage featured products query",
      },
      {
        name: "idx_product_api_list_optimization",
        table: "Product",
        columns: ["isActive", "status", "createdAt", "name", "price"],
        order: "DESC",
        description: "Optimized API list queries with sorting",
      },
      {
        name: "idx_product_search_featured",
        table: "Product",
        columns: ["isActive", "status", "featured", "name"],
        order: "ASC",
        description: "Search optimization with featured priority",
      },
      {
        name: "idx_product_category_performance",
        table: "Product",
        columns: ["categoryId", "isActive", "status", "featured", "price"],
        order: "DESC",
        description: "Category filtering performance",
      },
      {
        name: "idx_product_filter_optimization",
        table: "Product",
        columns: [
          "isActive",
          "status",
          "stemDiscipline",
          "ageGroup",
          "productType",
        ],
        description: "Complex filtering optimization",
      },
    ];

    for (const index of indexes) {
      try {
        const columnsWithOrder = index.columns
          .map(col =>
            col === "createdAt" || col === "price"
              ? `${col} DESC`
              : col === "name"
                ? `${col} ASC`
                : col
          )
          .join(", ");

        const query = `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${index.name}
          ON "${index.table}" (${columnsWithOrder})
          WHERE "isActive" = true AND "status" = 'APPROVED';
        `;

        console.log(`Creating index: ${index.name}`);
        console.log(`Description: ${index.description}`);

        await this.client.query(query);
        console.log(`✅ Created index: ${index.name}\n`);
      } catch (error) {
        console.error(
          `❌ Failed to create index ${index.name}:`,
          error.message
        );
      }
    }
  }

  async analyzeQueryPerformance() {
    console.log("📊 Analyzing query performance...\n");

    const queries = [
      {
        name: "Homepage Featured Products",
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT id, name, slug, price, "compareAtPrice", images,
                 json_build_object('name', c.name, 'slug', c.slug) as category
          FROM "Product" p
          LEFT JOIN "Category" c ON p."categoryId" = c.id
          WHERE p."isActive" = true
            AND p."status" = 'APPROVED'
            AND p."featured" = true
          ORDER BY p."createdAt" DESC
          LIMIT 6;
        `,
      },
      {
        name: "Complex Product Filter",
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT COUNT(*) as total
          FROM "Product" p
          WHERE p."isActive" = true
            AND p."status" = 'APPROVED'
            AND p."stemDiscipline" = 'SCIENCE'
            AND p."price" BETWEEN 50 AND 200;
        `,
      },
    ];

    for (const { name, query } of queries) {
      console.log(`🔍 Analyzing: ${name}`);

      try {
        const result = await this.client.query(query);
        const executionTime = result.rows[0]["QUERY PLAN"].match(
          /Execution Time: ([\d.]+) ms/
        )?.[1];

        console.log(`Execution Time: ${executionTime}ms`);
        console.log("Query Plan:");
        console.log(result.rows[0]["QUERY PLAN"]);
        console.log("");
      } catch (error) {
        console.error(`❌ Error analyzing ${name}:`, error.message);
      }
    }
  }

  async checkExistingIndexes() {
    console.log("📋 Checking existing indexes...\n");

    try {
      const result = await this.client.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'Product'
        ORDER BY indexname;
      `);

      console.log("Existing Product indexes:");
      result.rows.forEach(row => {
        console.log(`  • ${row.indexname}`);
      });
      console.log("");
    } catch (error) {
      console.error("❌ Error checking existing indexes:", error.message);
    }
  }

  async cleanupUnusedIndexes() {
    console.log("🧹 Checking for unused indexes...\n");

    try {
      const result = await this.client.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND tablename = 'Product'
          AND idx_scan = 0
        ORDER BY pg_relation_size(indexrelid) DESC;
      `);

      if (result.rows.length > 0) {
        console.log("Potentially unused indexes (0 scans):");
        result.rows.forEach(row => {
          console.log(`  • ${row.indexname} (${row.size})`);
        });
        console.log("\n⚠️  Consider dropping unused indexes to save space\n");
      } else {
        console.log("✅ No unused indexes found\n");
      }
    } catch (error) {
      console.error("❌ Error checking unused indexes:", error.message);
    }
  }

  async runOptimization() {
    console.log("🚀 Starting database optimization...\n");

    try {
      await this.connect();

      // Check current state
      await this.checkExistingIndexes();

      // Create optimized indexes
      await this.createOptimizedIndexes();

      // Analyze performance
      await this.analyzeQueryPerformance();

      // Cleanup suggestions
      await this.cleanupUnusedIndexes();

      console.log("✅ Database optimization completed!");
    } catch (error) {
      console.error("❌ Database optimization failed:", error);
    } finally {
      await this.disconnect();
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  optimizer.runOptimization().catch(console.error);
}

module.exports = DatabaseOptimizer;
