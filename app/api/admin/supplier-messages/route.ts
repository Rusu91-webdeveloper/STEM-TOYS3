import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - List all supplier messages for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const category = searchParams.get("category") || "";
    const priority = searchParams.get("priority") || "";
    const isRead = searchParams.get("isRead") || "";
    const supplierId = searchParams.get("supplierId") || "";

    const where: any = {};

    if (category && category !== "ALL") {
      where.category = category;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (isRead === "true") {
      where.isRead = true;
    } else if (isRead === "false") {
      where.isRead = false;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [messages, total] = await Promise.all([
      db.supplierMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          content: true,
          priority: true,
          category: true,
          isRead: true,
          createdAt: true,
          attachments: true,
          attachmentDetails: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              contactPersonName: true,
              contactPersonEmail: true,
            },
          },
        },
      }),
      db.supplierMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
