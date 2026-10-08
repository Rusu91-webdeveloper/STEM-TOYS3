import assert from "node:assert/strict";
import { hash } from "bcrypt";
import type { PrismaClient, OrderStatus, PaymentStatus } from "@prisma/client";

export async function seedAdminDashboardFixture(db: PrismaClient) {
  assert.equal(
    await db.order.count(),
    0,
    "Start with an empty isolated fixture database; existing records are preserved."
  );
  const password = await hash("DashboardLocal2026!", 10);
  await db.user.upsert({
    where: { id: "dashboard-admin" },
    update: {},
    create: {
      id: "dashboard-admin",
      email: "admin@dashboard.local",
      name: "Administrator de test",
      password,
      role: "ADMIN",
      isActive: true,
    },
  });
  const guest = await db.user.upsert({
    where: { id: "dashboard-guest" },
    update: {},
    create: {
      id: "dashboard-guest",
      email: "guest@dashboard.local",
      name: "Client fără cont de test",
      password,
      tags: ["guest-checkout"],
      isActive: false,
    },
  });
  const customer = await db.user.upsert({
    where: { id: "dashboard-customer" },
    update: {},
    create: {
      id: "dashboard-customer",
      email: "customer@dashboard.local",
      name: "Client de test",
      password,
      isActive: true,
    },
  });
  const address = await db.address.upsert({
    where: { id: "dashboard-address" },
    update: {},
    create: {
      id: "dashboard-address",
      userId: guest.id,
      name: "Adresă de test",
      fullName: "Client de test",
      addressLine1: "Adresă fictivă",
      city: "Cluj-Napoca",
      state: "Cluj",
      postalCode: "400000",
      country: "RO",
      phone: "0000000000",
    },
  });
  const supplier = await db.supplier.upsert({
    where: { id: "dashboard-supplier" },
    update: {},
    create: {
      id: "dashboard-supplier",
      name: "Furnizor de test",
      email: "supplier@dashboard.local",
      phone: "0000000000",
    },
  });
  const now = new Date();
  const older = new Date(now.getTime() - 45 * 86400000);
  const top = await db.product.create({
    data: {
      id: "dashboard-robot",
      name: "Kit robotic educativ",
      slug: "dashboard-robot",
      price: 120,
      costPrice: 60,
      stockQuantity: 7,
      reservedQuantity: 7,
      images: [],
      tags: [],
      supplierId: supplier.id,
      status: "PUBLISHED",
      createdAt: older,
    },
  });
  const puzzle = await db.product.create({
    data: {
      id: "dashboard-puzzle",
      name: "Puzzle de logică",
      slug: "dashboard-puzzle",
      price: 100,
      stockQuantity: 20,
      images: [],
      tags: [],
      supplierId: supplier.id,
      status: "PUBLISHED",
    },
  });
  const unsold = await db.product.create({
    data: {
      id: "dashboard-unsold",
      name: "Produs nou fără vânzări",
      slug: "dashboard-unsold",
      price: 50,
      stockQuantity: 30,
      images: [],
      tags: [],
      status: "PUBLISHED",
    },
  });
  async function order(
    number: string,
    total: number,
    options: {
      paymentStatus?: PaymentStatus;
      status?: OrderStatus;
      currency?: string;
      userId?: string;
      createdAt?: Date;
      productId?: string;
      quantity?: number;
      price?: number;
      digital?: boolean;
    } = {}
  ) {
    return db.order.create({
      data: {
        orderNumber: number,
        userId: options.userId ?? guest.id,
        shippingAddressId: address.id,
        total,
        subtotal: total - 20,
        tax: 0,
        shippingCost: 20,
        status: options.status ?? "PROCESSING",
        paymentStatus: options.paymentStatus ?? "PAID",
        paymentMethod: "card",
        currency: options.currency ?? "RON",
        createdAt: options.createdAt ?? now,
        items: {
          create: {
            name: options.digital ? "Carte digitală de test" : "Produs de test",
            productId: options.digital ? null : (options.productId ?? top.id),
            quantity: options.quantity ?? 1,
            price: options.price ?? total - 20,
            isDigital: options.digital ?? false,
          },
        },
      },
      include: { items: true },
    });
  }
  const paid = await order("DEMO-1001", 260, { quantity: 2, price: 120 });
  await order("DEMO-1002", 120, {
    status: "DELIVERED",
    paymentStatus: "COMPLETED",
    userId: customer.id,
    productId: puzzle.id,
  });
  await order("DEMO-1003", 500, {
    status: "SHIPPED",
    paymentStatus: "PENDING",
    productId: unsold.id,
    quantity: 10,
  });
  await order("DEMO-1004", 999, { status: "CANCELLED", quantity: 99 });
  await order("DEMO-1005", 444, {
    status: "COMPLETED",
    paymentStatus: "REFUNDED",
    quantity: 44,
  });
  await order("DEMO-1006", 888, { currency: "EUR", quantity: 88 });
  await order("DEMO-1007", 40, { digital: true, price: 40 });
  await order("DEMO-0999", 30, { createdAt: older });
  await db.return.create({
    data: {
      userId: guest.id,
      orderId: paid.id,
      orderItemId: paid.items[0].id,
      reason: "CHANGED_MIND",
    },
  });
  await db.supplierOrder.create({
    data: {
      orderId: paid.id,
      orderItemId: paid.items[0].id,
      supplierId: supplier.id,
      productId: top.id,
      quantity: 2,
      unitCost: 60,
      totalCost: 120,
      status: "READY_TO_PLACE",
    },
  });
}
