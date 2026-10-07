import { reconcileManualRepayments } from "@/lib/returns/manual-refund-ledger";
import { manualRefundAudit } from "@/lib/returns/manual-refund-proof";

const proof = (amountRon: number, reference = "BANK-002") => ({
  review: {
    amountRon,
    notes: "Reviewed repayment without consumer fees",
    confirmed: true as const,
  },
  reference,
  paidAt: "2026-10-01T12:00:00.000Z",
  agreedMethodAndNoFees: true as const,
});
const previous = (amount: number, reference = "BANK-001") => ({
  id: "r1",
  resolutionNotes: manualRefundAudit(proof(amount, reference), "admin"),
});
test("two partial repayments become a full repayment when their recorded amounts reach the total", () => {
  expect(
    reconcileManualRepayments([previous(100)], {
      returnId: "r2",
      orderTotal: 120,
      proof: proof(20),
    })
  ).toEqual({ fullyRefunded: true, totalMinor: 12000 });
});
test("a partial repayment keeps the order partially reimbursed", () => {
  expect(
    reconcileManualRepayments([], {
      returnId: "r2",
      orderTotal: 120,
      proof: proof(20),
    }).fullyRefunded
  ).toBe(false);
});
test("blocks cumulative repayment records over the order total", () => {
  expect(() =>
    reconcileManualRepayments([previous(100)], {
      returnId: "r2",
      orderTotal: 120,
      proof: proof(30),
    })
  ).toThrow("depășește");
});
test("the same bank proof cannot be counted twice on different returns", () => {
  expect(() =>
    reconcileManualRepayments([previous(20, "BANK-002")], {
      returnId: "r2",
      orderTotal: 120,
      proof: proof(20),
    })
  ).toThrow("alt retur");
});
test.each([null, "legacy repayment with unknown amount"])(
  "legacy records with unknown amounts require review: %s",
  resolutionNotes => {
    expect(() =>
      reconcileManualRepayments([{ id: "r1", resolutionNotes }], {
        returnId: "r2",
        orderTotal: 120,
        proof: proof(20),
      })
    ).toThrow("verifică manual");
  }
);
test("repeated recording of the same return does not add its amount twice", () => {
  expect(
    reconcileManualRepayments([{ ...previous(20, "BANK-002"), id: "r2" }], {
      returnId: "r2",
      orderTotal: 120,
      proof: proof(20),
    }).totalMinor
  ).toBe(2000);
});
test("a retry cannot silently replace its previous proof", () => {
  expect(() =>
    reconcileManualRepayments([{ ...previous(20, "BANK-002"), id: "r2" }], {
      returnId: "r2",
      orderTotal: 120,
      proof: proof(30),
    })
  ).toThrow("înlocuită");
});
