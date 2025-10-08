/**
 * Inngest Production Verification Script
 *
 * This script checks all the necessary configurations for Inngest to work in production.
 * Run this to diagnose why Inngest works locally but not in production.
 *
 * Usage: node scripts/verify-inngest-production.js
 */

const https = require("https");
const http = require("http");

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  info: msg => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: msg => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: msg => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: msg => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  header: msg =>
    console.log(`\n${COLORS.bright}${COLORS.cyan}${msg}${COLORS.reset}\n`),
};

// Configuration
const PRODUCTION_URL = "https://www.techtots.ro";
const LOCAL_URL = "http://localhost:3000";

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      })
      .on("error", err => {
        reject(err);
      });
  });
}

async function checkEndpoint(baseUrl, label) {
  log.header(`Checking ${label}: ${baseUrl}`);

  try {
    const response = await makeRequest(`${baseUrl}/api/inngest`);

    if (response.statusCode === 200) {
      log.success(`Endpoint is accessible (HTTP ${response.statusCode})`);

      // Try to parse response
      try {
        const data = JSON.parse(response.body);

        if (data.message || data.functions) {
          log.success(`Endpoint is returning valid Inngest data`);

          if (data.functions && Array.isArray(data.functions)) {
            log.success(`Functions registered: ${data.functions.length}`);
            data.functions.forEach(fn => {
              console.log(`  - ${fn.id || fn.name || JSON.stringify(fn)}`);
            });
          }

          if (data.hasEventKey !== undefined) {
            if (data.hasEventKey) {
              log.success(`INNGEST_EVENT_KEY is set`);
            } else {
              log.error(`INNGEST_EVENT_KEY is NOT set`);
            }
          }

          if (data.hasSigningKey !== undefined) {
            if (data.hasSigningKey) {
              log.success(`INNGEST_SIGNING_KEY is set`);
            } else {
              log.error(`INNGEST_SIGNING_KEY is NOT set`);
            }
          }
        } else {
          log.warning(`Response doesn't look like Inngest endpoint`);
          console.log(`Response: ${response.body.substring(0, 200)}`);
        }
      } catch (parseError) {
        log.warning(`Could not parse JSON response`);
        console.log(`Response: ${response.body.substring(0, 200)}`);
      }

      return true;
    } else {
      log.error(`Endpoint returned HTTP ${response.statusCode}`);
      console.log(`Response: ${response.body.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    log.error(`Could not reach endpoint: ${error.message}`);
    return false;
  }
}

async function checkLocalEnvironment() {
  log.header("Checking Local Environment Variables");

  // Check if .env.local exists
  const fs = require("fs");
  const path = require("path");

  const envPath = path.join(process.cwd(), ".env.local");

  if (fs.existsSync(envPath)) {
    log.success(".env.local file exists");

    const envContent = fs.readFileSync(envPath, "utf-8");

    if (envContent.includes("INNGEST_EVENT_KEY")) {
      log.success("INNGEST_EVENT_KEY found in .env.local");
    } else {
      log.error("INNGEST_EVENT_KEY NOT found in .env.local");
    }

    if (envContent.includes("INNGEST_SIGNING_KEY")) {
      log.success("INNGEST_SIGNING_KEY found in .env.local");
    } else {
      log.error("INNGEST_SIGNING_KEY NOT found in .env.local");
    }
  } else {
    log.warning(".env.local file not found");
  }
}

async function checkDatabaseConfig() {
  log.header("Checking Database Configuration");

  if (process.env.DATABASE_URL) {
    log.success("DATABASE_URL is set in current environment");
  } else {
    log.error("DATABASE_URL is NOT set in current environment");
  }

  if (process.env.DIRECT_URL) {
    log.success("DIRECT_URL is set in current environment");
  } else {
    log.warning("DIRECT_URL is NOT set (optional, but recommended)");
  }
}

async function checkInngestClient() {
  log.header("Checking Inngest Client Configuration");

  const fs = require("fs");
  const path = require("path");

  const clientPath = path.join(process.cwd(), "inngest", "client.ts");

  if (fs.existsSync(clientPath)) {
    log.success("inngest/client.ts exists");

    const clientContent = fs.readFileSync(clientPath, "utf-8");

    if (clientContent.includes("stem-toys-blog-generation")) {
      log.success("Inngest client ID: stem-toys-blog-generation");
    } else {
      log.warning("Could not verify Inngest client ID");
    }
  } else {
    log.error("inngest/client.ts NOT found");
  }
}

async function checkInngestFunctions() {
  log.header("Checking Inngest Functions");

  const fs = require("fs");
  const path = require("path");

  const functionsDir = path.join(process.cwd(), "inngest", "functions");

  if (fs.existsSync(functionsDir)) {
    const files = fs.readdirSync(functionsDir);
    log.success(`Found ${files.length} function file(s) in inngest/functions/`);
    files.forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    log.error("inngest/functions/ directory NOT found");
  }

  // Check API route
  const apiRoutePath = path.join(
    process.cwd(),
    "app",
    "api",
    "inngest",
    "route.ts"
  );

  if (fs.existsSync(apiRoutePath)) {
    log.success("app/api/inngest/route.ts exists");
  } else {
    log.error("app/api/inngest/route.ts NOT found");
  }
}

async function printSummary() {
  log.header("Summary & Next Steps");

  console.log(`
${COLORS.bright}What to do next:${COLORS.reset}

1. ${COLORS.cyan}Check Production Environment Variables in Vercel:${COLORS.reset}
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Ensure INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are set for Production
   - Redeploy if you added/updated them

2. ${COLORS.cyan}Sync Your App with Inngest Cloud:${COLORS.reset}
   - Go to: https://app.inngest.com/
   - Navigate to your app: "stem-toys-blog-generation"
   - Click "Sync" or add the production URL: https://www.techtots.ro/api/inngest

3. ${COLORS.cyan}Verify Functions Are Registered:${COLORS.reset}
   - In Inngest Dashboard, check that you see:
     * generate-blog
     * enhance-products
     * bulk-upload-products

4. ${COLORS.cyan}Test Blog Generation:${COLORS.reset}
   - Try generating a blog from your admin panel
   - Watch the execution in Inngest Dashboard
   - Check AIJob table for status updates

${COLORS.yellow}Common Issues:${COLORS.reset}
- ❌ Environment variables not set in Vercel → Add them and redeploy
- ❌ App not synced with Inngest Cloud → Use sync button in dashboard
- ❌ Wrong signing key → Copy from Inngest dashboard to Vercel
- ❌ /api/inngest endpoint not accessible → Check deployment logs

${COLORS.green}For more details, see:${COLORS.reset} INNGEST_PRODUCTION_DIAGNOSIS.md
  `);
}

async function main() {
  console.log(`
${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════╗
║   Inngest Production Verification Script                  ║
║   Diagnosing why Inngest works locally but not in prod    ║
╚════════════════════════════════════════════════════════════╝${COLORS.reset}
  `);

  // Check local configuration
  checkLocalEnvironment();
  checkDatabaseConfig();
  checkInngestClient();
  checkInngestFunctions();

  // Check local endpoint (if server is running)
  log.info("Checking if local server is running...");
  const localRunning = await checkEndpoint(LOCAL_URL, "Local Development");

  if (!localRunning) {
    log.warning("Local server is not running. Start it with: pnpm dev");
  }

  // Check production endpoint
  const productionRunning = await checkEndpoint(PRODUCTION_URL, "Production");

  if (!productionRunning) {
    log.error(
      "Production endpoint is not accessible or not configured correctly"
    );
    log.info("This is likely why your jobs stay in PENDING status");
  }

  // Print summary
  await printSummary();
}

// Run the script
main().catch(error => {
  console.error("Script error:", error);
  process.exit(1);
});
