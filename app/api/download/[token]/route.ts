import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0] || realIp || "Unknown";

    console.log(`Download request for token: ${token}`);

    // Find the download record
    const download = await db.digitalDownload.findUnique({
      where: { downloadToken: token },
      include: {
        digitalFile: {
          include: {
            book: true,
          },
        },
        orderItem: {
          include: {
            order: {
              include: {
                user: true,
              },
            },
          },
        },
        user: true,
      },
    });

    if (!download) {
      console.log(`Download token not found: ${token}`);
      return NextResponse.json(
        { error: "Download link not found or expired" },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (new Date() > download.expiresAt) {
      console.log(`Download token expired: ${token}`);
      return NextResponse.json(
        { error: "Download link has expired" },
        { status: 410 }
      );
    }

    // Check if already downloaded (if downloadedAt is set)
    if (download.downloadedAt) {
      console.log(`Download token already used: ${token}`);
      return NextResponse.json(
        { error: "This download link has already been used" },
        { status: 410 }
      );
    }

    // Check download limits on the order item
    if (download.orderItem.downloadCount >= download.orderItem.maxDownloads) {
      console.log(
        `Download limit exceeded for order item: ${download.orderItemId}`
      );
      return NextResponse.json(
        { error: "Download limit exceeded for this purchase" },
        { status: 429 }
      );
    }

    // Mark download as used and increment counter
    await db.$transaction([
      db.digitalDownload.update({
        where: { id: download.id },
        data: {
          downloadedAt: new Date(),
          ipAddress,
          userAgent,
        },
      }),
      db.orderItem.update({
        where: { id: download.orderItemId },
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      }),
    ]);

    console.log(
      `Processing download for file: ${download.digitalFile.fileName}`
    );

    // Fetch the file from UploadThing
    try {
      const fileResponse = await fetch(download.digitalFile.fileUrl);

      if (!fileResponse.ok) {
        console.error(
          `Failed to fetch file from UploadThing: ${fileResponse.statusText}`
        );
        return NextResponse.json(
          { error: "File temporarily unavailable" },
          { status: 503 }
        );
      }

      const fileBuffer = await fileResponse.arrayBuffer();

      // Return the file with appropriate headers
      const response = new NextResponse(fileBuffer);

      // Set headers for file download
      response.headers.set(
        "Content-Type",
        download.digitalFile.format === "epub"
          ? "application/epub+zip"
          : "application/octet-stream"
      );

      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${download.digitalFile.fileName}"`
      );

      response.headers.set(
        "Content-Length",
        download.digitalFile.fileSize.toString()
      );

      // Security headers
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );
      response.headers.set("Pragma", "no-cache");

      console.log(`File download successful for token: ${token}`);
      return response;
    } catch (fileError) {
      console.error("Error fetching file:", fileError);
      return NextResponse.json(
        { error: "Error retrieving file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Download endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
