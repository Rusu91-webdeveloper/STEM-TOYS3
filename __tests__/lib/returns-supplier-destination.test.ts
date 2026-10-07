/** @jest-environment node */
import { supplierCalendarDeadline } from "@/lib/returns/contract-deadline";
import { getReturnDestination, readDestinationEvidence, supplierNotesWithoutDestination, writeDestinationEvidence, type DestinationReturnRecord } from "@/lib/returns/return-destination";
import { reviewSupplierDestination, supplierContract, type ReturnSupplier, type DestinationReview } from "@/lib/returns/supplier-return-contracts";

const now = new Date("2026-10-07T12:00:00Z");
const kid: ReturnSupplier = { id: "kid", name: "Kidstory", cui: "RO39581359", businessAddress: "Depozit confirmat 80", businessCity: "București" };
const bori: ReturnSupplier = { id: "bori", name: "Boribon", cui: "RO16874325", businessAddress: "Bd. Pipera 2C, MVK", businessCity: "Voluntari" };
const record: DestinationReturnRecord = { reason: "CHANGED_MIND", supplierAuthorizationStatus: "APPROVED", supplierAuthorizationNumber: "ARP-TEST", supplierAuthorizationRequestedAt: "2026-10-05T12:00:00Z", supplierAuthorizationDeadline: "2026-10-17T12:00:00Z", orderItem: { isDigital: false, product: { supplierId: "kid" } } };
const review: DestinationReview = { target: "SUPPLIER", condition: "SEALED_UNUSED", confirmation: "Written supplier confirmation TEST", contractActiveConfirmed: true, warehouseConfirmed: true, originalDocumentsConfirmed: true, descriptionMatchesConfirmed: true, authorizationIssuedAt: "2026-10-06T12:00:00Z", supplierInvoiceAt: "2026-10-01T12:00:00Z", deliveredAt: "2026-10-02T12:00:00Z", expectedArrivalAt: "2026-10-09T12:00:00Z" };
const evidence = (r = record, v = review, supplier = kid, time = now) => reviewSupplierDestination({ record: r, review: v, supplier, reviewer: "admin", now: time });

