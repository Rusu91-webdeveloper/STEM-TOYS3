/**
 * Standalone Inngest Server for Railway Deployment
 *
 * This server runs only the Inngest endpoint to bypass Vercel Hobby plan timeout limits.
 * It imports the Inngest functions from the parent directory and serves them via Express.
 *
 * Registered Functions (5):
 * - generate-blog: AI blog generation (90-120s)
 * - enhance-products: Batch product enhancement (60-90s)
 * - bulk-upload-products: Admin bulk uploads with AI
 * - supplier-bulk-upload-products: Supplier bulk uploads with AI
 * - single-product-enhancement: Single product AI enhancement with preview (30-60s)
 */

// Add startup logging
console.log("🔄 Starting Inngest Server...");
console.log("📦 Loading environment variables...");

import "dotenv/config";
import express from "express";
import { serve } from "inngest/express";

console.log("📦 Loading Inngest functions...");

// Import from parent directory (main app)
let inngest,
  generateBlogJob,
  enhanceProductsJob,
  bulkUploadProductsJob,
  supplierBulkUploadProductsJob,
  singleProductEnhancementJob;

try {
  const clientModule = await import("../inngest/client.ts");
  inngest = clientModule.inngest;
  console.log("✅ Loaded inngest client");

  const generateBlogModule = await import(
    "../inngest/functions/generate-blog.ts"
  );
  generateBlogJob = generateBlogModule.generateBlogJob;
  console.log("✅ Loaded generate-blog function");

  const enhanceProductsModule = await import(
    "../inngest/functions/enhance-products.ts"
  );
  enhanceProductsJob = enhanceProductsModule.enhanceProductsJob;
  console.log("✅ Loaded enhance-products function");

  const bulkUploadModule = await import(
    "../inngest/functions/bulk-upload-products.ts"
  );
  bulkUploadProductsJob = bulkUploadModule.bulkUploadProductsJob;
  console.log("✅ Loaded bulk-upload-products function");

  const supplierBulkModule = await import(
    "../inngest/functions/supplier-bulk-upload-products.ts"
  );
  supplierBulkUploadProductsJob =
    supplierBulkModule.supplierBulkUploadProductsJob;
  console.log("✅ Loaded supplier-bulk-upload-products function");

  const singleProductModule = await import(
    "../inngest/functions/single-product-enhancement.ts"
  );
  singleProductEnhancementJob = singleProductModule.singleProductEnhancementJob;
  console.log("✅ Loaded single-product-enhancement function");
} catch (error) {
  console.error("❌ Failed to load Inngest functions:", error);
  console.error("Error details:", error.message);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware for JSON parsing
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "inngest-server",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Inngest Server",
    description: "Standalone Inngest endpoint for AI-powered background jobs",
    functions: [
      "generate-blog",
      "enhance-products",
      "bulk-upload-products",
      "supplier-bulk-upload-products",
      "single-product-enhancement",
    ],
    endpoints: {
      health: "/health",
      inngest: "/api/inngest",
    },
  });
});

// Inngest endpoint - this is what Inngest Cloud will call
const inngestHandler = serve({
  client: inngest,
  functions: [
    generateBlogJob,
    enhanceProductsJob,
    bulkUploadProductsJob,
    supplierBulkUploadProductsJob,
    singleProductEnhancementJob,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

// Mount Inngest handler
app.use("/api/inngest", inngestHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server - MUST bind to 0.0.0.0 for Railway
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Inngest Server Started");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🔧 Inngest: http://0.0.0.0:${PORT}/api/inngest`);
  console.log("");
  console.log("📦 Registered 5 Inngest Functions:");
  console.log("  - generate-blog: Generate Blog with AI");
  console.log("  - enhance-products: Enhance Products with AI");
  console.log("  - bulk-upload-products: Bulk Upload Products (Admin)");
  console.log(
    "  - supplier-bulk-upload-products: Bulk Upload Products (Supplier)"
  );
  console.log(
    "  - single-product-enhancement: Single Product Enhancement with Preview"
  );
  console.log("");
  console.log("✅ Server ready to receive Inngest function calls");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});
