/** @jest-environment node */
import {
  sendReturnApprovedEmail,
  sendBulkReturnApprovedEmail,
} from "@/lib/email/return-templates";
import {
  COMPANY_RETURN_DESTINATION,
  type ReturnDestination,
} from "@/lib/returns/return-destination";
const mockSend = jest.fn();
jest.mock("@/lib/email/return-service", () => ({
  getReturnEmailService: () => ({
    sendEmail: (...args: unknown[]) => mockSend(...args),
  }),
}));
jest.mock("@/lib/email/base", () => ({
  getStoreSettings: () =>
    Promise.resolve({
      storeName: "TechTots",
      contactEmail: "qa@example.invalid",
    }),
  getBaseUrl: () => "https://example.invalid",
  generateEmailHTML: jest.fn(),
}));
const supplier: ReturnDestination = {
  target: "SUPPLIER",
  recipient: "Supplier TEST",
  address: "Confirmed warehouse TEST",
  authorizationNumber: "ARP-TEST",
  arriveBy: "2026-10-16T12:00:00Z",
};
const input = {
  to: "qa@example.invalid",
  customerName: "TEST",
  orderNumber: "TEST",
  orderDate: "7 octombrie",
  productName: "Robot TEST",
  quantity: 1,
  reason: "CHANGED_MIND",
};
beforeEach(() => {
  jest.clearAllMocks();
  mockSend.mockResolvedValue({ success: true });
});
test("an individual approval has the confirmed supplier destination, ARP and arrival deadline in HTML and plain text", async () => {
  await sendReturnApprovedEmail({ ...input, destination: supplier });
  const sent = mockSend.mock.calls[0][0];
  for (const text of [
    "Supplier TEST",
    "Confirmed warehouse TEST",
    "ARP-TEST",
  ]) {
    expect(sent.html).toContain(text);
    expect(sent.text).toContain(text);
  }
  expect(sent.html).toContain("16 octombrie 2026");
  expect(sent.text).toContain("16.10.2026");
  expect(sent.html.indexOf("Confirmed warehouse TEST")).toBeLessThan(
    sent.html.indexOf(COMPANY_RETURN_DESTINATION.address)
  );
});
test("missing routing evidence uses the owner-confirmed company address", async () => {
  await sendReturnApprovedEmail(input);
  expect(mockSend.mock.calls[0][0].html).toContain(
    COMPANY_RETURN_DESTINATION.address
  );
});
test("a mixed supplier/company/digital approval explains each physical destination and attaches separate documents", async () => {
  await sendBulkReturnApprovedEmail({
    ...input,
    items: [
      {
        productName: "Supplier item",
        quantity: 1,
        reason: "CHANGED_MIND",
        destination: supplier,
      },
      {
        productName: "Company item",
        quantity: 1,
        reason: "DAMAGED_IN_TRANSIT",
        destination: COMPANY_RETURN_DESTINATION,
      },
      {
        productName: "Digital",
        quantity: 1,
        reason: "CHANGED_MIND",
        isDigital: true,
      },
    ],
    pdfAttachments: [
      {
        filename: "supplier.pdf",
        content: "fixture",
        contentType: "application/pdf",
      },
      {
        filename: "company.pdf",
        content: "fixture",
        contentType: "application/pdf",
      },
    ],
  });
  const sent = mockSend.mock.calls[0][0];
  expect(sent.html).toContain("Confirmed warehouse TEST");
  expect(sent.html).toContain(COMPANY_RETURN_DESTINATION.address);
  expect(sent.html).toContain("nu expedia nimic");
  expect(sent.attachments).toHaveLength(2);
  expect(sent.html).toContain("aceeași destinație");
});
test("confirmed destination text is escaped and never injects markup", async () => {
  await sendReturnApprovedEmail({
    ...input,
    destination: { ...supplier, recipient: '<img src=x onerror="bad">' },
  });
  expect(mockSend.mock.calls[0][0].html).toContain("&lt;img");
  expect(mockSend.mock.calls[0][0].html).not.toContain("<img src=x");
});

test("customer/product content is escaped, and each attachment is clearly named in its item card", async () => {
  await sendReturnApprovedEmail({
    ...input,
    customerName: "<script>bad</script>",
    productName: '<a href="bad">toy</a>',
    pdfBase64: "fixture",
    pdfFilename: "TechTots_Retur_01_Robot.pdf",
  });
  const sent = mockSend.mock.calls[0][0];
  expect(sent.html).toContain("&lt;script&gt;");
  expect(sent.html).not.toContain('<a href="bad">');
  expect(sent.html).toContain("TechTots_Retur_01_Robot.pdf");
  expect(sent.attachments[0].filename).toBe("TechTots_Retur_01_Robot.pdf");
  expect(sent.html).toContain('role="presentation"');
});
