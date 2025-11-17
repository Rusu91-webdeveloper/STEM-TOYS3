import { Order, PaymentMethod } from "@prisma/client";

export interface OrderData {
  id: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      country: string;
      postalCode: string;
    };
  };
  metadata?: Record<string, any>;
  products?: Array<{
    name: string;
    code?: string;
    category?: string;
    price: number;
    vat?: number;
    quantity?: number;
  }>;
}

export interface PaymentResult {
  paymentUrl?: string;
  invoiceId?: string;
  transactionId?: string;
  clientSecret?: string;
  status: "pending" | "success" | "failed";
}

export interface RefundResult {
  refundId: string;
  amount: number;
  status: "pending" | "success" | "failed";
  transactionId: string;
}

export interface PaymentStatus {
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  transactionId?: string;
  amount: number;
  currency: string;
}

export interface IPaymentProvider {
  createPayment(orderData: OrderData): Promise<PaymentResult>;
  handleWebhook(payload: any, signature: string): Promise<void>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
}
