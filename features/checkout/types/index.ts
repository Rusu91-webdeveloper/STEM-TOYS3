export type CheckoutStep =
  | "loading"
  | "shipping-address"
  | "shipping-method"
  | "payment"
  | "review";

export interface ShippingAddress {
  companyName?: string;
  cui?: string;
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

export type PaymentMethod =
  | "netopia_card"
  | "netopia_sms"
  | "netopia_wallet"
  | "stripe_new"
  | "cash_on_delivery"
  | string;

export interface PaymentDetails {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv?: string;
  savedCardId?: string;
  cardType?: string;
  stripePaymentIntentId?: string;
}

export interface GuestInformation {
  email: string;
  createAccount?: boolean;
  password?: string;
  marketingOptIn?: boolean;
}

export interface CheckoutData {
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  billingAddressSameAsShipping?: boolean;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
  couponCode?: string;
  discountAmount?: number;
  appliedCoupon?: {
    code: string;
    type: string;
    value: number;
  } | null;
  stripePaymentIntentId?: string;
}
