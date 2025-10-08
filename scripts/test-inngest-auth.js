/**
 * Quick Inngest Authentication Test
 *
 * This script quickly checks if Inngest authentication is working in production.
 * Run this after updating environment variables to verify the fix.
 *
 * Usage: node scripts/test-inngest-auth.js
 */

const https = require("https");

const PRODUCTION_URL = "https://www.techtots.ro/api/inngest";

console.log("🔍 Testing Inngest authentication...\n");

https
  .get(PRODUCTION_URL, res => {
    let data = "";

    res.on("data", chunk => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const response = JSON.parse(data);

        console.log("📡 Production Endpoint Response:");
        console.log("─".repeat(50));
        console.log(JSON.stringify(response, null, 2));
        console.log("─".repeat(50));
        console.log("");

        // Check authentication
        if (response.authentication_succeeded === true) {
          console.log("✅ SUCCESS! Authentication is working!");
          console.log(
            "✅ Inngest can now execute your functions in production."
          );
          console.log("");
          console.log("Next steps:");
          console.log("  1. Try generating a blog post in your admin panel");
          console.log("  2. Watch the execution in Inngest Dashboard");
          console.log("  3. Check AIJob table for COMPLETED status");
          console.log("");
          console.log("🎉 Your Inngest setup is now complete!");
        } else if (response.authentication_succeeded === false) {
          console.log("❌ FAILED! Authentication is not working.");
          console.log("");
          console.log("This means:");
          console.log("  - Your INNGEST_SIGNING_KEY in Vercel does not match");
          console.log("  - OR you need to redeploy after updating env vars");
          console.log("");
          console.log("To fix:");
          console.log("  1. Go to https://app.inngest.com/");
          console.log("  2. Copy your EXACT Signing Key");
          console.log("  3. Update INNGEST_SIGNING_KEY in Vercel");
          console.log("  4. Redeploy your application");
          console.log("");
          console.log("📖 See INNGEST_FIX_STEPS.md for detailed instructions");
        } else {
          console.log("⚠️  Could not determine authentication status");
          console.log("");
          console.log("Response details:");
          console.log(`  - Has Event Key: ${response.has_event_key}`);
          console.log(`  - Has Signing Key: ${response.has_signing_key}`);
          console.log(`  - Function Count: ${response.function_count}`);
          console.log(`  - Mode: ${response.mode}`);
        }
      } catch (error) {
        console.log("❌ Failed to parse response");
        console.log("Response:", data);
      }
    });
  })
  .on("error", err => {
    console.log("❌ Failed to connect to production endpoint");
    console.log("Error:", err.message);
    console.log("");
    console.log("Possible causes:");
    console.log("  - Production site is down");
    console.log("  - Network connectivity issues");
    console.log("  - /api/inngest endpoint not deployed");
  });
