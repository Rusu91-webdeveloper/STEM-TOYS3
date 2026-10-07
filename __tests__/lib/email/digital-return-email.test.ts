/** @jest-environment node */
import {
  sendReturnApprovedEmail,
  sendBulkReturnApprovedEmail,
} from "@/lib/email/return-templates";

const mockSend = jest.fn();
jest.mock("@/lib/email/index", () => ({
  getEmailService: () => ({
    sendEmail: (...args: unknown[]) => mockSend(...args),
  }),
}));
jest.mock("@/lib/email/base", () => ({
  getStoreSettings: () =>
    Promise.resolve({
      storeName: "TechTots",
      contactEmail: "test@example.invalid",
    }),
  getBaseUrl: () => "https://shop.example.invalid",
  generateEmailHTML: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockSend.mockResolvedValue({ success: true });
});
const input = {
  to: "test@example.invalid",
  customerName: "Test",
  orderNumber: "TEST",
  orderDate: "7 octombrie",
  productName: "Carte digitală",
  quantity: 1,
  reason: "CHANGED_MIND",
  pdfBase64: "fixture",
};
test("digital approval explains individual review without asking for a parcel or attaching a shipping label", async () => {
  await sendReturnApprovedEmail({ ...input, isDigital: true });
  const sent = mockSend.mock.calls[0][0];
  expect(sent.html).toContain("nu expedia nimic");
  expect(sent.html).toContain("Descărcarea singură");
  expect(sent.html).not.toContain("Atașați eticheta");
  expect(sent.attachments).toBeUndefined();
});
test("digital-only bulk approval contains no physical shipping instructions", async () => {
  await sendBulkReturnApprovedEmail({
    ...input,
    pdfBase64: undefined,
    items: [
      {
        productName: "Digital",
        quantity: 1,
        reason: "CHANGED_MIND",
        isDigital: true,
      },
    ],
  });
  expect(mockSend.mock.calls[0][0].html).toContain("nu expedia nimic");
  expect(mockSend.mock.calls[0][0].html).not.toContain("Atașați eticheta");
});
test("a mixed return gives digital review guidance alongside physical instructions", async () => {
  await sendBulkReturnApprovedEmail({
    ...input,
    items: [
      {
        productName: "Digital",
        quantity: 1,
        reason: "CHANGED_MIND",
        isDigital: true,
      },
      { productName: "Robot", quantity: 1, reason: "CHANGED_MIND" },
    ],
  });
  expect(mockSend.mock.calls[0][0].html).toContain("nu expedia nimic");
  expect(mockSend.mock.calls[0][0].html).toContain("Atașați eticheta");
});
