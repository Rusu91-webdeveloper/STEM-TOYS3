export interface OrderAnalytics {
  transaction_id: string;
  currency: "RON";
  value: number;
  tax: number;
  shipping: number;
  order_total: number;
  payment_method: "cod" | "netopia" | "stripe";
  payment_status: string;
  test_mode: boolean;
  items: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}

/** Only call with persisted order items and server-resolved pricing. No customer data. */
export function buildOrderAnalytics(input: {
  id: string;
  total: number;
  tax: number;
  shipping: number;
  codFee: number;
  paymentMethod: OrderAnalytics["payment_method"];
  paymentStatus: string;
  testMode?: boolean;
  items: Array<{
    productId: string | null;
    bookId: string | null;
    name: string;
    price: number;
    quantity: number;
  }>;
}): OrderAnalytics | undefined {
  const grossItems = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const value =
    Math.round(
      (input.total - input.tax - input.shipping - input.codFee) * 100
    ) / 100;
  if (
    !input.id ||
    !input.items.length ||
    !Number.isFinite(value) ||
    value < 0 ||
    !Number.isFinite(grossItems) ||
    grossItems <= 0
  )
    return undefined;
  return {
    transaction_id: input.id,
    currency: "RON",
    value,
    tax: input.tax,
    shipping: input.shipping,
    order_total: input.total,
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    test_mode: input.testMode === true,
    // Allocate order discounts/VAT across line prices; shipping and COD fees are not merchandise revenue.
    items: input.items.map(item => ({
      item_id: item.productId ?? item.bookId ?? "",
      item_name: item.name,
      price: Number(((item.price * value) / grossItems).toFixed(6)),
      quantity: item.quantity,
    })),
  };
}
