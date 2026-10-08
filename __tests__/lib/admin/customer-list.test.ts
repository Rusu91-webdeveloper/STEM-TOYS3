import { getCustomerList } from "@/lib/admin/customer-list";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    user: { count: jest.fn(), findMany: jest.fn() },
    order: { groupBy: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

function customer(id: string) {
  return {
    id,
    name: id,
    email: `${id}@dashboard.local`,
    createdAt: new Date("2026-10-08"),
    isActive: true,
    role: "CUSTOMER",
    tags: [],
    orders: [],
    _count: { orders: 2 },
  };
}
describe("accurate customer overview", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (db.user.count as jest.Mock).mockResolvedValue(25);
    (db.user.findMany as jest.Mock).mockResolvedValue([
      customer("one"),
      customer("two"),
    ]);
    (db.order.groupBy as jest.Mock).mockResolvedValue([
      { userId: "one", _sum: { total: 120 } },
    ]);
    (db.$queryRaw as jest.Mock).mockResolvedValue([
      { id: "two" },
      { id: "one" },
    ]);
  });
  it("calculates pagination from every matching customer", async () => {
    const result = await getCustomerList(
      new URLSearchParams("page=2&limit=10")
    );
    expect(result.pagination).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      pages: 3,
    });
    expect(result.customers[0].spent).toBe(120);
    expect(result.customers[1].spent).toBe(0);
    expect(result.customers[0]).not.toHaveProperty("password");
  });
  it("excludes unpaid, cancelled, refunded and non-RON orders from spending", async () => {
    await getCustomerList(new URLSearchParams());
    expect(db.order.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          paymentStatus: { in: ["PAID", "COMPLETED"] },
          status: { not: "CANCELLED" },
          currency: { equals: "RON", mode: "insensitive" },
        }),
      })
    );
  });
  it.each(["spent-high", "spent-low"])(
    "keeps the global spending rank for %s",
    async sort => {
      const result = await getCustomerList(
        new URLSearchParams(`sortBy=${sort}`)
      );
      expect(result.customers.map(user => user.id)).toEqual(["two", "one"]);
    }
  );
  it("reports a database failure instead of an empty customer list", async () => {
    (db.user.count as jest.Mock).mockRejectedValue(
      new Error("Database unavailable")
    );
    await expect(getCustomerList(new URLSearchParams())).rejects.toThrow(
      "Database unavailable"
    );
  });
});
