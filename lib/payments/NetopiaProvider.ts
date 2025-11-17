import {
  IPaymentProvider,
  OrderData,
  PaymentResult,
  RefundResult,
  PaymentStatus,
} from "./IPaymentProvider";
import * as NetopiaModule from "netopia-payment2";
const { Netopia, Ipn } = NetopiaModule as any;

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
        details: orderData.customer.address?.street || "",
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

      const response = await this.netopia.createOrder(
        configData,
        paymentData,
        netopiaOrderData
      );

      if (response.code !== 200) {
        throw new NetopiaPaymentError(
          NetopiaErrorCode.PAYMENT_DECLINED,
          response.message || "Payment creation failed"
        );
      }

      const paymentUrl =
        response.data?.payment?.paymentURL ||
        response.data?.payment?.paymentUrl ||
        response.data?.paymentUrl;
      const netopiaTransactionId =
        response.data?.payment?.ntpID ||
        response.data?.payment?.ntpId ||
        this.netopia?.ntpID;

      if (!paymentUrl || !netopiaTransactionId) {
        throw new NetopiaPaymentError(
          NetopiaErrorCode.PAYMENT_DECLINED,
          "Netopia did not return a payment URL or transaction ID"
        );
      }

      return {
        paymentUrl,
        invoiceId: netopiaTransactionId,
        transactionId: netopiaTransactionId,
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
