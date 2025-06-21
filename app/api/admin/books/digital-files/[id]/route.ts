import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteUploadThingFiles } from "@/lib/uploadthing";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the digital file
    const digitalFile = await db.digitalFile.findUnique({
      where: { id },
    });

    if (!digitalFile) {
      return NextResponse.json(
        { error: "Digital file not found" },
        { status: 404 }
      );
    }

    // Check if file is associated with any active downloads
    const activeDownloads = await db.digitalDownload.findMany({
      where: {
        digitalFileId: id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (activeDownloads.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete file with active download links",
          activeDownloads: activeDownloads.length,
        },
        { status: 400 }
      );
    }

    // Delete from UploadThing
    try {
      await deleteUploadThingFiles([digitalFile.fileUrl]);
      console.log(`Deleted file from UploadThing: ${digitalFile.fileUrl}`);
    } catch (uploadError) {
      console.error("Error deleting from UploadThing:", uploadError);
      // Continue with database deletion even if UploadThing deletion fails
    }

    // Delete from database
    await db.digitalFile.delete({
      where: { id },
    });

    console.log(`Successfully deleted digital file: ${digitalFile.fileName}`);

    return NextResponse.json({
      message: "Digital file deleted successfully",
      fileName: digitalFile.fileName,
    });
  } catch (error) {
    console.error("Delete digital file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
