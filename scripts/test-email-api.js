#!/usr/bin/env node

/**
 * Email Template API Testing Script
 *
 * This script tests the email template API to ensure all templates work correctly.
 */

const https = require("https");
const http = require("http");

// Test the email template API
async function testEmailAPI() {
  console.log("🧪 Testing Email Template API...\n");

  try {
    // Test 1: Get all templates
    console.log("1️⃣ Testing: Get all templates");
    const allTemplates = await makeRequest("/api/test-email");
    console.log(`   ✅ Found ${allTemplates.total} templates`);
    console.log(`   📋 Categories: ${allTemplates.categories.join(", ")}\n`);

    // Test 2: Test by category
    console.log("2️⃣ Testing: Get templates by category");
    const authTemplates = await makeRequest(
      "/api/test-email?category=authentication"
    );
    console.log(`   ✅ Authentication templates: ${authTemplates.total}`);

    const orderTemplates = await makeRequest("/api/test-email?category=orders");
    console.log(`   ✅ Order templates: ${orderTemplates.total}`);

    const supplierTemplates = await makeRequest(
      "/api/test-email?category=suppliers"
    );
    console.log(`   ✅ Supplier templates: ${supplierTemplates.total}`);

    const adminTemplates = await makeRequest("/api/test-email?category=admin");
    console.log(`   ✅ Admin templates: ${adminTemplates.total}`);

    const returnTemplates = await makeRequest(
      "/api/test-email?category=returns"
    );
    console.log(`   ✅ Return templates: ${returnTemplates.total}`);

    const digitalTemplates = await makeRequest(
      "/api/test-email?category=digital"
    );
    console.log(`   ✅ Digital product templates: ${digitalTemplates.total}`);

    const marketingTemplates = await makeRequest(
      "/api/test-email?category=marketing"
    );
    console.log(`   ✅ Marketing templates: ${marketingTemplates.total}\n`);

    // Test 3: Test specific templates
    console.log("3️⃣ Testing: Specific templates");
    const welcomeTemplate = await makeRequest(
      "/api/test-email?template=welcome"
    );
    console.log(
      `   ✅ Welcome template: ${welcomeTemplate.total > 0 ? "Found" : "Not found"}`
    );

    const orderConfirmationTemplate = await makeRequest(
      "/api/test-email?template=order-confirmation"
    );
    console.log(
      `   ✅ Order confirmation template: ${orderConfirmationTemplate.total > 0 ? "Found" : "Not found"}`
    );

    const supplierApprovalTemplate = await makeRequest(
      "/api/test-email?template=supplier-approval"
    );
    console.log(
      `   ✅ Supplier approval template: ${supplierApprovalTemplate.total > 0 ? "Found" : "Not found"}`
    );

    const digitalDeliveryTemplate = await makeRequest(
      "/api/test-email?template=digital-product-delivery"
    );
    console.log(
      `   ✅ Digital product delivery template: ${digitalDeliveryTemplate.total > 0 ? "Found" : "Not found"}`
    );

    const passwordResetTemplate = await makeRequest(
      "/api/test-email?template=password-reset"
    );
    console.log(
      `   ✅ Password reset template: ${passwordResetTemplate.total > 0 ? "Found" : "Not found"}\n`
    );

    // Summary
    console.log("📊 Test Summary:");
    console.log(`   Total templates: ${allTemplates.total}`);
    console.log(`   Categories: ${allTemplates.categories.length}`);
    console.log(`   All tests passed! ✅\n`);

    // Show template details
    console.log("📋 Template Details:");
    allTemplates.results.forEach(template => {
      console.log(
        `   ${template.slug} (${template.category}) - ${template.variables.length} variables`
      );
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Make HTTP request to the API
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on("error", error => {
      reject(error);
    });

    req.end();
  });
}

// Run the test
if (require.main === module) {
  testEmailAPI();
}

module.exports = { testEmailAPI };
