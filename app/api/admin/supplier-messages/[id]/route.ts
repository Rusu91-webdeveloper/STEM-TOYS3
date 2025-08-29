import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT - Update message (mark as read)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { isRead } = body;

    const resolvedParams = await params;
    const message = await db.supplierMessage.update({
      where: { id: resolvedParams.id },
      data: { isRead },
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
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error updating supplier message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
