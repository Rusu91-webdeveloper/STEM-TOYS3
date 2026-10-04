import { Prisma } from "@prisma/client";

import { appConfig, getAppConfig } from "@/lib/config/app-config";
import { db } from "@/lib/db";
import { withdrawalEmailHtml } from "@/lib/email/withdrawal-email";
import { sendEmailViaUnifiedSystem } from "@/lib/nodemailer";
import {
  createWithdrawalReceipt,
  readWithdrawalReceipt,
  receiptText,
  type WithdrawalInput,
} from "@/lib/returns/withdrawal";

const json = (value: object) => value as Prisma.InputJsonValue;

/** EmailLog is the existing durable email outbox. These legal receipts are NOT
 * EmailEvent analytics and are excluded from the 30-day analytics cleanup. */
export async function registerWithdrawal(
  input: WithdrawalInput,
  receivedAt = new Date()
) {
  const receipt = createWithdrawalReceipt(input, receivedAt);
  try {
    await db.emailLog.create({
      data: {
        id: receipt.reference,
        to: receipt.email,
        subject: "Confirmare de primire a retragerii",
        status: "pending",
        metadata: json(receipt),
      },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    )
      throw error;
    const existing = await db.emailLog.findUnique({
      where: { id: receipt.reference },
    });
    const saved = readWithdrawalReceipt(existing?.metadata);
    if (
      !saved ||
      saved.name !== input.name ||
      saved.email !== input.email ||
      saved.contract !== input.contract
    ) {
      throw new Error("WITHDRAWAL_REFERENCE_CONFLICT");
    }
  }
  return deliverWithdrawal(receipt.reference);
}

async function sendReceipt(
  to: string,
  subject: string,
  text: string,
  html: string
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      sendEmailViaUnifiedSystem({
        to,
        subject,
        text,
        html,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("EMAIL_TIMEOUT")), 10000);
      }),
    ]);
    // The shared mailer simulates development success; do not call that delivery.
    return result.success && !result.messageId?.startsWith("dev-");
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function deliverWithdrawal(reference: string) {
  const record = await db.emailLog.findUnique({ where: { id: reference } });
  const receipt = readWithdrawalReceipt(record?.metadata);
  if (!record || !receipt) throw new Error("WITHDRAWAL_NOT_FOUND");
  if (receipt.customerNotified && receipt.merchantNotified) return receipt;
  if (
    record.status === "sending" &&
    receipt.lastAttemptAt &&
    Date.now() - Date.parse(receipt.lastAttemptAt) < 5 * 60000
  )
    return receipt;

  const claimed = { ...receipt, lastAttemptAt: new Date().toISOString() };
  // CAS prevents simultaneous submissions/retries from sending duplicate emails.
  const lock = await db.emailLog.updateMany({
    where: {
      id: reference,
      status: record.status,
      metadata: { equals: json(receipt) },
    },
    data: { status: "sending", metadata: json(claimed) },
  });
  if (!lock.count) return receipt;
  const text = receiptText(receipt);
  const config = await getAppConfig().catch(() => appConfig);
  const [customerNotified, merchantNotified] = await Promise.all([
    receipt.customerNotified ||
      sendReceipt(
        receipt.email,
        "TechTots — confirmare de primire a retragerii",
        text,
        withdrawalEmailHtml(receipt, "customer")
      ),
    receipt.merchantNotified ||
      sendReceipt(
        config.contactEmail,
        `TechTots — retragere nouă · ${reference.slice(-8).toUpperCase()}`,
        text,
        withdrawalEmailHtml(receipt, "merchant")
      ),
  ]);
  const updated = { ...claimed, customerNotified, merchantNotified };
  await db.emailLog.updateMany({
    where: {
      id: reference,
      status: "sending",
      metadata: { equals: json(claimed) },
    },
    data: {
      metadata: json(updated),
      status: customerNotified && merchantNotified ? "sent" : "failed",
      sentAt: customerNotified ? new Date() : null,
    },
  });
  return updated;
}
