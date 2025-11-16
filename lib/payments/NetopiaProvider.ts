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
      // Convert USD to RON if needed (assuming 1 USD = 4.7 RON for now)
      const exchangeRate = 4.7;
      const amountInRON =
        orderData.currency === "USD"
          ? Math.round(orderData.amount * exchangeRate * 100) / 100
          : orderData.amount;

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

      // Prepare order data
      const netopiaOrderData = {
        ntpID: `ntp_${orderData.id}_${Date.now()}`,
        posSignature: process.env.NETOPIA_SIGNATURE!,
        dateTime: new Date().toISOString(),
        orderID: orderData.id,
        description: `Order ${orderData.id}`,
        amount: amountInRON,
        currency: "RON",
        billing: billingData,
        shipping: shippingData,
        products: [], // We'll populate this if we have product data
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
        instrument: {
          type: "card",
          account: "",
          expMonth: 0,
          expYear: 0,
          secretCode: "",
          token: "",
          clientID: "",
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

      return {
        paymentUrl: response.data?.paymentUrl || "",
        invoiceId: netopiaOrderData.ntpID,
        transactionId: netopiaOrderData.ntpID,
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

  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify the webhook signature
      const verificationResult = await this.ipn.verify(
        signature,
        JSON.stringify(payload)
      );

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
      const { ntpID, orderID, status, amount, currency } = payload;

      // Here you would update your database based on the payment status
      // This is a placeholder - you'll need to integrate with your database layer
      console.log("Processing Netopia webhook:", {
        ntpID,
        orderID,
        status,
        amount,
        currency,
      });

      // Status codes from Netopia:
      // 1 = Success, 2 = Failed, 3 = Cancelled, etc.
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

      // Map Netopia status codes to our enum
      if (statusData) {
        const netopiaStatus = parseInt(statusData.status || "0");
        switch (netopiaStatus) {
          case 1:
            status = "paid";
            break;
          case 2:
            status = "failed";
            break;
          case 3:
            status = "cancelled";
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
