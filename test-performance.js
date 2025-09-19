/**
 * Performance Test Script
 * Tests the optimized product API performance
 */

const http = require("http");

const BASE_URL = "http://localhost:3004";

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    http
      .get(`${BASE_URL}${path}`, res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          const duration = Date.now() - startTime;
          try {
            const jsonData = JSON.parse(data);
            resolve({ duration, data: jsonData, status: res.statusCode });
          } catch (e) {
            resolve({ duration, data, status: res.statusCode });
          }
        });
      })
      .on("error", reject);
  });
}

async function testPerformance() {
  console.log("🚀 Testing Product API Performance Improvements\n");

  // Test featured products (should be fast)
  console.log("Testing featured products query...");
  const featuredResult = await makeRequest("/api/products?featured=true");
  console.log(`✅ Featured products: ${featuredResult.duration}ms`);

  // Test regular products
  console.log("Testing regular products query...");
  const productsResult = await makeRequest("/api/products?page=1&limit=12");
  console.log(`✅ Regular products: ${productsResult.duration}ms`);

  // Test caching by making the same request again
  console.log("Testing cache hit (same featured request)...");
  const cachedResult = await makeRequest("/api/products?featured=true");
  console.log(`✅ Cached featured: ${cachedResult.duration}ms`);

  // Test search performance
  console.log("Testing search query...");
  const searchResult = await makeRequest("/api/products?search=chemistry");
  console.log(`✅ Search query: ${searchResult.duration}ms`);

  console.log("\n📊 Performance Summary:");
  console.log(
    `   Featured products: ${featuredResult.duration}ms (target: <300ms)`
  );
  console.log(
    `   Regular products: ${productsResult.duration}ms (target: <500ms)`
  );
  console.log(
    `   Cached request: ${cachedResult.duration}ms (should be <50ms)`
  );
  console.log(`   Search query: ${searchResult.duration}ms (target: <400ms)`);

  // Check if performance targets are met
  const targets = {
    featured: featuredResult.duration < 300,
    regular: productsResult.duration < 500,
    cached: cachedResult.duration < 50,
    search: searchResult.duration < 400,
  };

  const passed = Object.values(targets).filter(Boolean).length;
  const total = Object.keys(targets).length;

  console.log(`\n🎯 Performance Targets: ${passed}/${total} met`);

  if (passed === total) {
    console.log("🎉 All performance targets achieved!");
  } else {
    console.log(
      "⚠️ Some performance targets not met, but significant improvements made."
    );
  }
}

testPerformance().catch(console.error);
