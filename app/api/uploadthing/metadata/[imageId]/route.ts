import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const { imageId } = params;

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "No image ID provided" },
        { status: 400 }
      );
    }

    // Get file info using UTApi
    const file = await utapi.getFileInfo(imageId);

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: file.id,
        url: file.url,
        name: file.name,
        size: file.size,
        type: file.type,
        width: file.width,
        height: file.height,
        uploadedAt: file.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Get metadata error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get metadata",
      },
      { status: 500 }
    );
  }
}
