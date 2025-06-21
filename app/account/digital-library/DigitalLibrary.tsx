"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Book,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface DigitalFile {
  id: string;
  fileName: string;
  format: string;
  language: string;
  fileSize: number;
}

interface DigitalDownload {
  id: string;
  downloadToken: string;
  expiresAt: Date;
  downloadedAt: Date | null;
  digitalFile: DigitalFile;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  downloadCount: number;
  maxDownloads: number;
  downloadExpiresAt: Date | null;
  book: {
    id: string;
    name: string;
    author: string;
    coverImage: string | null;
    digitalFiles: DigitalFile[];
  };
  downloads: DigitalDownload[];
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date;
  total: number;
  items: OrderItem[];
}

interface Props {
  orders: Order[];
}

export function DigitalLibrary({ orders }: Props) {
  const [isGeneratingLinks, setIsGeneratingLinks] = useState<string | null>(
    null
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);
  };

  const isDownloadExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  const generateDownloadLinks = async (orderItemId: string) => {
    setIsGeneratingLinks(orderItemId);

    try {
      const response = await fetch(`/api/account/digital-downloads/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderItemId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate download links");
      }

      toast.success("Link-uri de descărcare generate cu succes!");

      // Refresh the page to show new download links
      window.location.reload();
    } catch (error) {
      console.error("Error generating download links:", error);
      toast.error("Eroare la generarea link-urilor de descărcare");
    } finally {
      setIsGeneratingLinks(null);
    }
  };

  const handleDownload = async (downloadToken: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download/${downloadToken}`);

      if (!response.ok) {
        if (response.status === 410) {
          toast.error("Link-ul de descărcare a expirat");
        } else if (response.status === 429) {
          toast.error("Ai depășit limita de descărcări pentru acest fișier");
        } else {
          toast.error("Eroare la descărcarea fișierului");
        }
        return;
      }

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Descărcare începută!");

      // Refresh to update download counts
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Eroare la descărcarea fișierului");
    }
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nu ai cărți digitale</h3>
            <p className="text-muted-foreground mb-4">
              Încă nu ai achiziționat nicio carte digitală.
            </p>
            <Button asChild>
              <a href="/products">Explorează Cărțile Noastre</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Comanda #{order.orderNumber}
                </CardTitle>
                <CardDescription>
                  Plasată la{" "}
                  {new Date(order.createdAt).toLocaleDateString("ro-RO")} •{" "}
                  {formatPrice(order.total)}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {order.items.length}{" "}
                {order.items.length === 1 ? "carte" : "cărți"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {order.items.map((item) => {
                const book = item.book;
                const hasActiveDownloads = item.downloads.some(
                  (download) => !isDownloadExpired(download.expiresAt)
                );
                const hasExpiredDownloads = item.downloads.some((download) =>
                  isDownloadExpired(download.expiresAt)
                );
                const downloadExpired = isDownloadExpired(
                  item.downloadExpiresAt
                );

                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      {book.coverImage && (
                        <img
                          src={book.coverImage}
                          alt={book.name}
                          className="w-20 h-28 object-cover rounded-md"
                        />
                      )}

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{book.name}</h3>
                        <p className="text-muted-foreground">
                          de {book.author}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Preț: {formatPrice(item.price)}
                        </p>

                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Download className="h-4 w-4" />
                            <span>
                              {item.downloadCount}/{item.maxDownloads}{" "}
                              descărcări folosite
                            </span>
                          </div>

                          {item.downloadExpiresAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4" />
                              <span
                                className={
                                  downloadExpired ? "text-red-600" : ""
                                }>
                                Expiră la{" "}
                                {new Date(
                                  item.downloadExpiresAt
                                ).toLocaleDateString("ro-RO")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Available Digital Files */}
                        {book.digitalFiles.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">
                              Formate disponibile:
                            </h4>
                            <div className="flex gap-2">
                              {book.digitalFiles.map((file) => (
                                <Badge
                                  key={file.id}
                                  variant="outline">
                                  {file.format.toUpperCase()} -{" "}
                                  {file.language === "en"
                                    ? "English"
                                    : "Română"}
                                  <span className="ml-1 text-xs">
                                    ({formatFileSize(file.fileSize)})
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Download Links */}
                        {item.downloads.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">
                              Link-uri de descărcare:
                            </h4>
                            <div className="space-y-2">
                              {item.downloads.map((download) => {
                                const expired = isDownloadExpired(
                                  download.expiresAt
                                );
                                const used = !!download.downloadedAt;

                                return (
                                  <div
                                    key={download.id}
                                    className="flex items-center justify-between p-3 border rounded-md">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-4 w-4" />
                                      <div>
                                        <p className="text-sm font-medium">
                                          {download.digitalFile.format.toUpperCase()}{" "}
                                          -{" "}
                                          {download.digitalFile.language ===
                                          "en"
                                            ? "English"
                                            : "Română"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatFileSize(
                                            download.digitalFile.fileSize
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {used && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Descărcat
                                        </Badge>
                                      )}

                                      {expired && (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Expirat
                                        </Badge>
                                      )}

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={expired}
                                        onClick={() =>
                                          handleDownload(
                                            download.downloadToken,
                                            download.digitalFile.fileName
                                          )
                                        }>
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Generate Links Button */}
                        {!downloadExpired &&
                          item.downloadCount < item.maxDownloads &&
                          (!hasActiveDownloads || hasExpiredDownloads) && (
                            <div className="mt-4">
                              <Button
                                onClick={() => generateDownloadLinks(item.id)}
                                disabled={isGeneratingLinks === item.id}>
                                {isGeneratingLinks === item.id
                                  ? "Se generează..."
                                  : "Generează Link-uri de Descărcare"}
                              </Button>
                            </div>
                          )}

                        {/* Download Limit Reached */}
                        {item.downloadCount >= item.maxDownloads && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                              Ai atins limita maximă de descărcări pentru
                              această carte.
                            </p>
                          </div>
                        )}

                        {/* Download Expired */}
                        {downloadExpired && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">
                              Perioada de descărcare pentru această carte a
                              expirat.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
