type CustomerOrderDisplayInput = {
  status?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
};

const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

export function isNetopiaPaymentMethod(paymentMethod?: string | null) {
  return normalize(paymentMethod).includes("netopia");
}

export function isStripePaymentMethod(paymentMethod?: string | null) {
  return normalize(paymentMethod).includes("stripe");
}

export function isOnlineCardPaymentMethod(paymentMethod?: string | null) {
  return (
    isNetopiaPaymentMethod(paymentMethod) ||
    isStripePaymentMethod(paymentMethod)
  );
}

export function isAwaitingPaymentOrder(input: CustomerOrderDisplayInput) {
  const paymentStatus = normalize(input.paymentStatus);
  const status = normalize(input.status);

  if (paymentStatus !== "pending") {
    return false;
  }

  if (status === "cancelled" || status === "delivered") {
    return false;
  }

  return isOnlineCardPaymentMethod(input.paymentMethod);
}

export function canRetryCustomerOrderPayment(input: CustomerOrderDisplayInput) {
  return isAwaitingPaymentOrder(input) && isNetopiaPaymentMethod(input.paymentMethod);
}

export function getCustomerOrderStatusKey(input: CustomerOrderDisplayInput) {
  if (isAwaitingPaymentOrder(input)) {
    return "awaiting_payment";
  }

  return normalize(input.status) || "processing";
}
