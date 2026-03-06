import { appConfig, getAppConfig } from "@/lib/config/app-config";
import { db } from "@/lib/db";
import { sendOrderDeliveredEmail } from "@/lib/email/order-templates";
import { sendEmailViaUnifiedSystem } from "@/lib/nodemailer";
import { getNotificationSettings } from "@/lib/utils/order-processing";

function formatShippingAddress(address: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
} | null): string {
  if (!address) return "";

  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function notifyDeliveredOrder(params: {
  orderId: string;
  source: "courier-sync" | "manual-admin" | "unknown";
  carrier?: string | null;
  trackingNumber?: string | null;
  deliveredAt?: Date | null;
}) {
  const [order, notificationSettings, config] = await Promise.all([
    db.order.findUnique({
      where: { id: params.orderId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                images: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    }),
    getNotificationSettings(),
    getAppConfig(),
  ]);

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  const deliveredAt = params.deliveredAt || order.deliveredAt || new Date();
  const deliveredAtLabel = new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(deliveredAt);

  if (notificationSettings?.deliveryConfirmation && order.user?.email) {
    await sendOrderDeliveredEmail({
      to: order.user.email,
      customerName: order.user.name || "Customer",
      orderId: order.orderNumber,
      orderItems: order.items.map(item => ({
        id: item.id,
        productId: item.productId ?? "",
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product?.images?.[0] || undefined,
      })),
      totalAmount: order.total,
      shippingAddress: formatShippingAddress(order.shippingAddress),
      deliveredAt: deliveredAtLabel,
    });
  }

  const recipients = Array.from(
    new Set(
      [config.alertEmail, appConfig.adminEmail]
        .filter((value): value is string => Boolean(value?.trim()))
        .map(value => value.trim())
    )
  );

  if (recipients.length > 0) {
    const customerName =
      order.user?.name || order.shippingAddress?.fullName || "Guest";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
        <h2 style="margin-bottom: 16px;">Comandă livrată automat</h2>
        <p style="margin-bottom: 16px;">
          Comanda <strong>#${order.orderNumber}</strong> a fost marcată automat ca livrată din sincronizarea cu curierul.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tbody>
            <tr><td style="padding: 8px 0; font-weight: 600;">Client</td><td style="padding: 8px 0;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td style="padding: 8px 0;">${order.user?.email || "-"}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Total</td><td style="padding: 8px 0;">${order.total.toFixed(2)} RON</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Curier</td><td style="padding: 8px 0;">${params.carrier || order.carrier || "-"}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">AWB</td><td style="padding: 8px 0;">${params.trackingNumber || order.trackingNumber || "-"}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Livrat la</td><td style="padding: 8px 0;">${deliveredAtLabel}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Sursă</td><td style="padding: 8px 0;">${params.source}</td></tr>
          </tbody>
        </table>
        <p style="margin-bottom: 0;">
          Deschide comanda în admin: <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/orders/${order.id}">#${order.orderNumber}</a>
        </p>
      </div>
    `;

    const text = [
      `Comanda #${order.orderNumber} a fost marcată automat ca livrată.`,
      `Client: ${customerName}`,
      `Email: ${order.user?.email || "-"}`,
      `Total: ${order.total.toFixed(2)} RON`,
      `Curier: ${params.carrier || order.carrier || "-"}`,
      `AWB: ${params.trackingNumber || order.trackingNumber || "-"}`,
      `Livrat la: ${deliveredAtLabel}`,
      `Sursă: ${params.source}`,
    ].join("\n");

    await sendEmailViaUnifiedSystem({
      to: recipients,
      subject: `Comandă livrată: #${order.orderNumber}`,
      html,
      text,
    });
  }

  return { success: true };
}
