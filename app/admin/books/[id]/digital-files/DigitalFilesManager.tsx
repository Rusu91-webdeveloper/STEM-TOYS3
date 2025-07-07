"use client";

import { Upload, FileText, Trash2, Download, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useUploadThing } from "@uploadthing/react";

interface DigitalFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  format: string;
  language: string;
  isActive: boolean;
  createdAt: Date;
}

interface Book {
  id: string;
  name: string;
  author: string;
  digitalFiles: DigitalFile[];
}

interface Language {
  id: string;
  name: string;
  code: string;
  nativeName?: string;
  isAvailable: boolean;
}

interface Props {
  book: Book;
  availableLanguages: Language[];
}

export function DigitalFilesManager({ book, availableLanguages }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (files: File[]) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("bookId", book.id);
    formData.append("format", selectedFormat);
    formData.append("language", selectedLanguage);

    try {
      const response = await fetch("/api/admin/books/digital-files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const result = await response.json();

      toast.success("Fișiere încărcate cu succes!");
      setSelectedFiles([]);
      setSelectedFormat("");
      setSelectedLanguage("");
      setIsUploading(false);

      // Refresh the page to show new files
      window.location.reload();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Eroare la încărcarea fișierelor");
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validFiles = files.filter((file) => {
      const extension = file.name.toLowerCase().split(".").pop();
      return extension === "epub" || extension === "pdf";
    });

    if (validFiles.length !== files.length) {
      toast.error("Doar fișierele EPUB și PDF sunt permise");
    }

    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Selectează cel puțin un fișier");
      return;
    }

    if (!selectedFormat) {
      toast.error("Selectează formatul fișierului");
      return;
    }

    if (!selectedLanguage) {
      toast.error("Selectează limba fișierului");
      return;
    }

    setIsUploading(true);
    await uploadFiles(selectedFiles);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest fișier?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/books/digital-files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      toast.success("Fișier șters cu succes!");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Eroare la ștergerea fișierului");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Încarcă Fișiere Digitale
          </CardTitle>
          <CardDescription>
            Încarcă fișierele EPUB și PDF pentru această carte. Fișierele vor fi
            disponibile pentru descărcare după finalizarea comenzilor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="format">Format</Label>
              <Select
                value={selectedFormat}
                onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează formatul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epub">EPUB</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Limba</Label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează limba" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem
                      key={lang.id}
                      value={lang.code}>
                      {lang.nativeName || lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="files">Fișiere</Label>
              <Input
                id="files"
                type="file"
                multiple
                accept=".epub,.pdf"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Fișiere selectate:</Label>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name} ({formatFileSize(file.size)})
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full">
            {isUploading ? "Se încarcă..." : "Încarcă Fișiere"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fișiere Existente ({book.digitalFiles.length})
          </CardTitle>
          <CardDescription>
            Fișierele digitale disponibile pentru această carte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {book.digitalFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nu există fișiere digitale încărcate pentru această carte.</p>
              <p className="text-sm">
                Folosește formularul de mai sus pentru a încărca fișiere EPUB
                sau PDF.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {book.digitalFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">{file.fileName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">
                          {file.format.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{file.language}</Badge>
                        <span>{formatFileSize(file.fileSize)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Încărcat la{" "}
                        {new Date(file.createdAt).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={file.isActive ? "default" : "secondary"}>
                      {file.isActive ? "Activ" : "Inactiv"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.fileUrl, "_blank")}>
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
