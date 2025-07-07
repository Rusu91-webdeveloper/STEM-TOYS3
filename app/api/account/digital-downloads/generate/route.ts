import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderItemId } = await request.json();

    if (!orderItemId) {
      return NextResponse.json(
        { error: "Order item ID is required" },
        { status: 400 }
      );
    }

    // Get the order item and verify ownership
    const orderItem = await db.orderItem.findFirst({
      where: {
        id: orderItemId,
        isDigital: true,
        order: {
          userId: session.user.id,
          paymentStatus: "PAID",
        },
        book: {
          isNot: null,
        },
      },
      include: {
        book: {
          include: {
            digitalFiles: {
              where: {
                isActive: true,
              },
            },
          },
        },
        order: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Digital book not found or not owned by user" },
        { status: 404 }
      );
    }

    // Check if download period has expired
    if (
      orderItem.downloadExpiresAt &&
      new Date() > orderItem.downloadExpiresAt
    ) {
      return NextResponse.json(
        { error: "Download period has expired" },
        { status: 410 }
      );
    }

    // Check download limits
    if (orderItem.downloadCount >= orderItem.maxDownloads) {
      return NextResponse.json(
        { error: "Download limit exceeded" },
        { status: 429 }
      );
    }

    // Check if the book has digital files
    if (!orderItem.book || orderItem.book.digitalFiles.length === 0) {
      return NextResponse.json(
        { error: "No digital files available for this book" },
        { status: 404 }
      );
    }

    // Set download token expiration (7 days from now)
    const downloadExpiresAt = new Date();
    downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 7);

    // Delete any existing active download tokens for this order item
    await db.digitalDownload.deleteMany({
      where: {
        orderItemId: orderItem.id,
        expiresAt: {
          gt: new Date(),
        },
        downloadedAt: null,
      },
    });

    // Generate new download tokens for each digital file
    const downloadLinks = [];

    for (const digitalFile of orderItem.book.digitalFiles) {
      const downloadToken = generateDownloadToken();

      const downloadRecord = await db.digitalDownload.create({
        data: {
          orderItemId: orderItem.id,
          userId: session.user.id,
          digitalFileId: digitalFile.id,
          downloadToken,
          expiresAt: downloadExpiresAt,
        },
        include: {
          digitalFile: true,
        },
      });

      downloadLinks.push({
        id: downloadRecord.id,
        format: digitalFile.format,
        language: digitalFile.language,
        fileName: digitalFile.fileName,
        downloadToken,
        expiresAt: downloadExpiresAt,
        downloadUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/download/${downloadToken}`,
      });
    }

    console.log(
      `Generated ${downloadLinks.length} download links for order item ${orderItem.id}`
    );

    return NextResponse.json({
      message: "Download links generated successfully",
      orderNumber: orderItem.order.orderNumber,
      bookName: orderItem.book.name,
      downloadLinks,
      expiresAt: downloadExpiresAt,
    });
  } catch (error) {
    console.error("Generate download links error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
