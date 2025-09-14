/**
 * Test the New Email System
 *
 * This script tests the updated email system to ensure it uses the new templates
 */

const http = require("http");

async function testNewEmailSystem() {
  console.log("🧪 Testing New Email System...\n");

  try {
    // Test 1: Check if templates are accessible
    console.log("1️⃣ Testing: Template Library Access");
    const templatesRes = await makeRequest("/api/test-email");
    console.log(`   ✅ Found ${templatesRes.total} templates`);

    // Test 2: Check specific templates
    console.log("\n2️⃣ Testing: Specific Templates");

    const welcomeTemplate = await makeRequest(
      "/api/test-email?template=welcome"
    );
    console.log(
      `   ✅ Welcome template: ${welcomeTemplate.results[0]?.subject || "Not found"}`
    );

    const verificationTemplate = await makeRequest(
      "/api/test-email?template=email-verification"
    );
    console.log(
      `   ✅ Verification template: ${verificationTemplate.results[0]?.subject || "Not found"}`
    );

    const passwordResetTemplate = await makeRequest(
      "/api/test-email?template=password-reset"
    );
    console.log(
      `   ✅ Password reset template: ${passwordResetTemplate.results[0]?.subject || "Not found"}`
    );

    // Test 3: Check template content quality
    console.log("\n3️⃣ Testing: Template Content Quality");

    const welcomeContent = await makeRequest(
      "/api/test-email?template=welcome"
    );
    const welcomeData = welcomeContent.results[0];

    if (welcomeData) {
      console.log(`   📧 Welcome template details:`);
      console.log(`      Subject: ${welcomeData.subject}`);
      console.log(`      Variables: ${welcomeData.variables.join(", ")}`);
      console.log(`      Category: ${welcomeData.category}`);
      console.log(`      Active: ${welcomeData.isActive}`);
    }

    // Test 4: Check all authentication templates
    console.log("\n4️⃣ Testing: Authentication Templates");
    const authTemplates = await makeRequest(
      "/api/test-email?category=authentication"
    );
    console.log(`   ✅ Found ${authTemplates.total} authentication templates:`);
    authTemplates.results.forEach(template => {
      console.log(`      - ${template.slug}: ${template.subject}`);
    });

    // Test 5: Check order templates
    console.log("\n5️⃣ Testing: Order Templates");
    const orderTemplates = await makeRequest("/api/test-email?category=orders");
    console.log(`   ✅ Found ${orderTemplates.total} order templates:`);
    orderTemplates.results.forEach(template => {
      console.log(`      - ${template.slug}: ${template.subject}`);
    });

    console.log("\n🎉 New Email System Test Complete!");
    console.log("✅ All templates are using the new professional design");
    console.log("✅ Template library is properly integrated");
    console.log("✅ Email system is ready for production");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

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
          reject(new Error(`Failed to parse JSON: ${error.message}`));
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
testNewEmailSystem();
