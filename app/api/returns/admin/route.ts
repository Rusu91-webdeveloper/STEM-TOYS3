import {
  ReturnStatus,
  ReturnReason,
  ReturnLiability,
  type Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getReturnDestination,
  readDestinationEvidence,
  supplierNotesWithoutDestination,
} from "@/lib/returns/return-destination";
import {
  supplierContract,
  supplierReturnSelect,
} from "@/lib/returns/supplier-return-contracts";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      return NextResponse.json(
        { error: "Pagina sau limita este invalidă." },
        { status: 400 }
      );
    const search = (searchParams.get("search") || "").trim().slice(0, 200);
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");
    const liability = searchParams.get("liability");
    const customerSegment = searchParams.get("customerSegment");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build the query filter
    const where: Prisma.ReturnWhereInput = {};
    if (search)
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
        { orderItem: { name: { contains: search, mode: "insensitive" } } },
        {
          orderItem: {
            product: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    if (status) {
      if (!Object.values(ReturnStatus).includes(status as ReturnStatus))
        return NextResponse.json({ error: "Stare invalidă." }, { status: 400 });
      where.status = status as ReturnStatus;
    }
    if (reason) {
      if (!Object.values(ReturnReason).includes(reason as ReturnReason))
        return NextResponse.json({ error: "Motiv invalid." }, { status: 400 });
      where.reason = reason as ReturnReason;
    }
    if (liability) {
      if (
        !Object.values(ReturnLiability).includes(liability as ReturnLiability)
      )
        return NextResponse.json(
          { error: "Responsabilitate invalidă." },
          { status: 400 }
        );
      where.liability = liability as ReturnLiability;
    }
    if (
      [startDate, endDate].some(
        value => value && Number.isNaN(new Date(value).getTime())
      )
    )
      return NextResponse.json({ error: "Interval invalid." }, { status: 400 });
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Customer segment filtering requires more complex logic
    // Legacy customer segments are no longer exposed in the admin interface.
    if (customerSegment) {
      // We'll handle customer segment filtering in the query with includes
    }

    // Get returns with pagination - using select to include photos field
    const returnsQuery = {
      where,
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        refundStatus: true,
        refundError: true,
        photos: true,
        supplierAuthorizationStatus: true,
        supplierAuthorizationDeadline: true,
        supplierAuthorizationRequestedAt: true,
        supplierAuthorizationNumber: true,
        supplierAuthorizationNotes: true,
        sentToSupplierAt: true,
        sentToCourierAt: true,
        supplierMessageId: true,
        courierMessageId: true,
        liability: true,
        resolutionStatus: true,
        externalClaimDeadline: true,
        resolutionNotes: true,
        reportLogs: {
          select: {
            id: true,
            recipientType: true,
            recipientEmail: true,
            messageId: true,
            emailSubject: true,
            sentAt: true,
          },
          orderBy: {
            sentAt: "desc",
          },
          take: 10,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            total: true,
            currency: true,
            shippingCost: true,
            discountAmount: true,
            paymentMethod: true,
          },
        },
        orderItem: {
          select: {
            isDigital: true,
            id: true,
            name: true,
            price: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                supplier: {
                  select: supplierReturnSelect,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    } satisfies Prisma.ReturnFindManyArgs;

    // If customer segment filtering is needed, we need to fetch all and filter
    let returns, total;
    if (customerSegment) {
      // Get all returns that match other filters first
      const allReturns = await prisma.return.findMany({
        where,
        select: {
          id: true,
          reason: true,
          details: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          refundStatus: true,
          refundError: true,
          photos: true,
          supplierAuthorizationStatus: true,
          supplierAuthorizationDeadline: true,
          supplierAuthorizationRequestedAt: true,
          supplierAuthorizationNumber: true,
          supplierAuthorizationNotes: true,
          sentToSupplierAt: true,
          sentToCourierAt: true,
          supplierMessageId: true,
          courierMessageId: true,
          liability: true,
          resolutionStatus: true,
          externalClaimDeadline: true,
          resolutionNotes: true,
          reportLogs: {
            select: {
              id: true,
              recipientType: true,
              recipientEmail: true,
              messageId: true,
              emailSubject: true,
              sentAt: true,
            },
            orderBy: {
              sentAt: "desc",
            },
            take: 10,
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              orders: {
                select: {
                  total: true,
                  createdAt: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
              total: true,
              currency: true,
              shippingCost: true,
              discountAmount: true,
              paymentMethod: true,
            },
          },
          orderItem: {
            select: {
              isDigital: true,
              id: true,
              name: true,
              price: true,
              quantity: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                  supplier: {
                    select: supplierReturnSelect,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Filter by customer segment
      const filteredReturns = allReturns.filter(returnItem => {
        const userOrders = returnItem.user.orders;
        const totalSpent = userOrders.reduce(
          (sum, order) => sum + order.total,
          0
        );
        const orderCount = userOrders.length;

        switch (customerSegment) {
          case "new":
            return orderCount === 1;
          case "returning":
            return orderCount > 1;
          case "high-value":
            return totalSpent >= 1000;
          case "medium-value":
            return totalSpent >= 500 && totalSpent < 1000;
          case "low-value":
            return totalSpent < 500;
          default:
            return true;
        }
      });

      // Apply pagination to filtered results
      total = filteredReturns.length;
      returns = filteredReturns.slice(skip, skip + limit);

      // Remove user orders from the response (not needed in UI)
      returns = returns.map(returnItem => ({
        ...returnItem,
        user: {
          id: returnItem.user.id,
          name: returnItem.user.name,
          email: returnItem.user.email,
        },
      }));
    } else {
      // Standard query without customer segment filtering
      [returns, total] = await Promise.all([
        prisma.return.findMany(returnsQuery),
        prisma.return.count({ where }),
      ]);
    }

    return NextResponse.json({
      returns: returns.map(record => ({
        ...record,
        destination: getReturnDestination(record),
        destinationReview: readDestinationEvidence(
          record.supplierAuthorizationNotes
        ),
        supplierContract: supplierContract(record.orderItem.product?.supplier),
        supplierAuthorizationNotes: supplierNotesWithoutDestination(
          record.supplierAuthorizationNotes
        ),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching returns for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}
