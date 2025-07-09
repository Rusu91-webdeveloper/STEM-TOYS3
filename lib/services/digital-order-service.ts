import crypto from "crypto";

import { sendMail } from "@/lib/brevo";
import { emailTemplates } from "@/lib/brevoTemplates";
import { db } from "@/lib/db";

interface DigitalOrderItem {
  id: string;
  bookId: string;
  quantity: number;
  price: number;
  name: string;
}

interface DigitalOrder {
  id: string;
  orderNumber: string;
  userId: string;
  items: DigitalOrderItem[];
  user: {
    name: string;
    email: string;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

/**
 * Generate a secure download token
 */
function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Process digital book order - create download links and send email
 * @param orderId - The order ID to process
 * @param languagePreferences - Optional mapping of orderItemId to selected language
 */
export async function processDigitalBookOrder(
  orderId: string,
  languagePreferences?: Map<string, string>
): Promise<void> {
  try {
    console.log(`🔄 Processing digital book order: ${orderId}`);

    // Use raw query to avoid TypeScript issues
    const orderData = (await db.$queryRaw`
      SELECT 
        o.id as order_id,
        o."orderNumber" as order_number,
        o."userId" as user_id,
        u.email as user_email,
        u.name as user_name,
        oi.id as item_id,
        oi.name as item_name,
        oi.price as item_price,
        oi."bookId" as book_id,
        b.name as book_name,
        b.author as book_author,
        b."coverImage" as book_cover
      FROM "Order" o
      INNER JOIN "User" u ON o."userId" = u.id
      INNER JOIN "OrderItem" oi ON o.id = oi."orderId"
      LEFT JOIN "Book" b ON oi."bookId" = b.id
      WHERE o.id = ${orderId}
      AND oi."bookId" IS NOT NULL
    `) as any[];

    if (orderData.length === 0) {
      console.log(`❌ No digital book items found in order: ${orderId}`);
      return;
    }

    console.log(`📚 Found ${orderData.length} digital book items in order`);

    // Get unique books and user info
    const userInfo = {
      email: orderData[0].user_email,
      name: orderData[0].user_name,
      orderNumber: orderData[0].order_number,
    };

    const books: Array<{
      name: string;
      author: string;
      price: number;
      coverImage?: string;
    }> = [];

    const downloadLinks: Array<{
      bookName: string;
      format: string;
      language: string;
      downloadUrl: string;
      expiresAt: Date;
    }> = [];

    // Set download expiration (30 days from now)
    const downloadExpiresAt = new Date();
    downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 30);

    // Process each order item
    for (const item of orderData) {
      // Add book info (avoid duplicates)
      const existingBook = books.find(b => b.name === item.book_name);
      if (!existingBook) {
        books.push({
          name: item.book_name,
          author: item.book_author,
          price: item.item_price,
          coverImage: item.book_cover || undefined,
        });
      }

      // Get digital files for this book
      const digitalFiles = (await db.$queryRaw`
        SELECT id, "fileName", "fileUrl", "fileSize", format, language
        FROM "DigitalFile"
        WHERE "bookId" = ${item.book_id}
        AND "isActive" = true
      `) as any[];

      // Filter by selected language if specified
      const selectedLanguage = languagePreferences?.get(item.item_id);
      let filesToProcess = digitalFiles;

      if (selectedLanguage) {
        filesToProcess = digitalFiles.filter(
          (file: any) => file.language === selectedLanguage
        );
        console.log(
          `🌐 Language ${selectedLanguage} selected for ${item.book_name}`
        );
        console.log(
          `📁 Found ${filesToProcess.length} files for ${selectedLanguage} language`
        );
      } else {
        console.log(
          `⚠️  No language preference for ${item.book_name}, using all languages`
        );
      }

      // Fallback to all files if none match selected language
      if (filesToProcess.length === 0 && selectedLanguage) {
        console.warn(
          `❌ No files for ${selectedLanguage}, falling back to all languages`
        );
        filesToProcess = digitalFiles;
      }

      // Create downloads for each file
      for (const file of filesToProcess) {
        const downloadToken = generateDownloadToken();

        // Create download record
        await db.$executeRaw`
          INSERT INTO "DigitalDownload" (
            "id", "orderItemId", "userId", "digitalFileId", 
            "downloadToken", "expiresAt", "createdAt"
          ) VALUES (
            ${crypto.randomUUID()}, ${item.item_id}, ${item.user_id}, 
            ${file.id}, ${downloadToken}, ${downloadExpiresAt}, ${new Date()}
          )
        `;

        // Build download URL
        const downloadUrl = `${API_BASE_URL}/api/download/${downloadToken}`;

        downloadLinks.push({
          bookName: item.book_name,
          format: file.format,
          language: file.language,
          downloadUrl,
          expiresAt: downloadExpiresAt,
        });

        const languageName = file.language === "en" ? "English" : "Română";
        console.log(
          `✅ Created ${languageName} download: ${item.book_name} (${file.format.toUpperCase()})`
        );
      }
    }

    console.log(`🎯 Generated ${downloadLinks.length} download links`);

    // Send delivery email
    try {
      await emailTemplates.digitalBookDelivery({
        to: userInfo.email,
        customerName: userInfo.name || "Valued Customer",
        orderId: userInfo.orderNumber,
        books,
        downloadLinks,
      });

      console.log(`📧 Digital book delivery email sent to ${userInfo.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send delivery email:`, emailError);
    }

    console.log(
      `🎉 Successfully processed digital book order: ${userInfo.orderNumber}`
    );
  } catch (error) {
    console.error(`💥 Error processing digital book order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Helper function to get selected language for an order item
 * This will be enhanced once we store language selection in the database
 */
async function getSelectedLanguageForOrderItem(
  orderItemId: string
): Promise<string | null> {
  // For now, we'll implement a basic approach
  // In a full implementation, we'd store the selected language in the order item
  // or in a separate table linked to the order item

  // This is a placeholder - we'll need to modify the order creation process
  // to store the selected language information
  return null;
}

/**
 * Create download links for existing completed orders (useful for migration/backfill)
 */
export async function createDownloadLinksForOrder(
  orderId: string
): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { isDigital: true },
        },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Check if download links already exist
    const existingDownloads = await db.digitalDownload.findMany({
      where: {
        orderItem: {
          orderId: order.id,
        },
      },
    });

    if (existingDownloads.length > 0) {
      console.log(
        `Download links already exist for order ${order.orderNumber}`
      );
      return;
    }

    // Process the order
    await processDigitalBookOrder(orderId);
  } catch (error) {
    console.error(`Error creating download links for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get download status for an order
 */
export async function getOrderDownloadStatus(orderId: string) {
  const downloads = await db.digitalDownload.findMany({
    where: {
      orderItem: {
        orderId,
      },
    },
    include: {
      digitalFile: {
        include: {
          book: true,
        },
      },
      orderItem: true,
    },
  });

  return downloads.map(download => ({
    id: download.id,
    bookName: download.digitalFile.book.name,
    fileName: download.digitalFile.fileName,
    format: download.digitalFile.format,
    language: download.digitalFile.language,
    isDownloaded: !!download.downloadedAt,
    downloadedAt: download.downloadedAt,
    expiresAt: download.expiresAt,
    remainingDownloads:
      download.orderItem.maxDownloads - download.orderItem.downloadCount,
    downloadToken: download.downloadToken,
  }));
}

/**
 * Generate new download token for an existing download (in case of issues)
 */
export async function regenerateDownloadToken(
  downloadId: string
): Promise<string> {
  const newToken = generateDownloadToken();

  await db.digitalDownload.update({
    where: { id: downloadId },
    data: {
      downloadToken: newToken,
      downloadedAt: null, // Reset downloaded status
      // Extend expiration by 7 days
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return newToken;
}

export class DigitalOrderService {
  async generateDownloadLinksForOrder(orderId: string): Promise<void> {
    try {
      console.log(`🔄 Generating download links for order: ${orderId}`);

      // Get order with items
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              book: {
                include: {
                  digitalFiles: true,
                },
              },
            },
          },
          user: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Generate download links for each digital item
      for (const item of order.items) {
        if (item.book && item.book.isDigital) {
          const book = item.book;

          // Generate download links for each file
          for (const digitalFile of book.digitalFiles) {
            const downloadToken = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await db.digitalDownload.create({
              data: {
                orderItemId: item.id,
                userId: order.userId,
                digitalFileId: digitalFile.id,
                downloadToken,
                expiresAt,
              },
            });

            // Update order item with download info
            await db.orderItem.update({
              where: { id: item.id },
              data: {
                downloadExpiresAt: expiresAt,
                maxDownloads: 5, // Allow 5 downloads
              },
            });

            console.log("Generated download link", {
              orderId,
              itemId: item.id,
              fileId: digitalFile.id,
              token: `${downloadToken.substring(0, 8)  }...`,
            });
          }
        }
      }

      // Send email notification
      await this.sendDigitalDeliveryEmail(order);

      console.log("Successfully generated download links for order", {
        orderId,
      });
    } catch (error) {
      console.error("Failed to generate download links", {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async sendDigitalDeliveryEmail(order: any): Promise<void> {
    try {
      // Send email notification with download links
      const response = await fetch(
        `${API_BASE_URL}/api/email/digital-delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            customerEmail: order.user.email,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Email API returned ${response.status}`);
      }

      console.log("Digital delivery email sent", {
        orderId: order.id,
        email: order.user.email,
      });
    } catch (error) {
      console.error("Failed to send digital delivery email", {
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw here - email failure shouldn't block order processing
    }
  }
}
