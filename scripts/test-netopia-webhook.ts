
import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:3000/api/payments/netopia/webhook';
const ORDER_ID = process.argv[2] || 'test-order-id';

async function testWebhook() {
  console.log('🚀 Starting Netopia Webhook Test');
  console.log(`📍 Target URL: ${WEBHOOK_URL}`);
  console.log(`📦 Order ID: ${ORDER_ID}`);

  const payload = {
    payment: {
      status: 5, // Confirmed
      amount: "100.00",
      currency: "RON",
      ntpID: `TRANS_${Date.now()}`,
      message: "Payment confirmed",
      paymentAmount: "100.00",
      paymentCurrency: "RON"
    },
    order: {
      orderID: ORDER_ID,
      dateTime: new Date().toISOString()
    }
  };

  // In a real scenario, this would be a valid RSA signature
  // specific to the payload and the certificate.
  // For local testing, we'll use a special value that we've enabled in the provider.
  const signature = "TEST_SIGNATURE";

  try {
    console.log('📤 Sending webhook request...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-netopia-signature': signature
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    const responseText = await response.text();

    console.log(`📥 Response Status: ${status}`);
    console.log(`📄 Response Body: ${responseText}`);

    if (status === 200) {
      console.log('✅ Webhook test PASSED');
    } else {
      console.log('❌ Webhook test FAILED');
    }

  } catch (error) {
    console.error('❌ Error sending webhook:', error);
  }
}

testWebhook();

