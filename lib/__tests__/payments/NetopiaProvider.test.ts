import {
  NetopiaProvider,
  NetopiaPaymentError,
  NetopiaErrorCode,
} from "../../payments/NetopiaProvider";

// Mock the Netopia SDK
jest.mock("netopia-payment2", () => ({
  __esModule: true,
  Netopia: jest.fn().mockImplementation(() => ({
    createOrder: jest.fn(),
    getStatus: jest.fn(),
    verifyAuth: jest.fn(),
  })),
  Ipn: jest.fn().mockImplementation(() => ({
    verify: jest.fn(),
  })),
}));

// Mock environment variables
const mockEnv = {
  NETOPIA_API_KEY: "test_api_key",
  NETOPIA_SIGNATURE: "test_signature",
  NETOPIA_SANDBOX: "true",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

describe("NetopiaProvider", () => {
  let provider: NetopiaProvider;
  let mockNetopia: any;
  let mockIpn: any;

  beforeEach(() => {
    // Set up environment variables
    process.env = { ...process.env, ...mockEnv };

    // Reset mocks
    jest.clearAllMocks();

    // Create provider (this will initialize the mocks)
    provider = new NetopiaProvider();
    mockNetopia = (require("netopia-payment2").Netopia as jest.Mock).mock.results[0]
      .value;
    mockIpn = (require("netopia-payment2").Ipn as jest.Mock).mock.results[0].value;
  });

  describe("initialization", () => {
    it("should initialize with valid environment variables", () => {
      expect(() => new NetopiaProvider()).not.toThrow();
    });

    it("should throw error when API key is missing", () => {
      delete process.env.NETOPIA_API_KEY;
      expect(() => new NetopiaProvider()).toThrow(NetopiaPaymentError);
      expect(() => new NetopiaProvider()).toThrow(
        "Netopia API key and signature are required"
      );
    });

    it("should throw error when signature is missing", () => {
      delete process.env.NETOPIA_SIGNATURE;
      expect(() => new NetopiaProvider()).toThrow(NetopiaPaymentError);
      expect(() => new NetopiaProvider()).toThrow(
        "Netopia API key and signature are required"
      );
    });
  });

  describe("createPayment", () => {
    const mockOrderData = {
      id: "order_123",
      amount: 100,
      currency: "RON",
      customer: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+40712345678",
      },
      metadata: { test: "value" },
    };

    it("should create payment successfully", async () => {
      const mockResponse = {
        code: 200,
        message: "Success",
        data: {
          payment: {
            paymentURL: "https://netopia.example.com/pay/123",
            ntpID: "ntp_generated_123",
          },
        },
      };

      mockNetopia.createOrder.mockResolvedValue(mockResponse);

      const result = await provider.createPayment(mockOrderData);

      expect(result).toEqual({
        paymentUrl: "https://netopia.example.com/pay/123",
        invoiceId: "ntp_generated_123",
        transactionId: "ntp_generated_123",
        status: "pending",
      });

      expect(mockNetopia.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "ro",
          notifyUrl: "http://localhost:3000/api/payments/netopia/webhook",
          redirectUrl: "http://localhost:3000/checkout/netopia/callback",
        }),
        expect.any(Object),
        expect.objectContaining({
          orderID: "order_123",
          amount: 100,
          currency: "RON",
        })
      );
    });

    it("should reject non-RON amounts", async () => {
      const usdOrderData = { ...mockOrderData, currency: "USD", amount: 50 };

      await expect(provider.createPayment(usdOrderData)).rejects.toThrow(
        "Netopia payments require RON amounts"
      );
    });

    it("should handle payment creation failure", async () => {
      mockNetopia.createOrder.mockResolvedValue({
        code: 400,
        message: "Invalid request",
      });

      await expect(provider.createPayment(mockOrderData)).rejects.toThrow(
        NetopiaPaymentError
      );

      await expect(provider.createPayment(mockOrderData)).rejects.toThrow("Invalid request");
    });

    it("should handle network errors", async () => {
      mockNetopia.createOrder.mockRejectedValue(new Error("Network error"));

      await expect(provider.createPayment(mockOrderData)).rejects.toThrow(
        NetopiaPaymentError
      );

      await expect(provider.createPayment(mockOrderData)).rejects.toThrow(
        "Payment creation failed: Network error"
      );
    });
  });

  describe("handleWebhook", () => {
    const mockPayload = {
      payment: {
        ntpID: "ntp_123",
        status: 3,
        amount: 470,
        currency: "RON",
      },
      order: {
        orderID: "order_123",
      },
    };

    it("should handle valid webhook successfully", async () => {
      mockIpn.verify.mockResolvedValue({
        errorType: 0,
        status: 1,
        message: "Valid signature",
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await provider.handleWebhook(mockPayload, "valid_signature");

      expect(mockIpn.verify).toHaveBeenCalledWith(
        "valid_signature",
        JSON.stringify(mockPayload)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Processing Netopia webhook:",
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it("should reject invalid webhook signature", async () => {
      mockIpn.verify.mockResolvedValue({
        errorType: 1,
        message: "Invalid signature",
      });

      await expect(
        provider.handleWebhook(mockPayload, "invalid_signature")
      ).rejects.toThrow(NetopiaPaymentError);

      await expect(
        provider.handleWebhook(mockPayload, "invalid_signature")
      ).rejects.toThrow("Invalid webhook signature");
    });
  });

  describe("getPaymentStatus", () => {
    it("should get payment status successfully", async () => {
      mockNetopia.getStatus.mockResolvedValue({
        code: 200,
        data: {
          status: "3",
          amount: "470",
          currency: "RON",
        },
      });

      const result = await provider.getPaymentStatus("ntp_123");

      expect(result).toEqual({
        transactionId: "ntp_123",
        status: "paid",
        amount: 470,
        currency: "RON",
      });
    });

    it("should map status codes correctly", async () => {
      const testCases = [
        { status: "3", expected: "paid" },
        { status: "5", expected: "paid" },
        { status: "4", expected: "cancelled" },
        { status: "12", expected: "failed" },
        { status: "11", expected: "failed" },
        { status: "8", expected: "refunded" },
        { status: "0", expected: "pending" },
      ];

      for (const testCase of testCases) {
        mockNetopia.getStatus.mockResolvedValue({
          code: 200,
          data: { status: testCase.status },
        });

        const result = await provider.getPaymentStatus("ntp_123");
        expect(result.status).toBe(testCase.expected);
      }
    });

    it("should handle API errors", async () => {
      mockNetopia.getStatus.mockResolvedValue({
        code: 404,
        message: "Payment not found",
      });

      await expect(provider.getPaymentStatus("invalid_id")).rejects.toThrow(
        NetopiaPaymentError
      );

      await expect(provider.getPaymentStatus("invalid_id")).rejects.toThrow(
        "Failed to get payment status"
      );
    });
  });

  describe("refund", () => {
    it("should indicate manual processing required", async () => {
      await expect(provider.refund("ntp_123", 100)).rejects.toThrow(
        NetopiaPaymentError
      );

      await expect(provider.refund("ntp_123", 100)).rejects.toThrow(
        "Refund functionality not yet implemented"
      );
    });
  });
});
