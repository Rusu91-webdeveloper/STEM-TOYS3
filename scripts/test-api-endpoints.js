#!/usr/bin/env node

const { execSync } = require("child_process");

/**
 * Script to test that all important API endpoints are working on localhost:3000
 */

const BASE_URL = "http://localhost:3000";

const endpoints = [
  { path: "/api/health", method: "GET", description: "Health check" },
  {
    path: "/api/auth/validate-session",
    method: "GET",
    description: "Auth validation",
  },
  { path: "/api/products", method: "GET", description: "Products listing" },
  { path: "/api/categories", method: "GET", description: "Categories listing" },
  { path: "/api/books", method: "GET", description: "Books listing" },
  {
    path: "/api/health/database",
    method: "GET",
    description: "Database health",
  },
];

async function testEndpoint(endpoint) {
  try {
    const command = `curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}${endpoint.path}"`;
    const statusCode = execSync(command, { encoding: "utf8" }).trim();

    return {
      ...endpoint,
      statusCode: parseInt(statusCode),
      success: parseInt(statusCode) >= 200 && parseInt(statusCode) < 400,
    };
  } catch (error) {
    return {
      ...endpoint,
      statusCode: 0,
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log("🧪 Testing API endpoints on localhost:3000...\n");

  // Check if server is running
  try {
    execSync(`curl -s "${BASE_URL}/api/health" > /dev/null`, {
      encoding: "utf8",
    });
  } catch (error) {
    console.log("❌ Server is not running on localhost:3000");
    console.log("   Please start the development server with: npm run dev");
    process.exit(1);
  }

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    const status = result.success ? "✅" : "❌";
    console.log(
      `${status} ${endpoint.description}: ${endpoint.path} (${result.statusCode})`
    );
  }

  console.log("\n📊 Summary:");
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`   ${successCount}/${totalCount} endpoints working correctly`);

  if (successCount === totalCount) {
    console.log("✅ All API endpoints are working on localhost:3000!");
  } else {
    console.log("❌ Some endpoints are not working properly");

    const failed = results.filter(r => !r.success);
    console.log("\nFailed endpoints:");
    failed.forEach(endpoint => {
      console.log(`   • ${endpoint.path} - Status: ${endpoint.statusCode}`);
      if (endpoint.error) {
        console.log(`     Error: ${endpoint.error}`);
      }
    });
  }

  console.log(`\n🌐 Your application is available at: ${BASE_URL}`);
}

runTests().catch(console.error);
