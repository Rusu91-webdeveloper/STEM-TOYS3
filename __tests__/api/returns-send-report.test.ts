/**
 * @jest-environment node
 */

export {};

const mockAuth = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockCreateReportLog = jest.fn();
const mockTransaction = jest.fn();
const mockGetAppConfig = jest.fn();
const mockSendEmail = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    return: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    returnReportLog: {
      create: (...args: unknown[]) => mockCreateReportLog(...args),
    },
  },
}));

jest.mock("@/lib/config/app-config", () => ({
  getAppConfig: () => mockGetAppConfig(),
}));

jest.mock("@/lib/nodemailer", () => ({
  sendEmailViaUnifiedSystem: (...args: unknown[]) => mockSendEmail(...args),
}));

const buildReturnRecord = () => ({
  id: "ret_1",
  reason: "DAMAGED_OR_DEFECTIVE",
  details: "Colțul cutiei este rupt și produsul zgâriat.",
  photos: ["https://utfs.io/f/example-1"],
  liability: "UNDECIDED",
  resolutionStatus: "OPEN",
  user: {
    name: "Ana Popescu",
    email: "ana@example.com",
  },
  order: {
    id: "order_1",
    orderNumber: "ORD-1001",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    deliveredAt: new Date("2026-03-04T10:00:00.000Z"),
    trackingNumber: "AWB123456",
    carrier: "FANCOURIER",
    shipments: [
      {
        awbNumber: "AWB123456",
        courier: "FANCOURIER",
      },
    ],
    shippingAddress: {
      addressLine1: "Str. Memorandumului 10",
      city: "Cluj-Napoca",
      state: "Cluj",
      postalCode: "400114",
    },
  },
  orderItem: {
    name: "Robot STEM",
    price: 199.99,
    quantity: 1,
    product: {
      name: "Robot STEM",
      sku: "ROBOT-1",
      images: ["robot.jpg"],
      supplier: {
        id: "sup_1",
        name: "Supplier One",
        companyName: "Supplier One SRL",
        email: "supplier@example.com",
        contactPersonEmail: "returns@supplier-one.ro",
      },
    },
  },
});

