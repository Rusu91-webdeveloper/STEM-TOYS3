import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReturnDestination } from "@/lib/returns/return-destination";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const returns = await prisma.return.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        photos: true,
        supplierAuthorizationNotes: true,
        supplierAuthorizationStatus: true,
        supplierAuthorizationNumber: true,
        supplierAuthorizationDeadline: true,
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
            isDigital: true,
            name: true,
            price: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                sku: true,
                supplierId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      returns: returns.map(record => {
        const {
          supplierAuthorizationNotes: _notes,
          supplierAuthorizationStatus: _status,
          supplierAuthorizationNumber: _number,
          supplierAuthorizationDeadline: _deadline,
          ...customerRecord
        } = record;
        return {
          ...customerRecord,
          destination:
            record.status === "APPROVED" ? getReturnDestination(record) : null,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}
