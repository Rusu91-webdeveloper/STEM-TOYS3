#!/usr/bin/env node

/**
 * DNS Verification Script for TechTots
 * Verifies essential DNS records for Google Search Console setup
 */

const dns = require("dns").promises;
const { promisify } = require("util");

const DOMAIN = "techtots.com";
const WWW_DOMAIN = "www.techtots.com";

async function checkDNSRecord(domain, type) {
  try {
    const records = await dns.resolve(domain, type);
    console.log(`✅ ${type} record for ${domain}:`, records);
    return true;
  } catch (error) {
    console.log(`❌ ${type} record for ${domain}: Not found`);
    return false;
  }
}

async function checkTXTRecord(domain) {
  try {
    const records = await dns.resolveTxt(domain);
    console.log(`📝 TXT records for ${domain}:`, records);
    return records;
  } catch (error) {
    console.log(`❌ TXT records for ${domain}: Not found`);
    return [];
  }
}

async function verifyDNS() {
  console.log("🔍 Verifying DNS configuration for Google Search Console...\n");

  // Check A records
  console.log("Checking A records:");
  const aRecord = await checkDNSRecord(DOMAIN, "A");
  const wwwARecord = await checkDNSRecord(WWW_DOMAIN, "A");

  // Check CNAME records
  console.log("\nChecking CNAME records:");
  const cnameRecord = await checkDNSRecord(WWW_DOMAIN, "CNAME");

  // Check TXT records
  console.log("\nChecking TXT records:");
  const txtRecords = await checkTXTRecord(DOMAIN);

  // Check if site is accessible
  console.log("\nChecking site accessibility:");
  try {
    const https = require("https");
    const url = require("url");

    const checkUrl = urlString => {
      return new Promise(resolve => {
        const parsedUrl = url.parse(urlString);
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          path: parsedUrl.path,
          method: "HEAD",
          timeout: 5000,
        };

        const req = https.request(options, res => {
          console.log(`✅ ${urlString}: HTTP ${res.statusCode}`);
          resolve(true);
        });

        req.on("error", err => {
          console.log(`❌ ${urlString}: ${err.message}`);
          resolve(false);
        });

        req.on("timeout", () => {
          console.log(`⏰ ${urlString}: Timeout`);
          req.destroy();
          resolve(false);
        });

        req.end();
      });
    };

    await checkUrl(`https://${DOMAIN}`);
    await checkUrl(`https://${WWW_DOMAIN}`);
  } catch (error) {
    console.log("❌ Error checking site accessibility:", error.message);
  }

  // Summary
  console.log("\n📊 DNS Verification Summary:");
  console.log(`A Record (${DOMAIN}): ${aRecord ? "✅" : "❌"}`);
  console.log(`A Record (${WWW_DOMAIN}): ${wwwARecord ? "✅" : "❌"}`);
  console.log(`CNAME Record: ${cnameRecord ? "✅" : "❌"}`);
  console.log(`TXT Records: ${txtRecords.length > 0 ? "✅" : "❌"}`);

  if (aRecord && wwwARecord) {
    console.log("\n🎉 DNS configuration looks good for Google Search Console!");
  } else {
    console.log(
      "\n⚠️  Please configure your DNS records before proceeding with GSC setup."
    );
  }
}

// Run verification
verifyDNS().catch(console.error);
