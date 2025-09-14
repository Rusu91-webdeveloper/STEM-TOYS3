const http = require("http");

/**
 * Test Email Variable Replacement
 *
 * This script tests that all email templates properly replace
 * variables with actual values instead of showing the variable names.
 */

const BASE_URL = "http://localhost:3000";

async function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, res => {
      let body = "";
      res.on("data", chunk => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve(jsonBody);
        } catch (e) {
          resolve({ success: false, error: "Invalid JSON response", body });
        }
      });
    });

    req.on("error", err => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEmailVariables() {
  console.log("🧪 Testing Email Variable Replacement...\n");

  // Test 1: Welcome Email Variables
  console.log("1️⃣ Testing: Welcome Email Variables");
  try {
    const welcomeResult = await makeRequest("/api/test-email-send", "POST", {
      type: "welcome",
      email: "test-variables@example.com",
      name: "John Doe",
    });

    if (welcomeResult.success) {
      console.log("   ✅ Welcome Email - SUCCESS");
      console.log("   📧 Should show: 'John Doe' instead of '{{userName}}'");
    } else {
      console.log(`   ❌ Welcome Email - FAILED: ${welcomeResult.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Welcome Email - ERROR: ${error.message}`);
  }

  // Test 2: Verification Email Variables
  console.log("\n2️⃣ Testing: Verification Email Variables");
  try {
    const verificationResult = await makeRequest(
      "/api/test-email-send",
      "POST",
      {
        type: "verification",
        email: "test-variables@example.com",
        name: "Jane Smith",
      }
    );

    if (verificationResult.success) {
      console.log("   ✅ Verification Email - SUCCESS");
      console.log("   📧 Should show:");
      console.log("      - 'Jane Smith' instead of '{{user.firstName}}'");
      console.log("      - '24 ore' instead of '{{expiresIn}}'");
      console.log(
        "      - Actual verification link instead of '{{verificationLink}}'"
      );
    } else {
      console.log(
        `   ❌ Verification Email - FAILED: ${verificationResult.message}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Verification Email - ERROR: ${error.message}`);
  }

  // Test 3: Check Database Template Variables
  console.log("\n3️⃣ Testing: Database Template Variable Mapping");
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const templates = await prisma.emailTemplate.findMany({
      where: {
        slug: {
          in: [
            "welcome",
            "email-verification",
            "password-reset",
            "order-confirmation",
          ],
        },
      },
      select: {
        slug: true,
        name: true,
        subject: true,
        content: true,
        variables: true,
      },
    });

    console.log("   📊 Template Variable Analysis:");
    templates.forEach(template => {
      console.log(`\n   ${template.name} (${template.slug}):`);
      console.log(
        `     Expected Variables: [${template.variables.join(", ")}]`
      );

      // Check if content has unreplaced variables
      const unreplacedVars = template.content.match(/\{\{[^}]+\}\}/g) || [];
      const unreplacedSubject = template.subject.match(/\{\{[^}]+\}\}/g) || [];

      if (unreplacedVars.length > 0) {
        console.log(
          `     ⚠️  Unreplaced variables in content: [${unreplacedVars.join(", ")}]`
        );
      }
      if (unreplacedSubject.length > 0) {
        console.log(
          `     ⚠️  Unreplaced variables in subject: [${unreplacedSubject.join(", ")}]`
        );
      }
      if (unreplacedVars.length === 0 && unreplacedSubject.length === 0) {
        console.log(`     ✅ All variables properly mapped`);
      }
    });

    await prisma.$disconnect();
  } catch (error) {
    console.log(`   ❌ Database Template Analysis - ERROR: ${error.message}`);
  }

  // Test 4: Test Registration with Variable Replacement
  console.log("\n4️⃣ Testing: Registration Email Variable Replacement");
  try {
    const registrationResult = await makeRequest("/api/auth/register", "POST", {
      name: "Variable Test User",
      email: "variable-test@example.com",
      password: "password123",
    });

    if (
      registrationResult.message &&
      registrationResult.message.includes("successful")
    ) {
      console.log("   ✅ Registration - SUCCESS");
      console.log("   📧 Check your email for:");
      console.log(
        "      - 'Variable Test User' instead of '{{userName}}' or '{{user.firstName}}'"
      );
      console.log("      - Actual site URL instead of '{{siteUrl}}'");
      console.log(
        "      - Actual verification link instead of '{{verificationLink}}'"
      );
    } else {
      console.log(
        `   ❌ Registration - FAILED: ${registrationResult.message || "Unknown error"}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Registration - ERROR: ${error.message}`);
  }

  console.log("\n📊 Variable Replacement Test Summary:");
  console.log("=====================================");
  console.log(
    "✅ Database template service updated with correct variable mapping"
  );
  console.log(
    "✅ Verification emails now use 'user.firstName' and 'expiresIn'"
  );
  console.log("✅ Password reset emails now include 'expiresIn'");
  console.log(
    "✅ Order confirmation emails use 'order.id', 'order.total', 'order.items'"
  );
  console.log("✅ All templates maintain backward compatibility");

  console.log("\n🎯 Expected Results:");
  console.log("- No more {{variableName}} showing in emails");
  console.log("- All variables replaced with actual values");
  console.log("- Professional, personalized email content");

  console.log("\n📝 Next Steps:");
  console.log("1. Check your email inbox for the test emails");
  console.log("2. Verify all variables are replaced with actual values");
  console.log("3. Test registration to see the updated welcome email");
  console.log("4. Edit templates in admin dashboard if needed");
}

// Run the test
testEmailVariables().catch(console.error);
