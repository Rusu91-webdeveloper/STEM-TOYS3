import { z } from "zod";

import { COMPANY_LEGAL } from "@/lib/config/company-legal";
import {
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_DISPATCH_RO,
  RETURN_POLICY_REFUND_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
} from "@/lib/returns/policy";

export const WITHDRAWAL_TYPE = "contract_withdrawal_v1";
export const WITHDRAWAL_DECLARATION_RO =
  "Vă informez că mă retrag din contractul identificat mai sus.";
export const WITHDRAWAL_ACKNOWLEDGEMENT_RO =
  "Această confirmare dovedește primirea declarației. Termenul de retragere și pașii pentru retur/rambursare se verifică separat; nu este necesară motivarea retragerii.";
export const withdrawalSchema = z
  .object({
    submissionId: z.string().uuid(),
    name: z.string().trim().min(1).max(150),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform(value => value.toLowerCase()),
    contract: z.string().trim().min(1).max(1000),
    confirmed: z.literal(true),
  })
  .strict();
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type WithdrawalReceipt = {
  type: typeof WITHDRAWAL_TYPE;
  reference: string;
  name: string;
  email: string;
  contract: string;
  receivedAt: string;
  customerNotified: boolean;
  merchantNotified: boolean;
  lastAttemptAt?: string;
  reviewedAt?: string;
};

export function createWithdrawalReceipt(
  input: WithdrawalInput,
  now = new Date()
): WithdrawalReceipt {
  return {
    type: WITHDRAWAL_TYPE,
    reference: `withdrawal_${input.submissionId}`,
    name: input.name,
    email: input.email,
    contract: input.contract,
    receivedAt: now.toISOString(),
    customerNotified: false,
    merchantNotified: false,
  };
}

export function receiptText(receipt: WithdrawalReceipt): string {
  const localTime = new Date(receipt.receivedAt).toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
  });
  return [
    `Confirmare de primire a retragerii — ${COMPANY_LEGAL.name}`,
    `Referință: ${receipt.reference}`,
    `Data și ora transmiterii/primirii: ${receipt.receivedAt} (${localTime}, Europe/Bucharest)`,
    `Nume: ${receipt.name}`,
    `Confirmare prin email: ${receipt.email}`,
    `Contract / comandă / produse: ${receipt.contract}`,
    `Declarație: ${WITHDRAWAL_DECLARATION_RO}`,
    WITHDRAWAL_ACKNOWLEDGEMENT_RO,
    RETURN_POLICY_CUSTOMER_PAYS_RO,
    RETURN_POLICY_REFUND_RO,
    RETURN_POLICY_SELLER_PAYS_RO,
    RETURN_POLICY_DISPATCH_RO,
    `Contact: ${COMPANY_LEGAL.email}`,
  ].join("\n");
}

export function readWithdrawalReceipt(
  value: unknown
): WithdrawalReceipt | null {
  const result = z
    .object({
      type: z.literal(WITHDRAWAL_TYPE),
      reference: z.string(),
      name: z.string(),
      email: z.string().email(),
      contract: z.string(),
      receivedAt: z.string().datetime(),
      customerNotified: z.boolean(),
      merchantNotified: z.boolean(),
      lastAttemptAt: z.string().datetime().optional(),
      reviewedAt: z.string().datetime().optional(),
    })
    .safeParse(value);
  return result.success ? result.data : null;
}
