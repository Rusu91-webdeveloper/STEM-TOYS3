#!/usr/bin/env node

/**
 * Google Search Console Verification Helper
 * Helps verify GSC setup and provides next steps
 */

const https = require("https");
const { URL } = require("url");

const DOMAIN = "techtots.ro";
const VERIFICATION_METHODS = {
  HTML_FILE: "html_file",
  META_TAG: "meta_tag",
  DNS_TXT: "dns_txt",
  GOOGLE_ANALYTICS: "google_analytics",
};

async function checkVerificationFile() {
  console.log("🔍 Checking HTML verification file...");

  const verificationUrls = [
    `https://${DOMAIN}/google-site-verification.html`,
    `https://${DOMAIN}/google[random-string].html`, // Placeholder for actual file
  ];

  for (const url of verificationUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ Verification file accessible: ${url}`);
        return true;
      }
    } catch (error) {
      console.log(`❌ Verification file not found: ${url}`);
    }
  }

  return false;
}

async function checkMetaTag() {
  console.log("🔍 Checking meta tag verification...");

  try {
    const response = await fetch(`https://${DOMAIN}`);
    const html = await response.text();

    const hasGoogleVerification = html.includes("google-site-verification");
    const hasMetaTag = html.includes('<meta name="google-site-verification"');

    if (hasGoogleVerification || hasMetaTag) {
      console.log("✅ Google verification meta tag found");
      return true;
    } else {
      console.log("❌ Google verification meta tag not found");
      return false;
    }
  } catch (error) {
    console.log("❌ Error checking meta tag:", error.message);
    return false;
  }
}

async function checkDNSVerification() {
  console.log("🔍 Checking DNS TXT record verification...");

  const dns = require("dns").promises;

  try {
    const records = await dns.resolveTxt(DOMAIN);
    const googleVerification = records.find(record =>
      record.some(txt => txt.includes("google-site-verification"))
    );

    if (googleVerification) {
      console.log("✅ Google verification TXT record found");
      console.log("   Record:", googleVerification.join(""));
      return true;
    } else {
      console.log("❌ Google verification TXT record not found");
      return false;
    }
  } catch (error) {
    console.log("❌ Error checking DNS records:", error.message);
    return false;
  }
}

async function checkSiteAccessibility() {
  console.log("🔍 Checking site accessibility...");

  const urls = [
    `https://${DOMAIN}`,
    `https://www.${DOMAIN}`,
    `https://${DOMAIN}/sitemap.xml`,
    `https://${DOMAIN}/robots.txt`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      console.log(
        `${response.ok ? "✅" : "❌"} ${url}: HTTP ${response.status}`
      );
    } catch (error) {
      console.log(`❌ ${url}: ${error.message}`);
    }
  }
}

async function provideNextSteps() {
  console.log("\n📋 Next Steps for Google Search Console Setup:");
  console.log("");
  console.log(
    "1. 🏠 Go to Google Search Console: https://search.google.com/search-console"
  );
  console.log('2. ➕ Click "Add Property" and select "Domain"');
  console.log("3. 📝 Enter your domain: techtots.ro");
  console.log("4. 🔐 Choose verification method:");
  console.log("   - HTML file (recommended)");
  console.log("   - Meta tag");
  console.log("   - DNS TXT record");
  console.log("5. ✅ Follow the verification steps");
  console.log("6. 🗺️ Submit your sitemap: https://techtots.ro/sitemap.xml");
  console.log("7. 📊 Connect Google Analytics 4");
  console.log("8. ⚡ Monitor Core Web Vitals");
  console.log("");
  console.log("🎯 For TechTots specifically:");
  console.log(
    "- Ensure both Romanian (ro) and English (en) content is indexed"
  );
  console.log("- Monitor STEM-related keywords performance");
  console.log("- Set up alerts for Romanian market trends");
  console.log("- Track product page performance");
}

async function main() {
  console.log("🚀 Google Search Console Verification Helper for TechTots\n");

  // Check site accessibility first
  await checkSiteAccessibility();
  console.log("");

  // Check verification methods
  const htmlFile = await checkVerificationFile();
  const metaTag = await checkMetaTag();
  const dnsRecord = await checkDNSVerification();

  console.log("\n📊 Verification Status:");
  console.log(`HTML File: ${htmlFile ? "✅" : "❌"}`);
  console.log(`Meta Tag: ${metaTag ? "✅" : "❌"}`);
  console.log(`DNS TXT: ${dnsRecord ? "✅" : "❌"}`);

  if (htmlFile || metaTag || dnsRecord) {
    console.log("\n🎉 At least one verification method is working!");
  } else {
    console.log(
      "\n⚠️ No verification methods detected. Please set up verification first."
    );
  }

  await provideNextSteps();
}

// Run the verification
main().catch(console.error);
