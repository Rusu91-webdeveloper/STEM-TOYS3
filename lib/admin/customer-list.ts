import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getPaginationParams } from "@/lib/utils/pagination";

export const paidOrders: Prisma.OrderWhereInput = {
  paymentStatus: { in: ["PAID", "COMPLETED"] },
  status: { not: "CANCELLED" },
  currency: { equals: "RON", mode: "insensitive" },
};

export async function getCustomerList(params: URLSearchParams) {
  const { page, limit, skip } = getPaginationParams(params, {
    defaultLimit: 10,
    maxLimit: 100,
  });
  const search = (params.get("search") ?? "").trim().slice(0, 200);
  const status = params.get("status");
  const sort = params.get("sortBy") ?? "newest";
  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (status === "active" || status === "inactive")
    where.isActive = status === "active";
  if (search)
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  const total = await db.user.count({ where });
  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    sort === "orders-high"
      ? [{ orders: { _count: "desc" } }, { id: "asc" }]
      : [{ createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }];
  let rankedIds: string[] | null = null;
  if (sort === "spent-high" || sort === "spent-low") {
    const direction =
      sort === "spent-high" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
    const rows = await db.$queryRaw<Array<{ id: string }>>`
      SELECT u."id" FROM "User" u
      LEFT JOIN (
        SELECT "userId", SUM("total") AS value FROM "Order"
        WHERE "paymentStatus" IN ('PAID', 'COMPLETED') AND "status" <> 'CANCELLED'
          AND UPPER("currency") = 'RON' GROUP BY "userId"
      ) paid ON paid."userId" = u."id"
      WHERE u."role" = 'CUSTOMER'
        AND (${status !== "active" && status !== "inactive"} OR u."isActive" = ${status === "active"})
        AND (${search === ""} OR u."name" ILIKE ${`%${search}%`}
          OR u."email" ILIKE ${`%${search}%`})
      ORDER BY COALESCE(paid.value, 0) ${direction}, u."id" ASC
      LIMIT ${limit} OFFSET ${skip}
    `;
    rankedIds = rows.map(row => row.id);
  }
  const users = await db.user.findMany({
    where: rankedIds ? { ...where, id: { in: rankedIds } } : where,
    orderBy,
    ...(rankedIds ? {} : { skip, take: limit }),
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      isActive: true,
      role: true,
      tags: true,
      orders: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
      _count: { select: { orders: true } },
    },
  });
  const spending = await db.order.groupBy({
    by: ["userId"],
    where: { ...paidOrders, userId: { in: users.map(user => user.id) } },
    _sum: { total: true },
  });
  const amounts = new Map(
    spending.map(row => [row.userId, row._sum.total ?? 0])
  );
  const ranks = new Map(rankedIds?.map((id, index) => [id, index]));
  if (rankedIds)
    users.sort((a, b) => (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0));
  return {
    customers: users.map(user => ({
      id: user.id,
      name: user.name || "Client",
      email: user.email,
      joined: (user.orders[0]?.createdAt ?? user.createdAt)
        .toISOString()
        .slice(0, 10),
      orders: user._count.orders,
      spent: amounts.get(user.id) ?? 0,
      status: user.isActive ? "Active" : "Inactive",
      role: user.role,
      guestCheckout: user.tags.includes("guest-checkout"),
    })),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}
