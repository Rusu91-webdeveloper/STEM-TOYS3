import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from "uploadthing/server";

import { auth } from "@/lib/auth";

const f = createUploadthing();

// Create a new instance of UTApi for server-side operations
export const utapi = new UTApi();

/**
 * Extract file key from an UploadThing URL
 * @param url UploadThing file URL (e.g., https://io9tpkvqtx.ufs.sh/f/J0I54LDkL1gooI9pmBaPLR0EJx6aNhiT2SA71B9CrZpbFW3t)
 * @returns The file key or null if not found
 */
export function extractFileKeyFromUrl(url: string): string | null {
  if (!url) return null;

  console.log(`Extracting file key from URL: ${url}`);

  try {
    // Match the specific UploadThing URL pattern (looking for the part after /f/)
    const matches = url.match(/\/f\/([^\/\?]+)/);
    if (matches && matches[1]) {
      console.log(`Extracted file key: ${matches[1]}`);
      return matches[1];
    }

    // Fallback to the original implementation
    const fallbackMatches = url.match(/\/([^\/]+)$/);
    if (fallbackMatches && fallbackMatches[1]) {
      console.log(`Extracted file key using fallback: ${fallbackMatches[1]}`);
      return fallbackMatches[1];
    }

    console.log(`Unable to extract file key from URL: ${url}`);
    return null;
  } catch (error) {
    console.error(`Error extracting file key from URL: ${url}`, error);
    return null;
  }
}

/**
 * Delete multiple files from UploadThing by their URLs
 * @param urls Array of UploadThing file URLs to delete
 * @returns Promise resolving to the deletion result
 */
export async function deleteUploadThingFiles(
  urls: string[]
): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to delete ${urls.length} files:`, urls);

  try {
    if (!urls || urls.length === 0) {
      console.log("No files to delete");
      return { success: true, message: "No files to delete" };
    }

    // Extract file keys from URLs
    const fileKeys = urls
      .map((url) => extractFileKeyFromUrl(url))
      .filter((key) => key !== null) as string[];

    console.log(`Found ${fileKeys.length} valid file keys:`, fileKeys);

    if (fileKeys.length === 0) {
      console.warn("No valid file keys found in URLs");
      return { success: false, message: "No valid file keys found in URLs" };
    }

    // Delete files using UTApi
    console.log(`Deleting files with keys:`, fileKeys);
    const result = await utapi.deleteFiles(fileKeys);
    console.log("UploadThing deletion result:", result);

    return {
      success: true,
      message: `Successfully deleted ${fileKeys.length} files`,
    };
  } catch (error) {
    console.error("Error deleting files from UploadThing:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error deleting files",
    };
  }
}

// Simple file router for UploadThing
export const ourFileRouter = {
  // Product image endpoint with minimal configuration
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      console.log("UploadThing middleware running for productImage");

      // Get the authenticated user from the session
      const session = await auth();

      // Check if the user is authenticated
      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in to upload files");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete((res) => {
      console.log("Upload complete:", res);
      return { fileUrl: res.file.ufsUrl }; // Use ufsUrl instead of url
    }),

  // Blog cover image endpoint with minimal configuration
  blogCoverImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      console.log("UploadThing middleware running for blogCoverImage");

      // Get the authenticated user from the session
      const session = await auth();

      // Check if the user is authenticated
      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in to upload files");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete((res) => {
      console.log("Blog image upload complete:", res);
      return { fileUrl: res.file.ufsUrl }; // Use ufsUrl instead of url
    }),

  // Book cover image endpoint for book covers
  bookCoverImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      console.log("UploadThing middleware running for bookCoverImage");

      // Get the authenticated user from the session
      const session = await auth();

      // Check if the user is authenticated and is an admin
      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in to upload files");
      }

      // Only admins can upload book covers
      if (session.user.role !== "ADMIN") {
        throw new Error("Forbidden: Only admins can upload book covers");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete((res) => {
      console.log("Book cover upload complete:", res);
      return { fileUrl: res.file.ufsUrl }; // Use ufsUrl instead of url
    }),

  // Category image endpoint
  categoryImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      console.log("UploadThing middleware running for categoryImage");

      // Get the authenticated user from the session
      const session = await auth();

      // Check if the user is authenticated and is an admin
      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in to upload files");
      }

      // Check for admin role - adjust according to your user/role model
      if (session.user.role !== "admin") {
        throw new Error("Forbidden: Only admins can upload category images");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete((res) => {
      console.log("Category image upload complete:", res);
      return { fileUrl: res.file.ufsUrl }; // Use ufsUrl instead of url
    }),

  // General document uploads
  document: f({ pdf: { maxFileSize: "16MB", maxFileCount: 5 } })
    .middleware(async () => {
      console.log("UploadThing middleware running for document");

      // Get the authenticated user from the session
      const session = await auth();

      // Check if the user is authenticated
      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in to upload files");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete((res) => {
      console.log("Document upload complete:", res);
      return { fileUrl: res.file.ufsUrl }; // Use ufsUrl instead of url
    }),

  // Digital book files endpoint (EPUB, PDF)
  digitalBook: f({
    blob: {
      maxFileSize: "32MB",
      maxFileCount: 10,
    },
  })
    .middleware(async () => {
      console.log("UploadThing middleware running for digitalBook");

      // Get the authenticated user from the session
      const session = await auth();

      // Check if the user is authenticated and is an admin
      if (!session?.user) {
        throw new Error("Unauthorized: You must be logged in to upload files");
      }

      // Only admins can upload digital book files
      if (session.user.role !== "ADMIN") {
        throw new Error("Forbidden: Only admins can upload digital book files");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete((res) => {
      console.log("Digital book upload complete:", res);

      // Validate file extension
      const allowedExtensions = [".epub", ".pdf"];
      const fileName = res.file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some((ext) =>
        fileName.endsWith(ext)
      );

      if (!hasValidExtension) {
        throw new Error(
          "Invalid file type. Only EPUB and PDF files are allowed for digital books."
        );
      }

      return {
        fileUrl: res.file.ufsUrl,
        fileName: res.file.name,
        fileSize: res.file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
