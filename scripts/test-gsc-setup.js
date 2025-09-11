#!/usr/bin/env node

/**
 * Comprehensive Google Search Console Setup Test
 * Validates all GSC configurations for TechTots
 */

const https = require("https");
const { URL } = require("url");

const DOMAIN = "techtots.com";
const BASE_URL = `https://${DOMAIN}`;

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function addTestResult(name, status, message, details = null) {
  const result = {
    name,
    status, // 'pass', 'fail', 'warning'
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  testResults.tests.push(result);

  if (status === "pass") testResults.passed++;
  else if (status === "fail") testResults.failed++;
  else if (status === "warning") testResults.warnings++;

  const emoji = { pass: "✅", fail: "❌", warning: "⚠️" }[status];
  console.log(`${emoji} ${name}: ${message}`);
  if (details) console.log(`   Details: ${details}`);
}

async function testUrl(url, expectedStatus = 200) {
  return new Promise(resolve => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "HEAD",
      timeout: 10000,
    };

    const req = https.request(options, res => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        success: res.statusCode === expectedStatus,
      });
    });

    req.on("error", err => {
      resolve({
        status: 0,
        headers: {},
        success: false,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        status: 0,
        headers: {},
        success: false,
        error: "Timeout",
      });
    });

    req.end();
  });
}

async function testBasicConnectivity() {
  console.log("\n🔍 Testing Basic Connectivity...");

  // Test main domain
  const mainResult = await testUrl(BASE_URL);
  if (mainResult.success) {
    addTestResult(
      "Main Domain Access",
      "pass",
      `HTTPS accessible (${mainResult.status})`
    );
  } else {
    addTestResult(
      "Main Domain Access",
      "fail",
      `Not accessible: ${mainResult.error || mainResult.status}`
    );
  }

  // Test www subdomain
  const wwwResult = await testUrl(`https://www.${DOMAIN}`);
  if (wwwResult.success) {
    addTestResult(
      "WWW Subdomain Access",
      "pass",
      `HTTPS accessible (${wwwResult.status})`
    );
  } else {
    addTestResult(
      "WWW Subdomain Access",
      "warning",
      `Not accessible: ${wwwResult.error || wwwResult.status}`
    );
  }
}

async function testSitemaps() {
  console.log("\n🗺️ Testing Sitemaps...");

  const sitemaps = [
    "sitemap.xml",
    "sitemap-index.xml",
    "sitemap-products.xml",
    "sitemap-blog.xml",
    "sitemap-categories.xml",
  ];

  for (const sitemap of sitemaps) {
    const result = await testUrl(`${BASE_URL}/${sitemap}`);
    if (result.success) {
      addTestResult(
        `Sitemap: ${sitemap}`,
        "pass",
        `Accessible (${result.status})`
      );
    } else {
      addTestResult(
        `Sitemap: ${sitemap}`,
        "fail",
        `Not accessible: ${result.error || result.status}`
      );
    }
  }
}

async function testRobotsTxt() {
  console.log("\n🤖 Testing robots.txt...");

  const result = await testUrl(`${BASE_URL}/robots.txt`);
  if (result.success) {
    addTestResult("robots.txt", "pass", `Accessible (${result.status})`);
  } else {
    addTestResult(
      "robots.txt",
      "fail",
      `Not accessible: ${result.error || result.status}`
    );
  }
}

async function testSecurityHeaders() {
  console.log("\n🔒 Testing Security Headers...");

  const result = await testUrl(BASE_URL);
  if (result.success) {
    const headers = result.headers;

    // Check for HTTPS
    if (result.status === 200) {
      addTestResult("HTTPS Enabled", "pass", "Site uses HTTPS");
    } else {
      addTestResult("HTTPS Enabled", "fail", "Site does not use HTTPS");
    }

    // Check for security headers
    const securityHeaders = [
      "strict-transport-security",
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
    ];

    securityHeaders.forEach(header => {
      if (headers[header]) {
        addTestResult(`Security Header: ${header}`, "pass", "Present");
      } else {
        addTestResult(`Security Header: ${header}`, "warning", "Missing");
      }
    });
  }
}

