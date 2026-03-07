import { db } from "@/lib/db";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";
import { prepareNetopiaAmount } from "@/lib/utils/currency-converter";

type CustomerFallback = {
  name?: string;
  email?: string;
  phone?: string;
};

type InitiateNetopiaOrderPaymentInput = {
  orderId: string;
  paymentMethod?: string | null;
  customerFallback?: CustomerFallback;
  expectedUserId?: string;
  source?: "checkout" | "account";
};

export async function initiateNetopiaOrderPayment(
  input: InitiateNetopiaOrderPaymentInput
) {
  const orderRecord = await db.order.findUnique({
    where: { id: input.orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              sku: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      shippingAddress: true,
    },
  });

  if (!orderRecord) {
    throw new Error("Order not found");
  }

  if (input.expectedUserId && orderRecord.userId !== input.expectedUserId) {
    throw new Error("You are not allowed to pay for this order");
  }

  const customerName =
    input.customerFallback?.name ||
    orderRecord.shippingAddress?.fullName ||
    orderRecord.user?.name ||
    "Client";
  const customerEmail =
    input.customerFallback?.email || orderRecord.user?.email || "";
  const customerPhone =
    input.customerFallback?.phone || orderRecord.shippingAddress?.phone || "";

  if (!customerEmail) {
    throw new Error("Order is missing a customer email address");
  }

  const preparedAmount = prepareNetopiaAmount(
    Number(orderRecord.total),
    orderRecord.currency || "RON"
  );

  const products = orderRecord.items.map(item => ({
    name: item.name,
    code: item.product?.sku || item.productId || item.id,
    category: item.product?.category?.name || "Order Item",
    price: item.price,
    vat:
      orderRecord.subtotal && orderRecord.subtotal > 0
        ? Math.round(
            ((orderRecord.tax / orderRecord.subtotal) * 100 + Number.EPSILON) *
              100
          ) / 100
        : 0,
    quantity: item.quantity,
  }));

  const provider = new NetopiaProvider();
  const paymentResult = await provider.createPayment({
    id: orderRecord.id,
    amount: preparedAmount.amountInRON,
    currency: "RON",
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: {
        street:
          orderRecord.shippingAddress?.addressLine1 ||
          orderRecord.shippingAddress?.addressLine2 ||
          "",
        city: orderRecord.shippingAddress?.city || "",
        country: orderRecord.shippingAddress?.country || "RO",
        postalCode: orderRecord.shippingAddress?.postalCode || "",
      },
    },
    metadata: {
      orderId: orderRecord.id,
      createdAt: new Date().toISOString(),
      retryFromAccount: input.source === "account" ? "true" : "false",
    },
    products,
  });

  if (!paymentResult.paymentUrl || !paymentResult.transactionId) {
    throw new Error("Netopia did not return a payment URL");
  }

  await db.order.update({
    where: { id: orderRecord.id },
    data: {
      netopiaTransactionId: paymentResult.transactionId,
      netopiaInvoiceId: paymentResult.invoiceId,
      netopiaPaymentUrl: paymentResult.paymentUrl,
      paymentMethod:
        input.paymentMethod || orderRecord.paymentMethod || "netopia_card",
      paymentStatus: "PENDING",
      status: "PENDING_REVIEW",
    },
  });

  return {
    order: orderRecord,
    paymentResult,
  };
}
