/** @jest-environment node */
import {
  sendReturnApprovalNotification,
  sendBulkReturnApprovalNotification,
  type ApprovalReturn,
} from "@/lib/returns/approval-notification";
const mockLabel = jest.fn();
const mockSingle = jest.fn();
const mockBulk = jest.fn();
jest.mock("@/lib/return-label", () => ({
  generateReturnLabel: (...args: unknown[]) => mockLabel(...args),
}));
jest.mock("@/lib/email/return-templates", () => ({
  sendReturnApprovedEmail: (...args: unknown[]) => mockSingle(...args),
  sendBulkReturnApprovedEmail: (...args: unknown[]) => mockBulk(...args),
}));
const record: ApprovalReturn = {
  id: "ret",
  reason: "CHANGED_MIND",
  order: { id: "order", orderNumber: "TEST", createdAt: new Date() },
  orderItem: {
    name: "Physical TEST",
    quantity: 1,
    productId: "product",
    product: { supplierId: "unknown", sku: "TEST" },
  },
  user: { name: "TEST", email: "qa@example.invalid", addresses: [] },
};
beforeEach(() => {
  jest.clearAllMocks();
  mockLabel.mockResolvedValue(Buffer.from("TEST PDF"));
  mockSingle.mockResolvedValue({ success: true });
  mockBulk.mockResolvedValue({ success: true });
});
test("the same destination snapshot is used for the identification PDF and approval email", async () => {
  await sendReturnApprovalNotification(record);
  expect(mockLabel.mock.calls[0][0].destination).toEqual(
    mockSingle.mock.calls[0][0].destination
  );
  expect(mockSingle.mock.calls[0][0].destination.target).toBe("COMPANY");
});
test("bulk documents are separate per physical return and exclude digital items", async () => {
  await sendBulkReturnApprovalNotification([
    record,
    { ...record, id: "ret2" },
    {
      ...record,
      id: "digital",
      orderItem: { ...record.orderItem, isDigital: true },
    },
  ]);
  expect(mockLabel).toHaveBeenCalledTimes(2);
  const sent = mockBulk.mock.calls[0][0];
  expect(sent.pdfAttachments).toHaveLength(2);
  expect(sent.pdfAttachments[0].filename).not.toBe(
    sent.pdfAttachments[1].filename
  );
  expect(sent.items[2].destination.target).toBe("NONE");
});
test("provider failures reach the authenticated API caller instead of being reported as sent", async () => {
  mockSingle.mockResolvedValue({ success: false, error: "SMTP rejected" });
  expect((await sendReturnApprovalNotification(record)).success).toBe(false);
});
