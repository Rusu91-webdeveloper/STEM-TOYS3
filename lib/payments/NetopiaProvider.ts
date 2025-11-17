import {
  IPaymentProvider,
  OrderData,
  PaymentResult,
  RefundResult,
  PaymentStatus,
} from "./IPaymentProvider";
// Import Netopia SDK - verified exports: Netopia, Ipn, constants
import * as NetopiaModule from "netopia-payment2";
const { Netopia, Ipn } = NetopiaModule;

export class NetopiaPaymentError extends Error {
  constructor(
    public code: NetopiaErrorCode,
    message: string
  ) {
    super(message);
    this.name = "NetopiaPaymentError";
  }
}

export enum NetopiaErrorCode {
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  PAYMENT_DECLINED = "PAYMENT_DECLINED",
  TIMEOUT = "TIMEOUT",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
}

export class NetopiaProvider implements IPaymentProvider {
  private netopia: any;
  private ipn: any;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.NETOPIA_API_KEY;
    const signature = process.env.NETOPIA_SIGNATURE;
    const isLive = process.env.NETOPIA_SANDBOX !== "true";
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!apiKey || !signature) {
      throw new NetopiaPaymentError(
        NetopiaErrorCode.INVALID_CONFIGURATION,
        "Netopia API key and signature are required"
      );
    }

    this.netopia = new Netopia({
      apiKey,
      posSignature: signature,
      isLive,
    });

    // Get the public key certificate from environment
    const publicKeyCertificate = process.env.NETOPIA_WEBHOOK_SECRET;

    this.ipn = new Ipn({
      posSignature: signature,
      posSignatureSet: [signature],
      hashMethod: "sha512",
      alg: "RS512",
      publicKeyStr: publicKeyCertificate || "", // Certificate for webhook verification
    });
  }

  async createPayment(orderData: OrderData): Promise<PaymentResult> {
    try {
      // Netopia POS is configured for RON-only; enforce RON amounts
      if (orderData.currency !== "RON") {
        throw new NetopiaPaymentError(
          NetopiaErrorCode.INVALID_AMOUNT,
          "Netopia payments require RON amounts; convert before creating the payment"
        );
      }

      const amountInRON = orderData.amount;

      // Prepare billing data
      const billingData = {
        email: orderData.customer.email,
        phone: orderData.customer.phone || "",
        firstName: orderData.customer.name.split(" ")[0] || "",
        lastName: orderData.customer.name.split(" ").slice(1).join(" ") || "",
        city: orderData.customer.address?.city || "",
        country: 642, // Romania country code
        countryName: "Romania",
        state: orderData.customer.address?.city || "",
        postalCode: orderData.customer.address?.postalCode || "",
        details:
          orderData.customer.address?.street ||
          orderData.customer.address?.addressLine1 ||
          "",
      };

      // Prepare shipping data (same as billing for now)
      const shippingData = { ...billingData };

      // Prepare order data (let Netopia assign ntpID)
      const netopiaOrderData = {
        posSignature: process.env.NETOPIA_SIGNATURE!,
        dateTime: new Date().toISOString(),
        orderID: orderData.id,
        description: `Order ${orderData.id}`,
        amount: amountInRON,
        currency: "RON",
        billing: billingData,
        shipping: shippingData,
        products:
          orderData.products?.map(item => ({
            name: item.name,
            code: item.code || "",
            category: item.category || "",
            price: item.price,
            vat: item.vat ?? 0,
            qty: item.quantity ?? 1,
          })) || [],
        installments: {
          selected: 0,
          available: 1,
        },
        data: {
          orderId: orderData.id,
          ...orderData.metadata,
        },
      };

      // Prepare config data
      const configData = {
        emailTemplate: "default",
        emailSubject: `Order Confirmation - ${orderData.id}`,
        cancelUrl: `${this.baseUrl}/checkout/cancelled`,
        notifyUrl: `${this.baseUrl}/api/payments/netopia/webhook`,
        redirectUrl: `${this.baseUrl}/checkout/netopia/callback`,
        language: "ro", // Romanian
      };

      // Prepare payment data
      const paymentData = {
        options: {
          installments: 0,
          bonus: 0,
          split: [],
        },
        data: {},
      };

      // Validate Netopia instance is initialized
      if (!this.netopia || typeof this.netopia.createOrder !== "function") {
        console.error("❌ [NETOPIA] SDK not properly initialized");
        throw new NetopiaPaymentError(
          NetopiaErrorCode.INVALID_CONFIGURATION,
          "Netopia SDK is not properly initialized. Check your API credentials."
        );
      }

      // Log request data in development
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 [NETOPIA] Request data:", {
          configData,
          paymentData,
          netopiaOrderData: {
            ...netopiaOrderData,
            posSignature: netopiaOrderData.posSignature ? "***" : undefined,
          },
          isLive: process.env.NETOPIA_SANDBOX !== "true",
          hasApiKey: !!process.env.NETOPIA_API_KEY,
          hasSignature: !!process.env.NETOPIA_SIGNATURE,
        });
      }

      let response;
      try {
        response = await this.netopia.createOrder(
          configData,
          paymentData,
          netopiaOrderData
        );
      } catch (sdkError: any) {
        console.error("❌ [NETOPIA] SDK error during createOrder:", {
          error: sdkError,
          message: sdkError?.message,
          stack: process.env.NODE_ENV === "development" ? sdkError?.stack : undefined,
        });
        throw new NetopiaPaymentError(
          NetopiaErrorCode.NETWORK_ERROR,
          `Netopia SDK error: ${sdkError?.message || "Unknown error during payment creation"}`
        );
      }

      // Log full response in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 [NETOPIA] Full API response:", JSON.stringify(response, null, 2));
      }

      // Check if response is valid
      if (!response) {
        console.error("❌ [NETOPIA] No response received from createOrder");
        throw new NetopiaPaymentError(
          NetopiaErrorCode.NETWORK_ERROR,
          "No response received from Netopia API"
        );
      }

      // Handle different response code formats
      // Use nullish coalescing (??) instead of || because 0 is falsy but valid
      const responseCode = response.code ?? response.statusCode ?? response.status;
      
      // Check for SDK internal errors FIRST (code 0 means SDK caught an exception)
      // This happens when the SDK tries to access paymentURL from a failed API response
      // Must check for 0 explicitly (not falsy, since 0 is falsy in JavaScript)
      if (responseCode === 0 || responseCode === "0" || (response.hasOwnProperty('code') && response.code === 0)) {
        const errorData = response.data || response.error || response.message;
        console.error("❌ [NETOPIA] SDK internal error (code 0):", {
          message: response.message,
          errorData: typeof errorData === "string" ? errorData : JSON.stringify(errorData),
          fullResponse: process.env.NODE_ENV === "development" ? response : undefined,
        });
        
        // Check if it's a paymentURL access error (SDK bug - API returned error but SDK tried to parse success response)
        if (typeof errorData === "string" && errorData.includes("paymentURL")) {
          throw new NetopiaPaymentError(
            NetopiaErrorCode.NETWORK_ERROR,
            "Netopia API returned an error response, but the SDK tried to access paymentURL from it. " +
            "This indicates the Netopia API rejected your request. Common causes:\n" +
            "1. Invalid or incorrect sandbox API credentials (NETOPIA_API_KEY, NETOPIA_SIGNATURE)\n" +
            "2. Request format doesn't match Netopia's expected structure\n" +
            "3. API endpoint configuration issue\n" +
            "4. Sandbox account not properly activated\n\n" +
            "Please verify:\n" +
            "- NETOPIA_SANDBOX=true is set\n" +
            "- Your sandbox credentials are correct and active\n" +
            "- Contact Netopia support if credentials are correct but still failing"
          );
        }
        
        throw new NetopiaPaymentError(
          NetopiaErrorCode.NETWORK_ERROR,
          `Netopia SDK error: ${response.message || "Unknown error"}${typeof errorData === "string" ? ` - ${errorData}` : ""}`
        );
      }
      
      // Handle other non-200 status codes
      if (responseCode !== 200 && responseCode !== "200") {
        console.error("❌ [NETOPIA] createOrder failed:", {
          code: responseCode,
          message: response.message || response.error || "Unknown error",
          data: response.data,
          response: process.env.NODE_ENV === "development" ? response : undefined,
        });
        
        // Provide more specific error messages based on status code
        let errorMessage = response.message || response.error || "Payment creation failed";
        if (responseCode === 400) {
          errorMessage = "Invalid request format. Please check your order data structure.";
        } else if (responseCode === 401) {
          errorMessage = "Authentication failed. Please verify your NETOPIA_API_KEY and NETOPIA_SIGNATURE.";
        } else if (responseCode === 404) {
          errorMessage = "API endpoint not found. Please check your Netopia SDK configuration.";
        }
        
        throw new NetopiaPaymentError(
          NetopiaErrorCode.PAYMENT_DECLINED,
          errorMessage
        );
      }

      // Try multiple paths to extract payment URL
      const paymentUrl =
        response.data?.payment?.paymentURL ||
        response.data?.payment?.paymentUrl ||
        response.data?.paymentURL ||
        response.paymentURL ||
        response.paymentUrl ||
        response.data?.url ||
        response.url;

      // Try multiple paths to extract transaction ID
      const netopiaTransactionId =
        response.data?.payment?.ntpID ||
        response.data?.payment?.ntpId ||
        response.data?.ntpID ||
        response.data?.ntpId ||
        response.ntpID ||
        response.ntpId ||
        response.data?.transactionId ||
        response.transactionId ||
        this.netopia?.ntpID;

      // Log what we found for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 [NETOPIA] Extracted values:", {
          paymentUrl: paymentUrl ? "✓ Found" : "✗ Missing",
          transactionId: netopiaTransactionId ? "✓ Found" : "✗ Missing",
          responseStructure: {
            hasData: !!response.data,
            hasPayment: !!response.data?.payment,
            topLevelKeys: Object.keys(response),
            dataKeys: response.data ? Object.keys(response.data) : [],
          },
        });
      }

      // Validate we have required data
      if (!paymentUrl) {
        console.error("❌ [NETOPIA] Missing payment URL in response:", {
          responseKeys: Object.keys(response),
          dataKeys: response.data ? Object.keys(response.data) : [],
          fullResponse: process.env.NODE_ENV === "development" ? response : "hidden",
        });
        throw new NetopiaPaymentError(
          NetopiaErrorCode.PAYMENT_DECLINED,
          "Netopia did not return a payment URL. Check your API credentials and sandbox configuration."
        );
      }

      if (!netopiaTransactionId) {
        console.warn("⚠️ [NETOPIA] Missing transaction ID, using order ID as fallback");
      }

      return {
        paymentUrl,
        invoiceId: netopiaTransactionId || orderData.id,
        transactionId: netopiaTransactionId || orderData.id,
        status: "pending",
      };
    } catch (error) {
      if (error instanceof NetopiaPaymentError) {
        throw error;
      }

      throw new NetopiaPaymentError(
        NetopiaErrorCode.NETWORK_ERROR,
        `Payment creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async handleWebhook(payloadOrRaw: any, signature: string): Promise<void> {
    try {
      const rawBody =
        typeof payloadOrRaw === "string"
          ? payloadOrRaw
          : JSON.stringify(payloadOrRaw);
      const payload =
        typeof payloadOrRaw === "string"
          ? JSON.parse(payloadOrRaw)
          : payloadOrRaw;

      // Verify the webhook signature
      const verificationResult = await this.ipn.verify(signature, rawBody);

      if (
        verificationResult.errorType !== 0 ||
        verificationResult.status !== 1
      ) {
        throw new NetopiaPaymentError(
          NetopiaErrorCode.INVALID_SIGNATURE,
          "Invalid webhook signature"
        );
      }

      // Process the payment notification
      const paymentStatusCode =
        payload?.payment?.status ?? payload?.status ?? payload?.state;
      const ntpID =
        payload?.payment?.ntpID ||
        payload?.payment?.ntpId ||
        payload?.ntpID ||
        payload?.ntpId;
      const orderID = payload?.order?.orderID || payload?.orderID;
      const amount =
        payload?.payment?.amount ?? payload?.amount ?? payload?.payment?.paymentAmount;
      const currency =
        payload?.payment?.currency ?? payload?.currency ?? payload?.payment?.paymentCurrency;

      // Here you would update your database based on the payment status
      // This is a placeholder - you'll need to integrate with your database layer
      console.log("Processing Netopia webhook:", {
        ntpID,
        orderID,
        status: paymentStatusCode,
        amount,
        currency,
      });

      // Status codes from Netopia:
      // 3 = Paid, 5 = Confirmed, 4 = Cancelled, 12 = Rejected, 15 = Need authorize
    } catch (error) {
      throw new NetopiaPaymentError(
        NetopiaErrorCode.INVALID_SIGNATURE,
        `Webhook processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    // Note: Netopia SDK may not have a direct refund method
    // Refunds are typically handled through their merchant dashboard
    // or specific API endpoints that may not be in the public SDK

    throw new NetopiaPaymentError(
      NetopiaErrorCode.NETWORK_ERROR,
      "Refund functionality not yet implemented. Please use Netopia merchant dashboard for refunds."
    );
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await this.netopia.getStatus(transactionId);

      if (response.code !== 200) {
        throw new NetopiaPaymentError(
          NetopiaErrorCode.NETWORK_ERROR,
          "Failed to get payment status"
        );
      }

      // Parse the status from Netopia response
      const statusData = response.data;
      let status: PaymentStatus["status"] = "pending";

      // Map Netopia status codes to our enum (constants from SDK)
      if (statusData) {
        const netopiaStatus = parseInt(statusData.status || "0");
        switch (netopiaStatus) {
          case 3: // PAID
          case 5: // CONFIRMED
            status = "paid";
            break;
          case 4: // CANCELED
            status = "cancelled";
            break;
          case 8: // CREDIT
          case 17: // REVERSED
            status = "refunded";
            break;
          case 11: // ERROR
          case 12: // DECLINED
          case 13: // FRAUD
            status = "failed";
            break;
          default:
            status = "pending";
        }
      }

      return {
        status,
        transactionId,
        amount: parseFloat(statusData?.amount || "0"),
        currency: statusData?.currency || "RON",
      };
    } catch (error) {
      throw new NetopiaPaymentError(
        NetopiaErrorCode.NETWORK_ERROR,
        `Status check failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
