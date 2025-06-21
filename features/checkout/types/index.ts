export type CheckoutStep =
  | "shipping-address"
  | "shipping-method"
  | "payment"
  | "review";

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDelivery: string;
}

export interface PaymentDetails {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv?: string;
  savedCardId?: string;
  cardType?: string;
}

export interface CheckoutData {
  shippingAddress?: ShippingAddress;
  shippingMethod?: ShippingMethod;
  paymentDetails?: PaymentDetails;
  billingAddressSameAsShipping?: boolean;
  billingAddress?: ShippingAddress;
}
