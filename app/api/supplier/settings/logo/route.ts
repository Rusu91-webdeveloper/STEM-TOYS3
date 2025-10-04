import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const logoFile = formData.get("logo") as File;

    if (!logoFile) {
      return NextResponse.json(
        { error: "Logo file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!logoFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (logoFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // In a real implementation, you would upload to a cloud storage service
    // For now, we'll simulate this by creating a data URL or storing locally
    const buffer = await logoFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${logoFile.type};base64,${base64}`;

    // Update supplier with logo URL
    const updatedSupplier = await db.supplier.update({
      where: { userId: session.user.id },
      data: { logoUrl: dataUrl },
      select: { id: true, logoUrl: true },
    });

    logger.info("Supplier logo uploaded", {
      supplierId: updatedSupplier.id,
      userId: session.user.id,
      fileSize: logoFile.size,
      fileType: logoFile.type,
    });

    return NextResponse.json({
      success: true,
      message: "Logo uploaded successfully",
      logoUrl: updatedSupplier.logoUrl,
    });
  } catch (error) {
    logger.error("Error uploading supplier logo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