describe("POST /api/returns/[returnId]/send-report", () => {
  const originalCourierClaimsEmail = process.env.COURIER_CLAIMS_EMAIL;
  const originalSupplierEmail = process.env.SUPPLIER_EMAIL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COURIER_CLAIMS_EMAIL = "claims@courier.test";
    process.env.SUPPLIER_EMAIL = "fallback-supplier@test.local";

    mockAuth.mockResolvedValue({
      user: {
        id: "admin_1",
        role: "ADMIN",
      },
    });
    mockFindUnique.mockResolvedValue(buildReturnRecord());
    mockGetAppConfig.mockResolvedValue({
      storeName: "TechTots",
      contactEmail: "contact@techtots.ro",
      supportEmail: "contact@techtots.ro",
      contactPhone: "+40771248029",
      storePhoneFormatted: "+40 771 248 029",
      alertEmail: "admin@techtots.ro",
      fromEmail: "contact@techtots.ro",
      streetAddress: "Strada Mehedinti 54-56",
      city: "Cluj-Napoca",
      state: "Cluj",
      postalCode: "400000",
      country: "Romania",
      fullAddress: "Strada Mehedinti 54-56, Cluj-Napoca, Romania",
      legalName: "WEBIRA REM S.R.L.",
    });
    mockSendEmail.mockResolvedValue({
      success: true,
      messageId: "msg_123",
    });
    mockCreateReportLog.mockResolvedValue({
      id: "log_1",
    });
    mockUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "ret_1",
      sentToSupplierAt: data.sentToSupplierAt || null,
      sentToCourierAt: data.sentToCourierAt || null,
      supplierMessageId: data.supplierMessageId || null,
      courierMessageId: data.courierMessageId || null,
      liability: data.liability || "UNDECIDED",
      resolutionStatus: data.resolutionStatus || "OPEN",
      externalClaimDeadline: null,
      resolutionNotes: null,
      reportLogs: [
        {
          id: "log_1",
          recipientType:
            data.sentToSupplierAt ? "SUPPLIER" : "COURIER",
          recipientEmail:
            data.sentToSupplierAt
              ? "returns@supplier-one.ro"
              : "claims@courier.test",
          messageId: "msg_123",
          emailSubject: "subject",
          sentAt: new Date("2026-03-07T12:00:00.000Z").toISOString(),
        },
      ],
    }));
    mockTransaction.mockImplementation(async (callback: any) =>
      callback({
        return: {
          update: mockUpdate,
        },
        returnReportLog: {
          create: mockCreateReportLog,
        },
      })
    );
  });

  afterAll(() => {
    process.env.COURIER_CLAIMS_EMAIL = originalCourierClaimsEmail;
    process.env.SUPPLIER_EMAIL = originalSupplierEmail;
  });

  it("sends the supplier report to the product supplier contact", async () => {
    const { POST } = await import(
      "@/app/api/returns/[returnId]/send-report/route"
    );

    const response = await POST(
      new Request("http://localhost/api/returns/ret_1/send-report", {
        method: "POST",
        body: JSON.stringify({ recipientType: "supplier" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.audit.supplierMessageId).toBe("msg_123");
    expect(payload.audit.sentToSupplierAt).toBeDefined();
    expect(payload.audit.liability).toBe("SUPPLIER");
    expect(payload.audit.resolutionStatus).toBe("WAITING_SUPPLIER");
    expect(payload.audit.reportLogs).toHaveLength(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "returns@supplier-one.ro",
        from: '"TechTots" <contact@techtots.ro>',
        html: expect.stringContaining("+40 771 248 029"),
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ret_1" },
        data: expect.objectContaining({
          supplierMessageId: "msg_123",
          sentToSupplierAt: expect.any(Date),
          liability: "SUPPLIER",
          resolutionStatus: "WAITING_SUPPLIER",
        }),
      })
    );
    expect(mockCreateReportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientType: "SUPPLIER",
          recipientEmail: "returns@supplier-one.ro",
          messageId: "msg_123",
        }),
      })
    );
    expect(mockSendEmail.mock.calls[0][0].html).toContain("ROBOT-1");
    expect(mockSendEmail.mock.calls[0][0].html).toContain("AWB123456");
    expect(mockSendEmail.mock.calls[0][0].html).toContain(
      "Colțul cutiei este rupt și produsul zgâriat."
    );
  });

  it("sends the courier claim email without throwing on the template", async () => {
    const { POST } = await import(
      "@/app/api/returns/[returnId]/send-report/route"
    );

    const response = await POST(
      new Request("http://localhost/api/returns/ret_1/send-report", {
        method: "POST",
        body: JSON.stringify({ recipientType: "courier" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ returnId: "ret_1" }) }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.audit.courierMessageId).toBe("msg_123");
    expect(payload.audit.sentToCourierAt).toBeDefined();
    expect(payload.audit.liability).toBe("COURIER");
    expect(payload.audit.resolutionStatus).toBe("WAITING_COURIER");
    expect(payload.audit.reportLogs).toHaveLength(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "claims@courier.test",
        html: expect.stringContaining("AWB123456"),
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ret_1" },
        data: expect.objectContaining({
          courierMessageId: "msg_123",
          sentToCourierAt: expect.any(Date),
          liability: "COURIER",
          resolutionStatus: "WAITING_COURIER",
        }),
      })
    );
    expect(mockCreateReportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientType: "COURIER",
          recipientEmail: "claims@courier.test",
          messageId: "msg_123",
        }),
      })
    );
    expect(mockSendEmail.mock.calls[0][0].html).toContain("ROBOT-1");
    expect(mockSendEmail.mock.calls[0][0].html).toContain("01 martie 2026");
    expect(mockSendEmail.mock.calls[0][0].html).toContain(
      "Colțul cutiei este rupt și produsul zgâriat."
    );
  });
});
