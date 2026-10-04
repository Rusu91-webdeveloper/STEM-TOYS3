import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";

import { eraseCustomerAccount } from "../lib/privacy/account-erasure";
import { runRetentionCleanup } from "../lib/privacy/retention";

// This is deliberately restricted to the disposable local privacy-test database.
const url = new URL(process.env.DATABASE_URL || "http://missing");
assert.equal(url.hostname, "localhost");
assert.equal(url.port, "55432");
assert.equal(url.pathname, "/stemtoys_dev");
const db = new PrismaClient();
const key = `privacy-test-${randomUUID()}`;
async function fixture(
  status: "COMPLETED" | "PROCESSING",
  role: "CUSTOMER" | "ADMIN" = "CUSTOMER"
) {
  const user = await db.user.create({
    data: {
      email: `${randomUUID()}@example.invalid`,
      password: "test-only",
      role,
      name: "Disposable test",
      isActive: true,
      cnp: "TEST-NOT-A-PERSON",
      preferences: { fixture: true },
    },
  });
  const address = {
    userId: user.id,
    name: "Test",
    fullName: "Disposable test",
    addressLine1: "Fixture street",
    city: "Test",
    state: "Test",
    postalCode: "000000",
    country: "RO",
    phone: "TEST",
  };
  const used = await db.address.create({ data: address });
  const unused = await db.address.create({ data: address });
  const order = await db.order.create({
    data: {
      userId: user.id,
      orderNumber: `${key}-${randomUUID()}`,
      subtotal: 100,
      total: 119.99,
      tax: 0,
      shippingCost: 19.99,
      paymentMethod: "cash_on_delivery",
      paymentStatus: "PAID",
      status,
      shippingAddressId: used.id,
    },
  });
  const invoice = await db.orderInvoice.create({
    data: {
      orderId: order.id,
      totalAmount: 119.99,
      payload: { fixture: "transaction-evidence" },
    },
  });
  await db.paymentCard.create({
    data: {
      userId: user.id,
      cardholderName: "TEST",
      lastFourDigits: "0000",
      encryptedCardData: "SYNTHETIC-CIPHERTEXT",
      encryptedCvv: "SYNTHETIC-CVV",
      expiryMonth: "01",
      expiryYear: "30",
      cardType: "test",
    },
  });
  await db.consentLog.create({
    data: {
      userId: user.id,
      action: "GRANTED",
      consentType: "test",
      consentGiven: true,
      ipAddress: "127.0.0.1",
      userAgent: "test",
    },
  });
  return { user, used, unused, order, invoice };
}
async function main() {
  const closed = await fixture("COMPLETED");
  const result = await eraseCustomerAccount(db, closed.user.id);
  assert.equal(result.status, "completed");
  const erased = await db.user.findUniqueOrThrow({
    where: { id: closed.user.id },
  });
  assert.equal(erased.isActive, false);
  assert.equal(erased.anonymized, true);
  assert.equal(erased.name, null);
  assert.equal(erased.cnp, null);
  assert.equal(erased.preferences, null);
  assert.notEqual(erased.email, closed.user.email);
  assert.equal(
    await db.paymentCard.count({ where: { userId: closed.user.id } }),
    0
  );
  assert.equal(await db.address.count({ where: { id: closed.unused.id } }), 0);
  assert.equal(await db.address.count({ where: { id: closed.used.id } }), 1);
  assert.equal(await db.order.count({ where: { id: closed.order.id } }), 1);
  assert.equal(
    await db.orderInvoice.count({ where: { id: closed.invoice.id } }),
    1
  );
  assert.equal(
    (await eraseCustomerAccount(db, closed.user.id)).status,
    "completed"
  );
  assert.equal(
    await db.consentLog.count({
      where: { userId: closed.user.id, consentType: "account_deletion" },
    }),
    1
  );
  const open = await fixture("PROCESSING");
  assert.equal(
    (await eraseCustomerAccount(db, open.user.id)).status,
    "pending_review"
  );
  assert.equal(
    (await eraseCustomerAccount(db, open.user.id)).status,
    "pending_review"
  );
  assert.equal(
    await db.consentLog.count({
      where: { userId: open.user.id, consentType: "account_deletion_request" },
    }),
    1
  );
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: open.user.id } })).isActive,
    true
  );
  assert.equal(
    await db.paymentCard.count({ where: { userId: open.user.id } }),
    1
  );
  await db.order.update({
    where: { id: open.order.id },
    data: { status: "COMPLETED" },
  });
  assert.equal(
    (await eraseCustomerAccount(db, open.user.id)).status,
    "completed"
  );
  assert.equal(
    await db.consentLog.count({
      where: {
        userId: open.user.id,
        consentType: "account_deletion_request",
        consentDetails: { path: ["status"], equals: "pending_review" },
      },
    }),
    0
  );
  const staff = await fixture("COMPLETED", "ADMIN");
  assert.equal(
    (await eraseCustomerAccount(db, staff.user.id)).status,
    "staff_review"
  );
  assert.equal(
    await db.paymentCard.count({ where: { userId: staff.user.id } }),
    1
  );
  const legacy = await fixture("COMPLETED");
  await db.user.update({
    where: { id: legacy.user.id },
    data: { anonymized: true },
  });
  assert.equal(
    (await eraseCustomerAccount(db, legacy.user.id)).status,
    "completed"
  );
  assert.equal(
    await db.paymentCard.count({ where: { userId: legacy.user.id } }),
    0
  );
  // Transaction rollback: reject the final user update after preceding deletions.
  const rollback = await fixture("COMPLETED");
  const transaction = db.$transaction.bind(db);
  const failingDb = {
    $transaction: (callback: any, options: any) =>
      transaction(async tx => {
        const original = tx.user.update;
        tx.user.update = async () => {
          throw new Error("Synthetic failure");
        };
        try {
          return await callback(tx);
        } finally {
          tx.user.update = original;
        }
      }, options),
  } as unknown as PrismaClient;
  await assert.rejects(() => eraseCustomerAccount(failingDb, rollback.user.id));
  assert.equal(
    await db.paymentCard.count({ where: { userId: rollback.user.id } }),
    1
  );
  assert.equal(
    await db.address.count({ where: { id: rollback.unused.id } }),
    1
  );
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: rollback.user.id } }))
      .isActive,
    true
  );
  assert.equal(
    (await eraseCustomerAccount(db, "missing-fixture")).status,
    "not_found"
  );
  // Only operational logs/metrics are cleaned by a configured policy.
  const old = new Date("2000-01-01T00:00:00Z");
  await db.dataRetentionPolicy.upsert({
    where: { category: "logs" },
    create: { category: "logs", retentionPeriod: 30, autoDelete: true },
    update: { retentionPeriod: 30, autoDelete: true },
  });
  await db.dataRetentionPolicy.upsert({
    where: { category: "personal_data" },
    create: { category: "personal_data", retentionPeriod: 1, autoDelete: true },
    update: { retentionPeriod: 1, autoDelete: true },
  });
  const event = await db.emailEvent.create({
    data: {
      emailId: randomUUID(),
      email: "fixture@example.invalid",
      eventType: "SENT",
      createdAt: old,
    },
  });
  const retention = await runRetentionCleanup(db);
  assert.equal(await db.emailEvent.count({ where: { id: event.id } }), 0);
  assert.ok(retention.manualReview.includes("personal_data"));
  assert.equal(
    await db.orderInvoice.count({ where: { id: closed.invoice.id } }),
    1
  );
  console.log(
    "PASS: erasure, identity closure, invoice/address preservation, open-order review, staff denial, legacy cleanup, rollback and configured retention on disposable local fixtures."
  );
}
main()
  .finally(() => db.$disconnect())
  .catch(() => {
    console.error("Local privacy verification failed");
    process.exitCode = 1;
  });
