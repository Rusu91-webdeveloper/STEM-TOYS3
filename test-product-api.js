#!/usr/bin/env node

/**
 * Test script to verify the supplier product API endpoint
 * This will help us debug if the API is working correctly
 */

const testProductData = {
  name: "Test Product Debug",
  description: "This is a test product to debug the API endpoint",
  price: 29.99,
  stockQuantity: 10,
  isActive: true,
  featured: false,
  tags: ["test", "debug"],
  learningOutcomes: ["PROBLEM_SOLVING"],
  specialCategories: [],
  stemDiscipline: "GENERAL",
  images: [],
};

async function testProductAPI() {
  console.log("🧪 [TEST] Starting API test...");
  console.log("📝 [TEST] Test data:", testProductData);

  try {
    // First, get CSRF token
    console.log("🔑 [TEST] Getting CSRF token...");
    const csrfResponse = await fetch("http://localhost:3000/api/csrf-token");
    const csrfData = await csrfResponse.json();
    console.log("🔑 [TEST] CSRF response:", csrfData);
    console.log("🔑 [TEST] CSRF token:", csrfData.csrfToken);

    // Test the API endpoint
    console.log("🌐 [TEST] Testing POST /api/supplier/products...");
    const response = await fetch(
      "http://localhost:3000/api/supplier/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfData.csrfToken,
          // Note: This will fail without proper authentication, but we can see the error
        },
        body: JSON.stringify(testProductData),
      }
    );

    console.log("📡 [TEST] Response status:", response.status);
    console.log("📡 [TEST] Response ok:", response.ok);

    const responseText = await response.text();
    console.log("📡 [TEST] Response body:", responseText);

    if (response.ok) {
      console.log("✅ [TEST] API test successful!");
    } else {
      console.log("❌ [TEST] API test failed, but endpoint is reachable");
      console.log("❌ [TEST] This is expected without proper authentication");
    }
  } catch (error) {
    console.error("💥 [TEST] Error testing API:", error);
  }
}

// Run the test
testProductAPI();
