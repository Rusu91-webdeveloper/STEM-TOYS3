import { getEmailService } from "@/lib/email/index";
import { sendOrderDeliveredEmail } from "@/lib/email/order-templates";
import { getReviewInvitation } from "@/lib/products/review-invitation";

jest.mock("@/lib/products/review-invitation", () => ({
  getReviewInvitation: jest.fn(),
}));
jest.mock("@/lib/email/index", () => ({ getEmailService: jest.fn() }));
jest.mock("@/lib/email/base", () => ({
  getStoreSettings: jest.fn().mockResolvedValue({ storeName: "TechTots" }),
  getBaseUrl: () => "https://www.techtots.ro",
  generateProfessionalEmail: (content: string) => content,
  generatePreviewText: (content: string) => content,
}));
const send = jest.fn().mockResolvedValue({ success: true });
const payload = {
  to: "buyer@example.test",
  customerName: "Buyer",
  orderId: "TT-001",
  internalOrderId: "internal-1",
  orderItems: [
    { id: "item", productId: "product", name: "Kit", quantity: 1, price: 150 },
  ],
  totalAmount: 150,
  shippingAddress: "Local fixture",
  deliveredAt: "7 octombrie 2026",
};
beforeEach(() => {
  jest.clearAllMocks();
  (getEmailService as jest.Mock).mockReturnValue({ sendEmail: send });
});
it("uses the eligible persisted account review URL in the existing delivery email", async () => {
  (getReviewInvitation as jest.Mock).mockResolvedValue({
    reviewUrl:
      "https://www.techtots.ro/auth/login?callbackUrl=%2Faccount%2Forders%2Finternal-1%2Freview",
  });
  await sendOrderDeliveredEmail(payload);
  expect(getReviewInvitation).toHaveBeenCalledWith(
    "internal-1",
    "buyer@example.test"
  );
  const html = send.mock.calls[0][0].html;
  expect(html).toContain("Scrie o recenzie");
  expect(html).toContain(
    "callbackUrl=%2Faccount%2Forders%2Finternal-1%2Freview"
  );
  expect(html).not.toContain("/orders/TT-001/review");
  expect(html).not.toContain("email=buyer");
  expect(html).not.toContain("Garanție Extinsă");
  expect(html).not.toContain("testate și aprobate");
});
it("offers support when no authenticated review is eligible", async () => {
  (getReviewInvitation as jest.Mock).mockResolvedValue(null);
  await sendOrderDeliveredEmail(payload);
  expect(send.mock.calls[0][0].html).not.toContain("Scrie o recenzie");
  expect(send.mock.calls[0][0].html).toContain("Contactează-ne");
});

it("keeps the delivery confirmation available when review eligibility cannot be read", async () => {
  (getReviewInvitation as jest.Mock).mockRejectedValue(
    new Error("temporarily unavailable")
  );
  await sendOrderDeliveredEmail(payload);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0].html).toContain("Contactează-ne");
});
