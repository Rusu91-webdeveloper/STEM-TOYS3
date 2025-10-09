"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DragDropUploadZoneProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  selectedFile: File | null;
  maxSize?: number; // in MB
}

export function DragDropUploadZone({
  onFileSelect,
  onClear,
  selectedFile,
  maxSize = 5,
}: DragDropUploadZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${maxSize}MB`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Please upload CSV or Excel files only");
        } else {
          setError("Invalid file. Please try another file");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      maxFiles: 1,
      maxSize: maxSize * 1024 * 1024,
    });

  if (selectedFile) {
    return (
      <div className="relative p-6 border-2 border-dashed border-green-300 bg-green-50/50 dark:bg-green-950/20 rounded-lg transition-all animate-in fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "relative p-12 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300",
          "hover:border-primary hover:bg-primary/5 hover:scale-[1.02]",
          isDragActive &&
            !isDragReject &&
            "border-primary bg-primary/10 scale-[1.02]",
          isDragReject && "border-red-500 bg-red-50/50 dark:bg-red-950/20",
          !isDragActive && !isDragReject && "border-muted-foreground/30"
        )}
      >
        <input {...getInputProps()} />

        <div className="text-center space-y-4">
          <div
            className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto transition-all duration-300",
              isDragActive && !isDragReject && "bg-primary/20 scale-110",
              isDragReject && "bg-red-100 dark:bg-red-900/30",
              !isDragActive && "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8 transition-colors",
                isDragActive && !isDragReject && "text-primary",
                isDragReject && "text-red-600",
                !isDragActive && "text-muted-foreground"
              )}
            />
          </div>

          {isDragReject ? (
            <div>
              <h3 className="text-lg font-semibold text-red-600">
                Invalid File Type
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please drop a CSV or Excel file
              </p>
            </div>
          ) : isDragActive ? (
            <div>
              <h3 className="text-lg font-semibold text-primary">
                Drop it here!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Release to upload your file
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold">
                Drag & drop your CSV or Excel file
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse from your computer
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Supports .csv, .xls, .xlsx • Max {maxSize}MB • Max 5 products
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
