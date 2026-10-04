/** @jest-environment jsdom */

import { withdrawalEmailHtml } from "@/lib/email/withdrawal-email";
import {
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_DISPATCH_RO,
  RETURN_POLICY_REFUND_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
} from "@/lib/returns/policy";
import {
  createWithdrawalReceipt,
  WITHDRAWAL_ACKNOWLEDGEMENT_RO,
  WITHDRAWAL_DECLARATION_RO,
} from "@/lib/returns/withdrawal";

const receipt = createWithdrawalReceipt(
  {
    submissionId: "00000000-0000-4000-8000-000000000001",
    name: "Client Exemplu",
    email: "client@example.invalid",
    contract: "Comanda DEMO-100\nToate produsele",
    confirmed: true,
  },
  new Date("2026-10-04T22:40:27.415Z")
);

test("customer HTML retains the durable evidence and complete current policy without requiring links or images", () => {
  const html = withdrawalEmailHtml(receipt, "customer");
  for (const value of [
    receipt.name,
    receipt.email,
    receipt.reference,
    receipt.receivedAt,
    WITHDRAWAL_DECLARATION_RO,
    WITHDRAWAL_ACKNOWLEDGEMENT_RO,
    RETURN_POLICY_CUSTOMER_PAYS_RO,
    RETURN_POLICY_DISPATCH_RO,
    RETURN_POLICY_REFUND_RO,
    RETURN_POLICY_SELLER_PAYS_RO,
  ])
    expect(html).toContain(value);
  expect(html).toContain("5 octombrie 2026");
  expect(html).toContain("01:40:27");
  expect(html).toContain("Comanda DEMO-100<br>Toate produsele");
  expect(html).not.toContain("<pre");
});

test("merchant receives an operational notification with the same original evidence, not a customer greeting", () => {
  const html = withdrawalEmailHtml(receipt, "merchant");
  expect(html).toContain("Pașii pentru echipa TechTots");
  expect(html).toContain("acest mesaj nu confirmă o anulare");
  expect(html).toContain(receipt.reference);
  expect(html).toContain(receipt.receivedAt);
  expect(html).toContain(WITHDRAWAL_DECLARATION_RO);
  expect(html).not.toContain("Bună, Client Exemplu!");
  expect(html).not.toContain("Contactează echipa TechTots</a>");
});

test("submitted markup remains inert in either audience and cannot change the email links", () => {
  const malicious = {
    ...receipt,
    name: '<img src=x onerror="alert(1)">',
    contract: "<a href=\"https://evil.invalid\">click</a> & 'text'",
  };
  for (const audience of ["customer", "merchant"] as const) {
    const html = withdrawalEmailHtml(malicious, audience);
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.body.textContent).toContain(malicious.name);
    expect(document.body.textContent).toContain(malicious.contract);
    expect(document.querySelector("[onerror],script")).toBeNull();
    expect(
      [...document.querySelectorAll("a")].every(
        link =>
          link.href.startsWith("mailto:info@techtots.ro") ||
          link.href.startsWith("https://www.techtots.ro/")
      )
    ).toBe(true);
    expect([...document.querySelectorAll("img")].map(img => img.src)).toEqual([
      "https://www.techtots.ro/TechTots_LOGO.png",
    ]);
  }
});
