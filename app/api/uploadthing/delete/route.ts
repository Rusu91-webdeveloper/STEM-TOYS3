import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "No image ID provided" },
        { status: 400 }
      );
    }

    // Delete file using UTApi
    await utapi.deleteFiles(imageId);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      },
      { status: 500 }
    );
  }
}
