export type CheckoutStep =
  | "loading"
  | "guest-info"
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

export interface GuestInformation {
  email: string;
  createAccount?: boolean;
  password?: string;
  marketingOptIn?: boolean;
}

export interface CheckoutData {
  shippingAddress?: ShippingAddress;
  shippingMethod?: ShippingMethod;
  paymentDetails?: PaymentDetails;
  billingAddressSameAsShipping?: boolean;
  billingAddress?: ShippingAddress;
  guestInformation?: GuestInformation;
  isGuestCheckout?: boolean;
}
