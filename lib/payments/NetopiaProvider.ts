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
  API_ERROR = "API_ERROR",
  INVALID_RESPONSE = "INVALID_RESPONSE",
}

export class NetopiaProvider implements IPaymentProvider {
  private netopia: any;
  private ipn: any;
  private baseUrl: string;
  private netopiaGatewayUrl: string;
  private gatewayBaseCandidates: string[];
  private isLive: boolean;

  constructor() {
    const apiKey = process.env.NETOPIA_API_KEY;
    const signature = process.env.NETOPIA_SIGNATURE;
    this.isLive = process.env.NETOPIA_SANDBOX !== "true";
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const overrideBase = process.env.NETOPIA_API_BASE_URL?.trim();
    const defaultBases = this.isLive
      ? [
        "https://secure.mobilpay.ro/",
        "https://secure.netopia-payments.com/",
      ]
      : [
        "https://secure-sandbox.netopia-payments.com/",
        "https://sandboxsecure.mobilpay.ro/",
      ];

    this.gatewayBaseCandidates = [
      ...(overrideBase ? [overrideBase] : []),
      ...defaultBases,
    ].filter((value, index, self) => value && self.indexOf(value) === index);

    if (this.gatewayBaseCandidates.length === 0) {
      throw new NetopiaPaymentError(
        NetopiaErrorCode.INVALID_CONFIGURATION,
        "No Netopia API base URL configured. Set NETOPIA_API_BASE_URL or NETOPIA_SANDBOX."
      );
    }

    this.netopiaGatewayUrl = this.gatewayBaseCandidates[0];

    console.log("🔧 [NETOPIA] Initializing Netopia Provider...");
    console.log(`   Environment: ${this.isLive ? "PRODUCTION" : "SANDBOX"}`);
    console.log(`   Base URL: ${this.baseUrl}`);
    console.log(`   Netopia API: ${this.netopiaGatewayUrl}`);
    console.log(`   API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : "NOT SET"}`);
    console.log(`   Signature: ${signature ? `${signature.substring(0, 8)}...` : "NOT SET"}`);

    if (!apiKey || !signature) {
      console.error("❌ [NETOPIA] Missing required credentials");
      console.error("   Please set NETOPIA_API_KEY and NETOPIA_SIGNATURE environment variables");
      throw new NetopiaPaymentError(
        NetopiaErrorCode.INVALID_CONFIGURATION,
        "Netopia API key and signature are required. Check your environment variables."
      );
    }

    try {
      this.netopia = new Netopia({
        apiKey,
        posSignature: signature,
        isLive: this.isLive,
      });

      // Override SDK baseURL – package defaults to secure(-sandbox).netopia-payments.com,
      // which currently returns a 404; the API still lives under mobilpay.ro.
      if (this.netopia?.axios?.defaults) {
        this.netopia.axios.defaults.baseURL = this.netopiaGatewayUrl;
      }

      console.log("✅ [NETOPIA] Netopia SDK instance created successfully");
    } catch (error) {
      console.error("❌ [NETOPIA] Failed to initialize Netopia SDK:", error);
      throw new NetopiaPaymentError(
        NetopiaErrorCode.INVALID_CONFIGURATION,
        `Failed to initialize Netopia SDK: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Get and normalize the public key certificate from environment.
    // Handles both multiline PEM and collapsed one-line PEM values.
    const normalizePem = (raw?: string): string => {
      if (!raw) return "";
      const withNewlines = raw.replace(/\r/g, "").replace(/\\n/g, "\n").trim();

      const begin = "-----BEGIN CERTIFICATE-----";
      const end = "-----END CERTIFICATE-----";
      if (!withNewlines.includes(begin) || !withNewlines.includes(end)) {
        return withNewlines;
      }

      const certMatch = withNewlines.match(
        /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/
      );
      if (!certMatch) return withNewlines;

      const base64Body = certMatch[1].replace(/\s+/g, "");
      if (!base64Body) return withNewlines;

      const wrapped = base64Body.match(/.{1,64}/g)?.join("\n") || base64Body;
      return `${begin}\n${wrapped}\n${end}`;
    };

    const publicKeyCertificate = normalizePem(process.env.NETOPIA_WEBHOOK_SECRET);
    console.log(
      `   Webhook Secret: ${publicKeyCertificate ? "SET" : "NOT SET (optional)"}`
    );

    this.ipn = new Ipn({
      posSignature: signature,
      posSignatureSet: [signature],
      hashMethod: "sha512",
      alg: "RS512",
      publicKeyStr: publicKeyCertificate, // Certificate for webhook verification
    });

    console.log("✅ [NETOPIA] IPN handler initialized for webhook verification");
  }

  async createPayment(orderData: OrderData): Promise<PaymentResult> {
    console.log("💳 [NETOPIA] Starting payment creation...");
    console.log(`   Order ID: ${orderData.id}`);
    console.log(`   Amount: ${orderData.amount} ${orderData.currency}`);
    console.log(`   Customer: ${orderData.customer.name} (${orderData.customer.email})`);

    try {
      // Netopia POS is configured for RON-only; enforce RON amounts
      if (orderData.currency !== "RON") {
        console.error("❌ [NETOPIA] Currency validation failed");
        console.error(`   Expected: RON, Got: ${orderData.currency}`);
        throw new NetopiaPaymentError(
          NetopiaErrorCode.INVALID_AMOUNT,
          `Netopia payments require RON currency. Current: ${orderData.currency}. Please convert to RON before creating payment.`
        );
      }

      const amountInRON = orderData.amount;
      console.log("✅ [NETOPIA] Currency validation passed (RON)");

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
          available: [1],
        },
        data: {
          orderId: orderData.id,
          ...orderData.metadata,
        },
      };

      // Prepare config data
      const notifyUrl = `${this.baseUrl}/api/payments/netopia/webhook?orderId=${encodeURIComponent(
        orderData.id
      )}`;
      const configData = {
        emailTemplate: "default",
        emailSubject: `Order Confirmation - ${orderData.id}`,
        // Route both success and cancel back to the callback handler so status polling can run in dev
        cancelUrl: `${this.baseUrl}/checkout/netopia/callback?orderId=${encodeURIComponent(
          orderData.id
        )}`,
        notifyUrl,
        redirectUrl: `${this.baseUrl}/checkout/netopia/callback?orderId=${encodeURIComponent(
          orderData.id
        )}`,
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
        console.error("   Check if NETOPIA_API_KEY and NETOPIA_SIGNATURE are correctly set");
        throw new NetopiaPaymentError(
          NetopiaErrorCode.INVALID_CONFIGURATION,
          "Netopia SDK is not properly initialized. Check your API credentials."
        );
      }

      console.log("✅ [NETOPIA] SDK instance validated");

      // Log request data
      console.log("📤 [NETOPIA] Preparing API request...");
      console.log(`   Order ID: ${netopiaOrderData.orderID}`);
      console.log(`   Amount: ${netopiaOrderData.amount} RON`);
      console.log(`   Products: ${netopiaOrderData.products.length} items`);
      console.log(`   Cancel URL: ${configData.cancelUrl}`);
      console.log(`   Notify URL: ${configData.notifyUrl}`);
      console.log(`   Redirect URL: ${configData.redirectUrl}`);

      if (process.env.NODE_ENV === "development") {
        console.log("🔍 [NETOPIA] Full request data:", {
          config: configData,
          payment: paymentData,
          order: {
            ...netopiaOrderData,
            posSignature: netopiaOrderData.posSignature ? "***HIDDEN***" : undefined,
          },
          environment: process.env.NETOPIA_SANDBOX !== "true" ? "PRODUCTION" : "SANDBOX",
        });
      }

      // WORKAROUND: The SDK has a bug where it tries to access response.data.payment.paymentURL
      // before checking status codes. Make a direct HTTP call to get the actual error.
      let response;
      let lastError: Error | undefined;
      try {
        console.log("⏳ [NETOPIA] Making direct API call (bypassing buggy SDK)...");
        const axios = (await import("axios")).default;

        const requestPayload = {
          config: configData,
          payment: paymentData,
          order: {
            ...netopiaOrderData,
            posSignature: process.env.NETOPIA_SIGNATURE,
          },
        };

        const endpointPaths = this.isLive
          ? [
            "pay/payment/card/start", // Production (mobilpay)
            "payment/card/start",     // Fallback
          ]
          : [
            "payment/card/start", // Sandbox endpoint; avoid noisy 404 on /pay/payment
          ];

        const candidateEndpoints = this.gatewayBaseCandidates
          .flatMap(base =>
            endpointPaths.map(path => ({
              base,
              path,
              url: new URL(path, base).toString(),
            }))
          )
          .filter((candidate, index, self) => self.findIndex(c => c.url === candidate.url) === index);

        const errors: string[] = [];

        for (const candidate of candidateEndpoints) {
          try {
            console.log("   Base URL:", candidate.base);
            console.log("   Endpoint:", candidate.path);
            console.log("   Full URL (v2):", candidate.url);

            const directResponse = await axios.post(
              candidate.url,
              requestPayload,
              {
                headers: {
                  Authorization: process.env.NETOPIA_API_KEY || "",
                  "Content-Type": "application/json",
                },
                validateStatus: () => true, // Accept all status codes
              }
            );

            console.log("📥 [NETOPIA] Raw API Response:");
            console.log(`   Status: ${directResponse.status}`);
            console.log(`   Status Text: ${directResponse.statusText}`);

            if (process.env.NODE_ENV === "development") {
              console.log("🔍 [NETOPIA] Full response headers:");
              console.log(JSON.stringify(directResponse.headers, null, 2));
              console.log("🔍 [NETOPIA] Full response data:");
              console.log(JSON.stringify(directResponse.data, null, 2));
            }

            if (directResponse.status >= 400) {
              console.error("❌ [NETOPIA] API returned error status:", directResponse.status);
              console.error("   Response data:", JSON.stringify(directResponse.data, null, 2));

              const errorMessage = typeof directResponse.data === "object"
                ? JSON.stringify(directResponse.data, null, 2)
                : String(directResponse.data);

              const errorMsg = `Netopia API error (HTTP ${directResponse.status}) at ${candidate.url}: ${errorMessage}`;
              errors.push(errorMsg);

              lastError = new NetopiaPaymentError(
                NetopiaErrorCode.API_ERROR,
                errorMsg
              );

              // 404 just means wrong endpoint, continue.
              // 401/403 means auth failed -> definitive configuration error.
              if (directResponse.status === 401 || directResponse.status === 403) {
                throw lastError;
              }

              continue;
            }

            const apiData = directResponse.data;
            if (apiData?.error?.code && apiData.error.code !== "101" && apiData.error.code !== "100") {
              console.error("❌ [NETOPIA] API returned error:");
              console.error(`   Error Code: ${apiData.error.code}`);
              console.error(`   Error Message: ${apiData.error.message}`);

              const errorMsg = `Netopia API error (${apiData.error.code}) at ${candidate.url}: ${apiData.error.message}`;
              errors.push(errorMsg);

              lastError = new NetopiaPaymentError(
                NetopiaErrorCode.API_ERROR,
                errorMsg
              );

              // If it's a specific Netopia business logic error (like POS not approved), 
              // it means we hit the right server but have bad config. Stop trying other URLs.
              // 99: POS not approved
              if (String(apiData.error.code) === "99") {
                throw lastError;
              }

              continue;
            }

            if (!apiData?.payment?.paymentURL) {
              console.error("❌ [NETOPIA] API response missing paymentURL");
              console.error("   Response structure:", JSON.stringify(apiData, null, 2));

              const errorMsg = `Netopia API response missing payment URL at ${candidate.url}. Full response: ${JSON.stringify(apiData)}`;
              errors.push(errorMsg);

              lastError = new NetopiaPaymentError(
                NetopiaErrorCode.INVALID_RESPONSE,
                errorMsg
              );
              continue;
            }

            response = {
              code: 200,
              message: "You send your request successfully",
              data: apiData,
            };
            this.netopiaGatewayUrl = candidate.base;
            if (this.netopia?.axios?.defaults) {
              this.netopia.axios.defaults.baseURL = candidate.base;
            }
            console.log("✅ [NETOPIA] API call completed successfully");
            console.log(`   Payment URL: ${apiData.payment.paymentURL}`);
            break;
          } catch (attemptError: any) {
            console.error("❌ [NETOPIA] API attempt failed for:", candidate.url);
            console.error(`   Message: ${attemptError?.message || "Unknown error"}`);

            const errorMsg = `Failed to call Netopia API at ${candidate.url}: ${attemptError?.message || "Unknown error"}`;
            errors.push(errorMsg);

            if (attemptError instanceof NetopiaPaymentError) {
              lastError = attemptError;
              // If we explicitly threw a NetopiaPaymentError from within the try block (e.g. code 99),
              // it means we want to stop trying other candidates.
              if (attemptError.code === NetopiaErrorCode.PAYMENT_DECLINED || attemptError.code === NetopiaErrorCode.API_ERROR) {
                // Check if it's the specific POS error or Auth error we want to fail fast on
                if (attemptError.message.includes("POS is not approved") ||
                  attemptError.message.includes("Error 99") ||
                  attemptError.message.includes("HTTP 401") ||
                  attemptError.message.includes("HTTP 403")) {
                  break;
                }
              }
            } else {
              lastError = new NetopiaPaymentError(
                NetopiaErrorCode.NETWORK_ERROR,
                errorMsg
              );
            }
          }
        }

        if (!response) {
          throw new NetopiaPaymentError(
            NetopiaErrorCode.NETWORK_ERROR,
            `All Netopia API attempts failed:\n${errors.join("\n\n")}`
          );
        }
      } catch (error: any) {
        console.error("❌ [NETOPIA] API call failed:");
        console.error(`   Error Type: ${error?.constructor?.name || "Unknown"}`);
        console.error(`   Message: ${error?.message || "No message provided"}`);

        if (process.env.NODE_ENV === "development" && error?.stack) {
          console.error(`   Stack trace:`, error.stack);
        }

        if (error instanceof NetopiaPaymentError) {
          throw error;
        }

        if (error?.response) {
          console.error("   HTTP Status:", error.response.status);
          console.error("   Response Data:", JSON.stringify(error.response.data, null, 2));
        }

        throw new NetopiaPaymentError(
          NetopiaErrorCode.NETWORK_ERROR,
          `Failed to call Netopia API: ${error?.message || "Unknown error"}. Check logs for details.`
        );
      }

      // Log full response for debugging
      console.log("📥 [NETOPIA] Processing API response...");

      // Check if response is valid
      if (!response) {
        console.error("❌ [NETOPIA] No response received from createOrder");
        console.error("   This usually indicates a network issue or incorrect API credentials");
        throw new NetopiaPaymentError(
          NetopiaErrorCode.NETWORK_ERROR,
          "No response received from Netopia API. Check your internet connection and API credentials."
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
        console.error("❌ [NETOPIA] Missing payment URL in response");
        console.error("   Response structure:");
        console.error(`     - Top level keys: ${Object.keys(response).join(", ")}`);
        console.error(`     - Data keys: ${response.data ? Object.keys(response.data).join(", ") : "No data object"}`);

        if (process.env.NODE_ENV === "development") {
          console.error("   Full response:", JSON.stringify(response, null, 2));
        }

        console.error("");
        console.error("   Possible causes:");
        console.error("   1. Invalid API credentials (check NETOPIA_API_KEY and NETOPIA_SIGNATURE)");
        console.error("   2. Incorrect environment (check NETOPIA_SANDBOX setting)");
        console.error("   3. Account not properly configured in Netopia dashboard");
        console.error("   4. API request format doesn't match Netopia expectations");

        throw new NetopiaPaymentError(
          NetopiaErrorCode.PAYMENT_DECLINED,
          "Netopia did not return a payment URL. Check your API credentials, environment settings, and the console logs for details."
        );
      }

      if (!netopiaTransactionId) {
        console.warn("⚠️ [NETOPIA] Missing transaction ID in response");
        console.warn("   Using order ID as fallback");
      }

      console.log("✅ [NETOPIA] Payment created successfully");
      console.log(`   Payment URL: ${paymentUrl}`);
      console.log(`   Transaction ID: ${netopiaTransactionId || orderData.id}`);

      return {
        paymentUrl,
        invoiceId: netopiaTransactionId || orderData.id,
        transactionId: netopiaTransactionId || orderData.id,
        status: "pending",
      };
    } catch (error) {
      console.error("❌ [NETOPIA] Payment creation failed");

      if (error instanceof NetopiaPaymentError) {
        console.error(`   Error Code: ${error.code}`);
        console.error(`   Error Message: ${error.message}`);
        throw error;
      }

      console.error(`   Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`);

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
      // BYPASS for local testing or sandbox mode
      const isSandboxMode = process.env.NETOPIA_SANDBOX === "true";
      const isDevelopment = process.env.NODE_ENV === "development";

      if ((isDevelopment || isSandboxMode) && signature === "TEST_SIGNATURE") {
        console.warn(
          "⚠️ [NETOPIA] Bypassing signature verification for testing (sandbox/dev)"
        );
      } else if (!signature) {
        if (isSandboxMode) {
          // In sandbox mode, some webhooks may arrive without proper signatures
          console.warn(
            "⚠️ [NETOPIA] No signature in sandbox mode - proceeding with caution"
          );
        } else {
          throw new NetopiaPaymentError(
            NetopiaErrorCode.INVALID_SIGNATURE,
            "Missing webhook signature"
          );
        }
      } else {
        try {
          const verificationResult = await this.ipn.verify(signature, rawBody);
          // Netopia verify() returns payment status codes (e.g. 1=new, 3=paid, 5=confirmed),
          // not just 1. Treat as invalid only when verification failed or status is missing.
          const isVerificationValid =
            verificationResult.errorType === 0 &&
            verificationResult.status !== null &&
            verificationResult.status !== undefined;

          if (!isVerificationValid) {
            if (isSandboxMode) {
              console.warn(
                "⚠️ [NETOPIA] Signature verification failed in sandbox - proceeding with caution",
                verificationResult
              );
            } else {
              const verificationDetails = [
                `errorType=${verificationResult.errorType}`,
                `errorCode=${verificationResult.errorCode ?? "n/a"}`,
                `status=${verificationResult.status ?? "n/a"}`,
                `errorMessage=${verificationResult.errorMessage ?? "n/a"}`,
                `message=${verificationResult.message ?? "n/a"}`,
              ].join(", ");
              throw new NetopiaPaymentError(
                NetopiaErrorCode.INVALID_SIGNATURE,
                `Invalid webhook signature (${verificationDetails})`
              );
            }
          }
        } catch (verifyError) {
          if (isSandboxMode) {
            console.warn(
              "⚠️ [NETOPIA] Signature verification error in sandbox - proceeding with caution",
              verifyError
            );
          } else {
            throw new NetopiaPaymentError(
              NetopiaErrorCode.INVALID_SIGNATURE,
              `Invalid webhook signature (${verifyError instanceof Error ? verifyError.message : "unknown verification error"})`
            );
          }
        }
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

      // Note: Database updates are handled in the API route (app/api/payments/netopia/webhook/route.ts)
      // This method is responsible for signature verification and payload parsing only.
      console.log("✅ [NETOPIA] Webhook signature verified. Payload parsed successfully.", {
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
