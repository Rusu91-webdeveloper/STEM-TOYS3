import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { request, type APIRequestContext } from "@playwright/test";
import { hash } from "bcryptjs";

import { createWithdrawalReceipt } from "../lib/returns/withdrawal";
import {
  loginFixture,
  fixtureCsrf as token,
} from "@/scripts/lib/local-acceptance-auth";

import { verifyDigitalReturnUI } from "@/scripts/lib/local-return-ui-acceptance";

// Synthetic acceptance only: never point this at a live store or database.
const url = new URL(process.env.DATABASE_URL ?? "http://missing");
assert.equal(url.hostname, "localhost");
assert.equal(url.port, "55432");
assert.equal(url.pathname, "/stemtoys_dev");
const baseURL = "http://localhost:3014";
const db = new PrismaClient();
const key = `acceptance-${randomUUID()}`;
const password = randomUUID();
const output = `${process.cwd()}/test-results/operations-2026-10-07`;

async function login(api: APIRequestContext, email: string, role: string) {
  await loginFixture(api, { email, role, password, baseURL });
}
async function fixture(userId: string, digital = false) {
  const address = await db.address.create({
    data: {
      userId,
      name: "Fixture",
      fullName: "Synthetic Customer",
      addressLine1: "Test street",
      city: "Test",
      state: "Test",
      postalCode: "000000",
      country: "RO",
      phone: "TEST",
    },
  });
  return db.order.create({
    data: {
      userId,
      orderNumber: `${key}-${randomUUID()}`,
      subtotal: 100,
      total: 120,
      tax: 0,
      shippingCost: 20,
      paymentMethod: "cash_on_delivery",
      paymentStatus: "PAID",
      status: digital ? "PROCESSING" : "DELIVERED",
      shippingAddressId: address.id,
      createdAt: new Date("2026-08-01T12:00:00Z"),
      deliveredAt: digital ? null : new Date(),
      items: {
        create: [
          {
            name: digital ? "Synthetic Digital Book" : "Synthetic STEM kit",
            quantity: 1,
            price: 80,
            isDigital: digital,
          },
          ...(!digital
            ? [{ name: "Synthetic second item", quantity: 1, price: 20 }]
            : []),
        ],
      },
    },
    include: { items: true },
  });
}
async function main() {
  const hashed = await hash(password, 10);
  const admin = await db.user.create({
    data: {
      email: `${key}-admin@example.invalid`,
      password: hashed,
      name: "Synthetic Admin",
      role: "ADMIN",
      isActive: true,
    },
  });
  const customer = await db.user.create({
    data: {
      email: `${key}-customer@example.invalid`,
      password: hashed,
      name: "Synthetic Customer",
      role: "CUSTOMER",
      isActive: true,
    },
  });
  const anonymous = await request.newContext({ baseURL });
  const adminApi = await request.newContext({ baseURL });
  const customerApi = await request.newContext({ baseURL });
  try {
    assert.equal((await anonymous.get("/api/admin/withdrawals")).status(), 403);
    await login(adminApi, admin.email, "ADMIN");
    await login(customerApi, customer.email, "CUSTOMER");
    assert.equal(
      (await customerApi.get("/api/admin/withdrawals")).status(),
      403
    );
    const receipt = createWithdrawalReceipt({
      submissionId: randomUUID(),
      name: "Synthetic Customer",
      email: customer.email,
      contract: key,
      confirmed: true,
    });
    await db.emailLog.create({
      data: {
        id: receipt.reference,
        to: receipt.email,
        subject: "Synthetic acceptance",
        status: "failed",
        metadata: receipt,
      },
    });
    assert.equal(
      (
        await adminApi.post("/api/admin/withdrawals", {
          data: { reference: receipt.reference, action: "reviewed" },
        })
      ).status(),
      403
    );
    assert.equal(
      (
        await adminApi.post("/api/admin/withdrawals", {
          headers: await token(adminApi),
          data: { reference: receipt.reference, action: "reviewed" },
        })
      ).status(),
      200
    );
    const reviewed = await db.emailLog.findUniqueOrThrow({
      where: { id: receipt.reference },
    });
    assert.ok((reviewed.metadata as { reviewedAt?: string }).reviewedAt);
    const retried = await adminApi.post("/api/admin/withdrawals", {
      headers: await token(adminApi),
      data: { reference: receipt.reference, action: "retry_email" },
    });
    assert.equal(retried.status(), 202);
    const retryBody = await retried.json();
    assert.equal(retryBody.deliveryComplete, false);
    // No real mail credentials are configured. Development output must not be
    // accepted as inbox delivery; both flags remain false and the outbox retries.
    assert.equal(retryBody.receipt.customerNotified, false);
    assert.equal(retryBody.receipt.merchantNotified, false);
    assert.equal(
      (
        await db.emailLog.findUniqueOrThrow({
          where: { id: receipt.reference },
        })
      ).status,
      "failed"
    );

    const order = await fixture(customer.id);
    const returns = await Promise.all(
      order.items.map(item =>
        db.return.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            userId: customer.id,
            reason: "CHANGED_MIND",
            status: "RECEIVED",
          },
        })
      )
    );
    const repay = async (index: number, amountRon: number) =>
      adminApi.patch(`/api/returns/${returns[index].id}/status`, {
        headers: await token(adminApi),
        data: {
          status: "REFUNDED",
          manualRefundProof: {
            review: {
              amountRon,
              notes: "Synthetic completed repayment with no consumer fees",
              confirmed: true,
            },
            reference: `${key}-bank-${index}`,
            paidAt: new Date().toISOString(),
            agreedMethodAndNoFees: true,
          },
        },
      });
    assert.equal((await repay(0, 100)).status(), 200);
    assert.equal(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } }))
        .paymentStatus,
      "PAID"
    );
    assert.equal((await repay(1, 20)).status(), 200);
    assert.equal(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } }))
        .paymentStatus,
      "REFUNDED"
    );
    assert.ok(
      (
        await db.return.findUniqueOrThrow({ where: { id: returns[0].id } })
      ).resolutionNotes?.includes(`${key}-bank-0`)
    );

    const digital = await fixture(customer.id, true);
    assert.equal(
      (await customerApi.get(`/api/account/orders/${digital.id}`)).status(),
      200
    );
    await verifyDigitalReturnUI({
      api: customerApi,
      baseURL,
      orderId: digital.id,
      output,
    });
    const admitted = await customerApi.post("/api/returns/create-bulk", {
      headers: await token(customerApi),
      data: {
        orderItemIds: [digital.items[0].id],
        reason: "DAMAGED_OR_DEFECTIVE",
        details: "Synthetic digital conformity complaint",
        photos: [],
      },
    });
    assert.equal(admitted.status(), 200);
    const deleted = await customerApi.delete("/api/gdpr/delete", {
      headers: await token(customerApi),
      data: { confirmDeletion: true },
    });
    assert.equal(deleted.status(), 202);
    const queue = await (
      await adminApi.get("/api/admin/privacy/requests")
    ).json();
    const queued = queue.requests.find(
      (record: { user: { email: string } }) =>
        record.user.email === customer.email
    );
    assert.ok(queued.responseDueAt);
    assert.equal(queued.overdue, false);
    console.log(
      "PASS: real credentials/ADMIN/CSRF review and retry, durable outbox failure state, cumulative manual repayments, paid digital complaint, desktop/mobile return form and privacy review deadline. No real email or payment sent."
    );
  } finally {
    await Promise.all([
      anonymous.dispose(),
      adminApi.dispose(),
      customerApi.dispose(),
    ]);
    await db.$disconnect();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
