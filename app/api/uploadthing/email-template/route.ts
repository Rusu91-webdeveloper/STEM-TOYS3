import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only admins can upload email template images",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Upload file using UTApi
    console.log("Starting file upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: session.user.id,
    });

    const uploadResult = await utapi.uploadFiles([file]);

    console.log("Upload result:", uploadResult);

    if (!uploadResult || uploadResult.length === 0 || uploadResult[0].error) {
      console.error("Upload failed:", uploadResult);
      return NextResponse.json(
        {
          success: false,
          error: `Upload failed: ${uploadResult?.[0]?.error || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    const uploadedFile = uploadResult[0].data;

    return NextResponse.json({
      success: true,
      data: {
        id: uploadedFile.id,
        url: uploadedFile.ufsUrl, // Use ufsUrl instead of deprecated url
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
      },
    });
  } catch (error) {
    console.error("Email template image upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
