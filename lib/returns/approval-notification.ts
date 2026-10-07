import {
  sendBulkReturnApprovedEmail,
  sendReturnApprovedEmail,
} from "@/lib/email/return-templates";
import { generateReturnLabel } from "@/lib/return-label";
import {
  getReturnDestination,
  type DestinationReturnRecord,
  type ReturnDestination,
} from "@/lib/returns/return-destination";

export interface ApprovalReturn extends DestinationReturnRecord {
  id: string;
  reason: string;
  order: { id: string; orderNumber: string; createdAt: Date | string };
  orderItem: NonNullable<DestinationReturnRecord["orderItem"]> & {
    name: string;
    quantity: number;
    productId?: string | null;
    product?:
      | (NonNullable<
          NonNullable<DestinationReturnRecord["orderItem"]>["product"]
        > & { sku?: string | null })
      | null;
  };
  user: {
    name?: string | null;
    email: string;
    addresses: Array<{
      addressLine1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>;
  };
}

const orderDate = (record: ApprovalReturn) =>
  new Date(record.order.createdAt).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const filename = (record: ApprovalReturn, index = 1) => {
  const product =
    record.orderItem.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .slice(0, 45)
      .replace(/_+$/, "") || "Articol";
  return `TechTots_Retur_${String(index).padStart(2, "0")}_${product}_${record.id.slice(-8)}.pdf`;
};

async function label(record: ApprovalReturn, destination: ReturnDestination) {
  if (record.orderItem.isDigital) return undefined;
  const address = record.user.addresses[0];
  const buffer = await generateReturnLabel({
    orderId: record.order.id,
    orderNumber: record.order.orderNumber,
    returnId: record.id,
    productName: record.orderItem.name,
    productId: record.orderItem.productId || "",
    productSku: record.orderItem.product?.sku || "",
    reason: record.reason,
    customerName: record.user.name || record.user.email,
    customerEmail: record.user.email,
    customerAddress: address
      ? [
          address.addressLine1,
          address.city,
          address.state,
          address.postalCode,
          address.country,
        ].join(", ")
      : undefined,
    language: "ro",
    destination,
  });
  return buffer.toString("base64");
}

export async function sendReturnApprovalNotification(record: ApprovalReturn) {
  const destination = getReturnDestination(record);
  return sendReturnApprovedEmail({
    to: record.user.email,
    customerName: record.user.name || "Client",
    orderNumber: record.order.orderNumber,
    orderDate: orderDate(record),
    productName: record.orderItem.name,
    quantity: record.orderItem.quantity,
    reason: record.reason,
    isDigital: record.orderItem.isDigital === true,
    destination,
    pdfFilename: filename(record),
    pdfBase64: await label(record, destination),
  });
}

export async function sendBulkReturnApprovalNotification(
  records: ApprovalReturn[]
) {
  const first = records[0];
  const now = new Date();
  const snapshots = records.map((record, index) => ({
    record,
    destination: getReturnDestination(record, now),
    pdfFilename: filename(record, index + 1),
  }));
  const attachments = [];
  // Each item gets its own destination/RMA document. Never mix supplier parcels.
  for (const { record, destination, pdfFilename } of snapshots) {
    const content = await label(record, destination);
    if (content)
      attachments.push({
        filename: pdfFilename,
        content,
        contentType: "application/pdf",
      });
  }
  return sendBulkReturnApprovedEmail({
    to: first.user.email,
    customerName: first.user.name || "Client",
    orderNumber: first.order.orderNumber,
    orderDate: orderDate(first),
    items: snapshots.map(({ record, destination, pdfFilename }) => ({
      productName: record.orderItem.name,
      quantity: record.orderItem.quantity,
      reason: record.reason,
      isDigital: record.orderItem.isDigital === true,
      destination,
      pdfFilename: record.orderItem.isDigital ? undefined : pdfFilename,
    })),
    pdfAttachments: attachments,
  });
}
