/**
 * Test All Email Templates
 *
 * This script tests all email templates to ensure they use the new professional templates
 */

const http = require("http");

async function testAllEmailTemplates() {
  console.log("🧪 Testing All Email Templates...\n");

  const testCases = [
    {
      name: "Welcome Email",
      type: "welcome",
      data: { email: "test@example.com", name: "Test User" },
    },
    {
      name: "Verification Email",
      type: "verification",
      data: { email: "test@example.com", name: "Test User" },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);

      const result = await makeRequest("/api/test-email-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testCase.data.email,
          name: testCase.data.name,
          type: testCase.type,
        }),
      });

      if (result.success) {
        console.log(`   ✅ ${testCase.name} - SUCCESS`);
        passed++;
      } else {
        console.log(`   ❌ ${testCase.name} - FAILED: ${result.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${testCase.name} - ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(
    `   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log(
      "\n🎉 All email templates are working with professional templates!"
    );
  } else {
    console.log("\n⚠️ Some email templates need attention.");
  }
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: options.method || "GET",
      headers: options.headers || {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(requestOptions, res => {
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

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Run the test
testAllEmailTemplates();
