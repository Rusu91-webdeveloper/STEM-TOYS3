/**
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockFindMany = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    return: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

describe("GET /api/returns/user", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the authenticated user's returns and selects scalar photos directly", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user_1",
      },
    });
    mockFindMany.mockResolvedValue([
      {
        id: "ret_1",
        reason: "DAMAGED_OR_DEFECTIVE",
        details: "",
        status: "PENDING",
        createdAt: new Date("2026-03-07T00:00:00.000Z"),
        updatedAt: new Date("2026-03-07T00:00:00.000Z"),
        photos: ["https://utfs.io/f/example"],
        order: {
          orderNumber: "ORD-1",
          createdAt: new Date("2026-03-01T00:00:00.000Z"),
        },
        orderItem: {
          name: "Toy",
          price: 45,
          quantity: 1,
          product: {
            id: "prod_1",
            name: "Toy",
            slug: "toy",
            images: ["image.jpg"],
            sku: "SKU-1",
          },
        },
      },
    ]);

    const { GET } = await import("@/app/api/returns/user/route");
    const response = await GET(new Request("http://localhost/api/returns/user"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.returns).toHaveLength(1);
    expect(payload.returns[0].photos).toEqual(["https://utfs.io/f/example"]);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" },
        select: expect.objectContaining({
          photos: true,
        }),
      })
    );
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import("@/app/api/returns/user/route");
    const response = await GET(new Request("http://localhost/api/returns/user"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });
});
