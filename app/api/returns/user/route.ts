import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      include: {
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}
