/**
 * Test Coupon Email Script
 *
 * This script tests sending a coupon email using your Brevo configuration
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function testCouponEmail() {
  console.log("🧪 Testing Coupon Email Sending...\n");

  // Import after env is loaded
  const { sendCouponEmail } = await import("../lib/email/coupon-templates");
  const { db } = await import("../lib/db");

  try {
    // Check Brevo configuration
    console.log("1️⃣ Checking Brevo configuration...");
    console.log(
      `   EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || "resend (default)"}`
    );
    console.log(
      `   BREVO_API_KEY: ${process.env.BREVO_API_KEY ? "✅ SET" : "❌ NOT SET"}`
    );
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || "❌ NOT SET"}`);
    console.log(
      `   EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || "❌ NOT SET"}\n`
    );

    if (!process.env.BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY is not set!");
      process.exit(1);
    }

    // Get an existing coupon or create error
    console.log("2️⃣ Getting existing coupon...");
    const testCoupon = await db.coupon.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!testCoupon) {
      console.error("❌ No active coupons found in database!");
      console.log("\nPlease create a coupon in your admin dashboard first:");
      console.log("https://www.techtots.ro/admin/coupons");
      process.exit(1);
    }

    console.log(`   ✅ Using coupon: ${testCoupon.code}\n`);

    // Send test email
    const testEmail = process.env.TEST_EMAIL || "webira.rem.srl@gmail.com";
    console.log(`3️⃣ Sending test email to: ${testEmail}`);

    await sendCouponEmail({
      to: testEmail,
      coupon: testCoupon,
      subject: `Test Coupon Email - ${testCoupon.code}`,
      message:
        "This is a test email to verify your Brevo email configuration is working correctly.",
    });

    console.log("   ✅ Email sent successfully!\n");

    console.log("✅ SUCCESS! Your email configuration is working correctly!");
    console.log(`\nCheck your inbox at ${testEmail} for the test email.`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed!");
    console.error(error);
    process.exit(1);
  }
}

testCouponEmail();