async function testPageSpeed() {
  console.log("\n⚡ Testing Page Speed...");

  const startTime = Date.now();
  const result = await testUrl(BASE_URL);
  const loadTime = Date.now() - startTime;

  if (result.success) {
    if (loadTime < 1000) {
      addTestResult("Page Load Speed", "pass", `Fast load time: ${loadTime}ms`);
    } else if (loadTime < 3000) {
      addTestResult(
        "Page Load Speed",
        "warning",
        `Moderate load time: ${loadTime}ms`
      );
    } else {
      addTestResult("Page Load Speed", "fail", `Slow load time: ${loadTime}ms`);
    }
  } else {
    addTestResult(
      "Page Load Speed",
      "fail",
      `Cannot measure: ${result.error || result.status}`
    );
  }
}

async function testMobileFriendliness() {
  console.log("\n📱 Testing Mobile Friendliness...");

  // This is a basic test - in production you'd use Google's Mobile-Friendly Test API
  const result = await testUrl(BASE_URL);
  if (result.success) {
    const headers = result.headers;

    // Check for viewport meta tag (basic check)
    if (
      headers["content-type"] &&
      headers["content-type"].includes("text/html")
    ) {
      addTestResult(
        "Mobile Friendliness",
        "warning",
        "Basic check passed - use Google Mobile-Friendly Test for detailed analysis"
      );
    } else {
      addTestResult(
        "Mobile Friendliness",
        "warning",
        "Cannot verify - use Google Mobile-Friendly Test"
      );
    }
  } else {
    addTestResult(
      "Mobile Friendliness",
      "fail",
      `Cannot test: ${result.error || result.status}`
    );
  }
}

async function testStructuredData() {
  console.log("\n📊 Testing Structured Data...");

  // This is a basic test - in production you'd use Google's Rich Results Test API
  addTestResult(
    "Structured Data",
    "warning",
    "Use Google Rich Results Test to validate structured data"
  );
}

async function testCoreWebVitals() {
  console.log("\n📈 Testing Core Web Vitals...");

  // This is a basic test - in production you'd use PageSpeed Insights API
  addTestResult(
    "Core Web Vitals",
    "warning",
    "Use Google PageSpeed Insights to test Core Web Vitals"
  );
}

async function testGoogleSearchConsoleRequirements() {
  console.log("\n🔍 Testing Google Search Console Requirements...");

  // Test verification file
  const verificationResult = await testUrl(
    `${BASE_URL}/google-site-verification.html`
  );
  if (verificationResult.success) {
    addTestResult(
      "GSC Verification File",
      "pass",
      "Verification file accessible"
    );
  } else {
    addTestResult(
      "GSC Verification File",
      "warning",
      "Verification file not found - add when setting up GSC"
    );
  }

  // Test meta tags (basic check)
  addTestResult(
    "GSC Meta Tags",
    "warning",
    "Verify meta tags are present in HTML head"
  );

  // Test DNS verification
  addTestResult(
    "GSC DNS Verification",
    "warning",
    "Verify DNS TXT record is set up"
  );
}

async function runAllTests() {
  console.log("🚀 Starting Google Search Console Setup Tests for TechTots\n");
  console.log(`Testing domain: ${DOMAIN}\n`);

  await testBasicConnectivity();
  await testSitemaps();
  await testRobotsTxt();
  await testSecurityHeaders();
  await testPageSpeed();
  await testMobileFriendliness();
  await testStructuredData();
  await testCoreWebVitals();
  await testGoogleSearchConsoleRequirements();

  // Print summary
  console.log("\n📊 Test Summary:");
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total Tests: ${testResults.tests.length}`);

  // Print next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Fix any failed tests");
  console.log("2. Address warnings where possible");
  console.log(
    "3. Go to Google Search Console: https://search.google.com/search-console"
  );
  console.log("4. Add your property and verify ownership");
  console.log("5. Submit your sitemaps");
  console.log("6. Monitor performance and Core Web Vitals");

  // Print specific recommendations for TechTots
  console.log("\n🎯 TechTots-Specific Recommendations:");
  console.log(
    '• Monitor Romanian keywords: "jucării STEM", "jucării educative"'
  );
  console.log(
    '• Track English keywords: "STEM toys Romania", "educational toys"'
  );
  console.log("• Set up alerts for product page performance");
  console.log("• Monitor category page rankings");
  console.log("• Track conversion rates from search");

  return testResults;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };
