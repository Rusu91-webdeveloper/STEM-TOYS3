import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { utapi } from "@/lib/uploadthing";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const bookId = formData.get("bookId") as string;
    const format = formData.get("format") as string;
    const language = formData.get("language") as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!bookId || !format || !language) {
      return NextResponse.json(
        { error: "Missing required fields: bookId, format, or language" },
        { status: 400 }
      );
    }

    // Verify book exists
    const book = await db.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Handle language creation and book association
    await handleLanguageAssociation(bookId, language);

    // Validate file types
    const validFiles = files.filter(file => {
      const extension = file.name.toLowerCase().split(".").pop();
      return extension === "epub" || extension === "pdf";
    });

    if (validFiles.length !== files.length) {
      return NextResponse.json(
        { error: "Only EPUB and PDF files are allowed" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of validFiles) {
      try {
        // Upload directly using the File object (preserves filename)
        const uploadResult = await utapi.uploadFiles([file]);

        if (
          !uploadResult ||
          uploadResult.length === 0 ||
          uploadResult[0].error
        ) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadedFile = uploadResult[0].data;

        // Check if this exact file already exists
        const existingFile = await db.digitalFile.findUnique({
          where: {
            bookId_format_language: {
              bookId,
              format,
              language,
            },
          },
        });

        if (existingFile) {
          // Update existing file
          const updatedFile = await db.digitalFile.update({
            where: { id: existingFile.id },
            data: {
              fileName: file.name,
              fileUrl: uploadedFile.url,
              fileSize: file.size,
              isActive: true,
            },
          });
          uploadedFiles.push(updatedFile);
        } else {
          // Create new file record
          const digitalFile = await db.digitalFile.create({
            data: {
              bookId,
              fileName: file.name,
              fileUrl: uploadedFile.url,
              fileSize: file.size,
              format,
              language,
              isActive: true,
            },
          });
          uploadedFiles.push(digitalFile);
        }

        console.warn(`Successfully uploaded and saved: ${file.name}`);
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        // Continue with other files
      }
    }

    return NextResponse.json({
      message: "Files uploaded successfully",
      uploadedFiles: uploadedFiles.length,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handles language creation and book association
 * Creates the language if it doesn't exist and associates it with the book
 */
async function handleLanguageAssociation(bookId: string, languageCode: string) {
  try {
    // Check if language exists
    let language = await db.language.findUnique({
      where: { code: languageCode },
    });

    // Create language if it doesn't exist
    if (!language) {
      // Map common language codes to names
      const languageNames: Record<
        string,
        { name: string; nativeName?: string }
      > = {
        en: { name: "English", nativeName: "English" },
        ro: { name: "Romanian", nativeName: "Română" },
        es: { name: "Spanish", nativeName: "Español" },
        fr: { name: "French", nativeName: "Français" },
        de: { name: "German", nativeName: "Deutsch" },
        it: { name: "Italian", nativeName: "Italiano" },
        pt: { name: "Portuguese", nativeName: "Português" },
        // Add more mappings as needed
      };

      const languageInfo = languageNames[languageCode.toLowerCase()] || {
        name: languageCode.toUpperCase(),
        nativeName: languageCode.toUpperCase(),
      };

      language = await db.language.create({
        data: {
          code: languageCode,
          name: languageInfo.name,
          nativeName: languageInfo.nativeName,
          isAvailable: true,
        },
      });

      console.warn(`Created new language: ${language.name} (${language.code})`);
    }

    // Check if book is already associated with this language
    const existingAssociation = await db.book.findFirst({
      where: {
        id: bookId,
        languages: {
          some: {
            id: language.id,
          },
        },
      },
    });

    // Associate language with book if not already associated
    if (!existingAssociation) {
      await db.book.update({
        where: { id: bookId },
        data: {
          languages: {
            connect: { id: language.id },
          },
        },
      });

      console.warn(`Associated language ${language.name} with book ${bookId}`);
    }
  } catch (error) {
    console.error(
      `Error handling language association for ${languageCode}:`,
      error
    );
    // Don't throw here - let the file upload continue even if language association fails
  }
}
