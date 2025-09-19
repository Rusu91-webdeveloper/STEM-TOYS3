#!/usr/bin/env node

/**
 * Performance Check Script
 * Analyzes current performance bottlenecks and provides optimization recommendations
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 STEM-TOYS3 Performance Analysis");
console.log("==================================\n");

// Check database indexes
console.log("📊 Database Index Analysis:");
console.log("Looking for optimized indexes in schema.prisma...");

// Read schema file
try {
  const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf8");

  const indexCount = (schemaContent.match(/@@index/g) || []).length;
  console.log(`✅ Found ${indexCount} database indexes`);

  // Check for performance indexes
  const hasCompositeIndex = schemaContent.includes(
    "idx_product_active_status_featured_created"
  );
  const hasCategoryIndex = schemaContent.includes(
    "idx_product_active_status_category_featured"
  );

  console.log(
    `✅ Composite indexes: ${hasCompositeIndex ? "Present" : "Missing"}`
  );
  console.log(
    `✅ Category indexes: ${hasCategoryIndex ? "Present" : "Missing"}`
  );
} catch (error) {
  console.log("❌ Could not read schema file");
}

// Check cache configuration
console.log("\n💾 Cache Configuration:");
try {
  const cachePath = path.join(__dirname, "..", "lib", "cache.ts");
  const cacheContent = fs.readFileSync(cachePath, "utf8");

  const hasRedisConfig =
    cacheContent.includes("REDIS_URL") && cacheContent.includes("REDIS_TOKEN");
  const hasTimeConstants = cacheContent.includes("CACHE_DURATION");
  const hasOptimizedTTL = cacheContent.includes("getOptimizedTTL");

  console.log(
    `✅ Redis configuration: ${hasRedisConfig ? "Present" : "Missing"}`
  );
  console.log(`✅ Time constants: ${hasTimeConstants ? "Present" : "Missing"}`);
  console.log(`✅ Optimized TTL: ${hasOptimizedTTL ? "Present" : "Missing"}`);
} catch (error) {
  console.log("❌ Could not read cache configuration");
}

// Check performance optimizations
console.log("\n⚡ Performance Optimizations:");
try {
  const perfPath = path.join(__dirname, "..", "lib", "performance.ts");
  const perfContent = fs.readFileSync(perfPath, "utf8");

  const hasMonitoring = perfContent.includes("withPerformanceMonitoring");
  const hasThresholds = perfContent.includes("product_list_query");
  const hasCacheDecorator = perfContent.includes("withCache");

  console.log(
    `✅ Performance monitoring: ${hasMonitoring ? "Present" : "Missing"}`
  );
  console.log(
    `✅ Operation thresholds: ${hasThresholds ? "Present" : "Missing"}`
  );
  console.log(
    `✅ Cache decorator: ${hasCacheDecorator ? "Present" : "Missing"}`
  );
} catch (error) {
  console.log("❌ Could not read performance configuration");
}

// Check hero optimizations
console.log("\n🎨 Hero Section Optimizations:");
try {
  const heroPath = path.join(
    __dirname,
    "..",
    "features",
    "home",
    "components",
    "HeroSection.tsx"
  );
  const heroContent = fs.readFileSync(heroPath, "utf8");

  const hasPriority = heroContent.includes("priority");
  const hasEagerLoading = heroContent.includes('loading="eager"');
  const hasOptimizedQuality = heroContent.includes("quality={85}");

  console.log(`✅ Image priority: ${hasPriority ? "Present" : "Missing"}`);
  console.log(`✅ Eager loading: ${hasEagerLoading ? "Present" : "Missing"}`);
  console.log(
    `✅ Optimized quality: ${hasOptimizedQuality ? "Present" : "Missing"}`
  );
} catch (error) {
  console.log("❌ Could not read hero component");
}

// Check database connection optimizations
console.log("\n🗄️ Database Connection Optimizations:");
try {
  const dbPath = path.join(__dirname, "..", "lib", "db.ts");
  const dbContent = fs.readFileSync(dbPath, "utf8");

  const hasPoolConfig = dbContent.includes("max: 15");
  const hasTransactionTimeout = dbContent.includes("transactionOptions");
  const hasConnectionLimits = dbContent.includes("idleTimeoutMillis");

  console.log(
    `✅ Connection pooling: ${hasPoolConfig ? "Optimized" : "Basic"}`
  );
  console.log(
    `✅ Transaction timeouts: ${hasTransactionTimeout ? "Present" : "Missing"}`
  );
  console.log(
    `✅ Connection limits: ${hasConnectionLimits ? "Present" : "Missing"}`
  );
} catch (error) {
  console.log("❌ Could not read database configuration");
}

// Recommendations
console.log("\n🎯 Performance Recommendations:");
console.log(
  "1. Use `npm run dev:performance` for better development performance"
);
console.log("2. Monitor database query times in development console");
console.log("3. Consider using Redis for caching in production");
console.log("4. Run Lighthouse audits to measure Core Web Vitals improvements");
console.log(
  "5. Monitor the terminal for slow query warnings (🚨 SLOW OPERATION DETECTED)"
);

console.log("\n✅ Performance check complete!");
