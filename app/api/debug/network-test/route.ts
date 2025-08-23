import { NextResponse } from "next/server";

export async function GET() {
  const tests = {
    stripeCDN: false,
    stripeAPI: false,
    generalInternet: false,
  };

  try {
    // Test Stripe CDN connectivity
    try {
      const stripeCDNResponse = await fetch('https://js.stripe.com/v3', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      tests.stripeCDN = stripeCDNResponse.ok;
    } catch (error) {
      console.error("Stripe CDN test failed:", error);
    }

    // Test Stripe API connectivity
    try {
      const stripeAPIResponse = await fetch('https://api.stripe.com/v1/account', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      tests.stripeAPI = stripeAPIResponse.ok;
    } catch (error) {
      console.error("Stripe API test failed:", error);
    }

    // Test general internet connectivity
    try {
      const googleResponse = await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      tests.generalInternet = googleResponse.ok;
    } catch (error) {
      console.error("General internet test failed:", error);
    }

  } catch (error) {
    console.error("Network test error:", error);
  }

  return NextResponse.json({
    tests,
    timestamp: new Date().toISOString(),
    message: "Network connectivity test results"
  });
}