test("KidStory sealed withdrawal records the confirmed warehouse and ten-calendar-day ARP expiry", () => {
  const proof = evidence()!;
  expect(proof.destination.address).toContain("Depozit confirmat 80");
  expect(proof.destination.arriveBy).toBe("2026-10-16T12:00:00.000Z");
  const notes = writeDestinationEvidence("Human notes", proof);
  expect(readDestinationEvidence(notes)).toEqual(proof);
  expect(supplierNotesWithoutDestination(notes)).toBe("Human notes");
  expect(getReturnDestination({ ...record, supplierAuthorizationNotes: notes }, now).target).toBe("SUPPLIER");
});
test.each([
  ["number", { supplierAuthorizationNumber: null }],
  ["approval", { supplierAuthorizationStatus: "REQUESTED" }],
  ["warehouse", {}],
])("KidStory cannot route without %s", (kind, patch) => {
  expect(() => evidence({ ...record, ...patch }, review, kind === "warehouse" ? { ...kid, businessAddress: null } : kid)).toThrow();
});
test("KidStory needs original documents for an ordinary sealed return", () => {
  expect(() => evidence(record, { ...review, originalDocumentsConfirmed: false })).toThrow("documentele originale");
});
test("KidStory refuses an arrival outside the ARP window", () => {
  expect(() => evidence(record, { ...review, expectedArrivalAt: "2026-10-17T12:00:00Z" })).toThrow("termenul");
});
test("an initial defect request uses the supplier invoice date, not customer order date", () => {
  expect(evidence({ ...record, reason: "DAMAGED_OR_DEFECTIVE" }, { ...review, condition: "MANUFACTURING_DEFECT" })).not.toBeNull();
  expect(() => evidence({ ...record, reason: "DAMAGED_OR_DEFECTIVE", supplierAuthorizationRequestedAt: "2026-10-05T12:00:00Z" }, { ...review, condition: "MANUFACTURING_DEFECT", supplierInvoiceAt: "2026-09-01T12:00:00Z" })).toThrow("garanție");
});
test("later defects can use a confirmed warranty route without the initial ten-day limit", () => {
  expect(evidence({ ...record, reason: "DAMAGED_OR_DEFECTIVE" }, { ...review, condition: "MANUFACTURING_DEFECT", supplierInvoiceAt: "2026-01-01T12:00:00Z", warrantyConfirmed: true })).not.toBeNull();
});
test("wrong KidStory items use the five-day request window and earlier invoice/delivery anchor", () => {
  expect(evidence({ ...record, reason: "WRONG_ITEM_SHIPPED" }, { ...review, condition: "WRONG_ITEM" })).not.toBeNull();
  expect(() => evidence({ ...record, reason: "WRONG_ITEM_SHIPPED", supplierAuthorizationRequestedAt: "2026-10-07T12:00:00Z" }, { ...review, condition: "WRONG_ITEM" })).toThrow("5 zile");
});
test("Boribon ordinary returns must arrive by delivery plus 18 calendar days, with no invented ARP requirement", () => {
  const r = { ...record, supplierAuthorizationNumber: null, supplierAuthorizationDeadline: null, orderItem: { product: { supplierId: "bori" } } };
  const proof = evidence(r, review, bori)!;
  expect(proof.destination.arriveBy).toBe("2026-10-20T12:00:00.000Z");
  expect(proof.destination.authorizationNumber).toBeUndefined();
  expect(() => evidence(r, { ...review, deliveredAt: "2026-09-01T12:00:00Z" }, bori)).toThrow("termenul");
});
test("opened/damaged ordinary Boribon returns use TechTots rather than automatic commercial penalties", () => {
  expect(() => evidence(record, { ...review, descriptionMatchesConfirmed: false }, bori)).toThrow("sigilat");
  expect(() => evidence(record, { ...review, condition: "MANUFACTURING_DEFECT" }, bori)).toThrow("motivului");
});
test("Boribon manufacturing defects follow confirmed warranty handling beyond 18 days", () => {
  const r = { ...record, reason: "DAMAGED_OR_DEFECTIVE", orderItem: { product: { supplierId: "bori" } } };
  expect(evidence(r, { ...review, condition: "MANUFACTURING_DEFECT", deliveredAt: "2026-01-01T12:00:00Z", warrantyConfirmed: true }, bori)).not.toBeNull();
  expect(() => evidence(r, { ...review, condition: "MANUFACTURING_DEFECT" }, bori)).toThrow("garanție");
});
test.each(["DAMAGED_IN_TRANSIT", "OTHER"])("%s cannot be sent as a normal supplier return", reason => {
  expect(() => evidence({ ...record, reason })).toThrow("TechTots");
});
test("unreviewed, corrupt, duplicate, changed or expired evidence safely uses the company destination", () => {
  const notes = writeDestinationEvidence(null, evidence());
  for (const r of [record, { ...record, supplierAuthorizationNotes: "[RETURN_DESTINATION_V1 broken]" }, { ...record, supplierAuthorizationNotes: `${notes}\n${notes}` }, { ...record, supplierAuthorizationNotes: notes, reason: "OTHER" }, { ...record, supplierAuthorizationNotes: notes, supplierAuthorizationNumber: "changed" }]) {
    expect(getReturnDestination(r, now).target).toBe("COMPANY");
  }
  expect(getReturnDestination({ ...record, supplierAuthorizationNotes: notes }, new Date("2026-10-16T12:00:00Z")).target).toBe("COMPANY");
  expect(getReturnDestination({ ...record, supplierAuthorizationNotes: notes, supplierAuthorizationDeadline: "bad-date" }, now).target).toBe("COMPANY");
});
test("digital products never acquire a physical destination", () => {
  expect(getReturnDestination({ ...record, orderItem: { isDigital: true } }, now).target).toBe("NONE");
  expect(() => evidence({ ...record, orderItem: { isDigital: true } })).toThrow("digitale");
});
test("supplier identification is exact and conflicting tax data cannot borrow a known name", () => {
  expect(supplierContract({ ...kid, cui: "11111111" })).toBeNull();
  expect(supplierContract({ ...kid, cui: null, name: "Kidstory impostor" })).toBeNull();
  expect(supplierContract({ ...bori, cui: null })).toBe("BORIBON_2026");
});
test("calendar deadlines retain Romanian local time over spring and autumn DST", () => {
  expect(new Date(supplierCalendarDeadline("2026-03-25T10:00:00Z", 10)).toISOString()).toBe("2026-04-04T09:00:00.000Z");
  expect(new Date(supplierCalendarDeadline("2026-10-20T10:00:00Z", 10)).toISOString()).toBe("2026-10-30T11:00:00.000Z");
});
